import enum
from types import SimpleNamespace
from typing import TYPE_CHECKING, Optional

from django.conf import settings
from django.db import models
from django.db.models import QuerySet
from django.db.models.signals import post_delete, post_save
from django.dispatch.dispatcher import receiver

import structlog
from prometheus_client import Counter

from insights.helpers.encrypted_fields import EncryptedJSONStringField
from insights.models.action.action import Action
from insights.models.file_system.file_system_mixin import FileSystemSyncMixin
from insights.models.file_system.file_system_representation import FileSystemRepresentation
from insights.models.insights_function_template import InsightsFunctionTemplate
from insights.models.plugin import sync_team_inject_web_apps
from insights.models.signals import mutable_receiver
from insights.models.team.team import Team
from insights.models.utils import UUIDTModel
from insights.plugins.plugin_server_api import (
    get_insights_function_status,
    patch_insights_function_status,
    reload_insights_functions_on_workers,
)
from insights.utils import absolute_uri

if TYPE_CHECKING:
    from insights.models.team import Team

DEFAULT_STATE = {"state": 0, "tokens": 0}

logger = structlog.get_logger(__name__)

GEOIP_TRANSFORMATION_CREATION_FAILED_COUNTER = Counter(
    "posthog_geoip_transformation_creation_failed_total",
    "Number of times GeoIP transformation creation failed for new teams",
)


class InsightsFunctionState(enum.Enum):
    UNKNOWN = 0
    HEALTHY = 1
    DEGRADED = 2
    DISABLED = 3
    FORCEFULLY_DEGRADED = 11
    FORCEFULLY_DISABLED = 12


class InsightsFunctionType(models.TextChoices):
    DESTINATION = "destination"
    SITE_DESTINATION = "site_destination"
    INTERNAL_DESTINATION = "internal_destination"
    SOURCE_WEBHOOK = "source_webhook"
    WAREHOUSE_SOURCE_WEBHOOK = "warehouse_source_webhook"
    SITE_APP = "site_app"
    TRANSFORMATION = "transformation"


TYPES_THAT_RELOAD_PLUGIN_SERVER = (
    InsightsFunctionType.DESTINATION,
    InsightsFunctionType.TRANSFORMATION,
    InsightsFunctionType.INTERNAL_DESTINATION,
    InsightsFunctionType.SOURCE_WEBHOOK,
    InsightsFunctionType.WAREHOUSE_SOURCE_WEBHOOK,
)
TYPES_WITH_TRANSPILED_FILTERS = (InsightsFunctionType.SITE_DESTINATION, InsightsFunctionType.SITE_APP)
TYPES_WITH_JAVASCRIPT_SOURCE = (InsightsFunctionType.SITE_DESTINATION, InsightsFunctionType.SITE_APP)


class InsightsFunction(FileSystemSyncMixin, UUIDTModel):
    class Meta:
        indexes = [
            models.Index(fields=["type", "enabled", "team"]),
        ]

    team = models.ForeignKey("Team", on_delete=models.CASCADE)
    name = models.CharField(max_length=400, null=True, blank=True)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, blank=True)
    created_by = models.ForeignKey("User", on_delete=models.SET_NULL, null=True, blank=True)
    deleted = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    enabled = models.BooleanField(default=False)
    type = models.CharField(max_length=24, null=True, blank=True)

    # DEPRECATED: This was an idea that is no longer used
    kind = models.CharField(max_length=24, null=True, blank=True)

    icon_url = models.TextField(null=True, blank=True)

    # Hog source, except for the "site_*" types, when it contains TypeScript Source
    hog = models.TextField()
    # Used when the source language is Hog (everything except the "site_*" types)
    bytecode = models.JSONField(null=True, blank=True)
    # Transpiled JavasScript. Used with the "site_*" types
    transpiled = models.TextField(null=True, blank=True)

    inputs_schema = models.JSONField(null=True)
    inputs = models.JSONField(null=True)
    encrypted_inputs: EncryptedJSONStringField = EncryptedJSONStringField(null=True, blank=True)

    filters = models.JSONField(null=True, blank=True)
    mappings = models.JSONField(null=True, blank=True)
    masking = models.JSONField(null=True, blank=True)
    template_id = models.CharField(max_length=400, null=True, blank=True)
    insights_function_template = models.ForeignKey(
        "insights.InsightsFunctionTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="insights_functions",
    )
    execution_order = models.PositiveSmallIntegerField(null=True, blank=True)

    batch_export = models.ForeignKey(
        "insights.BatchExport",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    @classmethod
    def get_file_system_unfiled(cls, team: "Team") -> QuerySet["InsightsFunction"]:
        base_qs = InsightsFunction.objects.filter(team=team, deleted=False)
        return cls._filter_unfiled_queryset(base_qs, team, type__startswith="insights_function/", ref_field="id")

    def get_file_system_representation(self) -> FileSystemRepresentation:
        folder = "Unfiled/Destinations"
        href = f"/pipeline/destinations/hog-{self.pk}/configuration"
        type = self.type

        if self.type == InsightsFunctionType.SITE_APP:
            folder = "Unfiled/Site apps"
            href = f"/pipeline/site-apps/hog-{self.pk}/configuration"
        elif self.type == InsightsFunctionType.TRANSFORMATION:
            folder = "Unfiled/Transformations"
            href = f"/pipeline/transformations/hog-{self.pk}/configuration"
        elif self.type == InsightsFunctionType.SOURCE_WEBHOOK:
            folder = "Unfiled/Sources"
            href = f"/functions/{self.pk}/configuration"

        return FileSystemRepresentation(
            base_folder=self._get_assigned_folder(folder),
            type=f"insights_function/{type}",  # sync with APIScopeObject in scopes.py
            ref=str(self.pk),
            name=self.name or "Untitled",
            href=href,
            meta={
                "created_at": str(self.created_at),
                "created_by": self.created_by_id,
            },
            should_delete=self.deleted,
        )

    @property
    def template(self) -> Optional[InsightsFunctionTemplate]:
        if self.insights_function_template:
            return self.insights_function_template

        if not self.template_id:
            return None

        return InsightsFunctionTemplate.get_template(self.template_id)

    @property
    def filter_action_ids(self) -> list[int]:
        if not self.filters:
            return []
        try:
            return [int(action["id"]) for action in self.filters.get("actions", [])]
        except KeyError:
            return []

    _status: Optional[dict] = None

    @property
    def status(self) -> dict:
        if not self.enabled:
            return DEFAULT_STATE

        if self._status:
            return self._status

        try:
            status = DEFAULT_STATE
            res = get_insights_function_status(self.team_id, self.id)
            if res.status_code == 200:
                status = res.json()
        except Exception as e:
            logger.exception("Failed to fetch function status", error=str(e))

        self._status = status

        return status

    def set_function_status(self, state: int) -> dict:
        if not self.enabled:
            return self.status
        try:
            res = patch_insights_function_status(self.team_id, self.id, state)
            if res.status_code == 200:
                self._status = res.json()
        except Exception as e:
            logger.exception("Failed to set function status", error=str(e))

        return self.status

    def move_secret_inputs(self):
        # Moves any secret inputs to the encrypted_inputs var
        raw_inputs = self.inputs or {}
        raw_encrypted_inputs = self.encrypted_inputs or {}

        final_inputs = {}
        final_encrypted_inputs = {}

        for schema in self.inputs_schema or []:
            value = raw_inputs.get(schema["key"])
            encrypted_value = raw_encrypted_inputs.get(schema["key"])

            if not schema.get("secret"):
                final_inputs[schema["key"]] = value
            else:
                # We either store the incoming value if given or the encrypted value
                final_encrypted_inputs[schema["key"]] = value or encrypted_value

        self.inputs = final_inputs
        self.encrypted_inputs = final_encrypted_inputs

    @property
    def url(self):
        return absolute_uri(f"/project/{self.team_id}/pipeline/destinations/hog-{str(self.id)}")

    def save(self, *args, **kwargs):
        from insights.cdp.filters import compile_filters_bytecode

        self.move_secret_inputs()
        if self.type not in TYPES_WITH_TRANSPILED_FILTERS:
            self.filters = compile_filters_bytecode(self.filters, self.team)

        return super().save(*args, **kwargs)

    def __str__(self):
        return f"InsightsFunction {self.id}: {self.name}"


@receiver(post_save, sender=InsightsFunction)
def insights_function_saved(sender, instance: InsightsFunction, created, **kwargs):
    if instance.type is None or instance.type in TYPES_THAT_RELOAD_PLUGIN_SERVER:
        reload_insights_functions_on_workers(team_id=instance.team_id, insights_function_ids=[str(instance.id)])


@receiver(post_save, sender=Action)
def action_saved(sender, instance: Action, created, **kwargs):
    # Whenever an action is saved we want to load all custom functions using it
    # and trigger a refresh of the filters bytecode

    from insights.tasks.insights_functions import refresh_affected_insights_functions

    refresh_affected_insights_functions.delay(action_id=instance.id)


@receiver(post_save, sender=Team)
def team_saved(sender, instance: Team, created, **kwargs):
    from insights.tasks.insights_functions import refresh_affected_insights_functions

    refresh_affected_insights_functions.delay(team_id=instance.id)


@mutable_receiver([post_save, post_delete], sender=InsightsFunction)
def team_inject_web_apps_changd(sender, instance, created=None, **kwargs):
    try:
        team = instance.team
    except Team.DoesNotExist:
        team = None
    if team is not None:
        # This controls whether /decide makes extra queries to get the site apps or not
        sync_team_inject_web_apps(instance.team)


@receiver(models.signals.post_save, sender=Team)
def enabled_default_insights_functions_for_new_team(sender, instance: Team, created: bool, **kwargs):
    from insights.api.insights_function import InsightsFunctionSerializer
    from insights.cdp.templates.insights_function_template import sync_template_to_db
    from insights.models.insights_function_template import InsightsFunctionTemplate
    from insights.plugins.plugin_server_api import get_insights_function_templates

    if settings.DISABLE_MMDB or not created:
        return

    # try and get the geoip template from db (might not exist yet, e.g. for local dev & hobby deploy)
    template = InsightsFunctionTemplate.get_template("template-geoip")

    # if it does not exist sync it to the db
    if not template:
        logger.info("GeoIP template not found in DB, attempting to sync")
        try:
            # gets templates from node-land (including geo-ip)
            response = get_insights_function_templates()
            if response.status_code == 200:
                templates = response.json()
                for template_data in templates:
                    if template_data.get("id") == "template-geoip":
                        # sync template to db, which returns the created template
                        template = sync_template_to_db(template_data)
                        break
        except Exception as e:
            logger.exception(
                "Failed to sync GeoIP template from Node.js",
                team_id=instance.id,
                error=str(e),
            )

    if template:
        # Create a serializer data dictionary from the template
        serializer_data = {
            "template_id": template.template_id,
            "type": "transformation",
            "name": template.name,
            "description": template.description or "Adds geoip data to the event",
            "icon_url": template.icon_url or "/static/transformations/geoip.png",
            "fn": template.code,
            "inputs_schema": template.inputs_schema,
            "enabled": True,
            "execution_order": 1,
        }
        # Create a mock request with the user
        mock_request = SimpleNamespace(user=kwargs.get("initiating_user"))

        # Use the serializer to create the InsightsFunction
        serializer = InsightsFunctionSerializer(
            data=serializer_data,
            context={
                "get_team": lambda: instance,
                "is_create": True,
                "request": mock_request,
            },
        )

        if serializer.is_valid():
            serializer.save()
        else:
            logger.error(
                "Failed to create default GeoIP transformation during team creation",
                team_id=instance.id,
                errors=serializer.errors,
            )
            GEOIP_TRANSFORMATION_CREATION_FAILED_COUNTER.inc()
    else:
        logger.error("GeoIP template not found, transformation not created", team_id=instance.id)
        GEOIP_TRANSFORMATION_CREATION_FAILED_COUNTER.inc()
