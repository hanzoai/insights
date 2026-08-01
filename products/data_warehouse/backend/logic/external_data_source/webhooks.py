import dataclasses
from typing import Any

from django.conf import settings

from insights.models import Team

from products.cdp.backend.models.insights_function_template import InsightsFunctionTemplate
from products.cdp.backend.models.insights_functions.insights_function import InsightsFunction
from products.warehouse_sources.backend.facade.models import ExternalDataSchema
from products.warehouse_sources.backend.facade.source_management import (
    Config,
    WebhookCreationResult,
    WebhookDeletionResult,
    WebhookSource,
    WebhookSyncResult,
)


def get_webhook_url(insights_function_id: str) -> str:
    webhooks_host = {
        "US": "https://webhooks.us.hanzo.ai",
        "EU": "https://webhooks.eu.hanzo.ai",
        "DEV": "https://app.dev.insights.dev",
    }.get((settings.CLOUD_DEPLOYMENT or "").upper(), settings.SITE_URL)
    return f"{webhooks_host}/public/webhooks/dwh/{insights_function_id}"


@dataclasses.dataclass
class WebhookSetupResult:
    success: bool
    webhook_url: str = ""
    error: str | None = None
    pending_inputs: list[str] = dataclasses.field(default_factory=list)


@dataclasses.dataclass
class WebhookInsightsFunctionCreateResult:
    insights_function: InsightsFunction | None = None
    webhook_url: str = ""
    error: str | None = None
    insights_function_created: bool = False


def get_or_create_webhook_insights_function(
    team: Team,
    source: WebhookSource,
    source_id: str,
    eligible_schemas: list[ExternalDataSchema],
    extra_inputs: dict[str, Any] | None = None,
    config: Config | None = None,
) -> WebhookInsightsFunctionCreateResult:
    """Create or update a InsightsFunction for webhook-based data imports."""

    webhook_template = source.webhook_template
    if not webhook_template:
        return WebhookInsightsFunctionCreateResult(error="No webhook template available for this source")

    schema_mapping: dict[str, str] = {}

    for schema in eligible_schemas:
        # `webhook_mapping_key` defaults to the resource-map translation, falling back to the
        # schema name when the map has no entry (e.g. Slack channels use the channel ID as both
        # the schema name and the webhook event key, so there's nothing to translate). Sources
        # with namespaced schemas (GitHub repos) override it to emit namespace-qualified keys.
        # Callers pre-filter `eligible_schemas` to schemas the source declared as
        # webhook-eligible, so this only fires for schemas we genuinely want events routed to.
        schema_mapping[source.webhook_mapping_key(schema.name)] = str(schema.id)

    db_template = InsightsFunctionTemplate.get_template(webhook_template.id)
    if not db_template:
        return WebhookInsightsFunctionCreateResult(
            error="Webhook template not found in database. Please run sync_insights_function_templates."
        )

    inputs: dict[str, Any] = {
        "schema_mapping": {"value": schema_mapping},
        "source_id": {"value": source_id},
    }
    # Static template inputs the source pins on every write (GitHub's legacy_repository, which gates
    # the template's bare-event fallback). Set here rather than merged so it survives a rewrite of
    # `inputs` on update and can't drift out of sync with the schema mapping.
    if config is not None:
        inputs.update({key: {"value": value} for key, value in source.webhook_template_inputs(config).items()})
    if extra_inputs:
        inputs.update({key: {"value": value} for key, value in extra_inputs.items()})

    try:
        existing_hog = InsightsFunction.objects.get(
            team=team,
            type="warehouse_source_webhook",
            inputs__source_id__value=source_id,
            deleted=False,
        )
        if existing_hog.inputs:
            existing_mapping = existing_hog.inputs.get("schema_mapping", {}).get("value", {})
        else:
            existing_mapping = {}
    except InsightsFunction.DoesNotExist:
        existing_mapping = {}

    insights_function, created = InsightsFunction.objects.update_or_create(
        team=team,
        type="warehouse_source_webhook",
        inputs__source_id__value=source_id,
        defaults={
            "name": db_template.name,
            "description": db_template.description or "",
            "script": db_template.code,
            "icon_url": db_template.icon_url,
            "enabled": True,
            "deleted": False,
            "template_id": db_template.template_id,
            "insights_function_template": db_template,
            "inputs_schema": db_template.inputs_schema,
            "inputs": inputs,
        },
    )

    # Merge with any existing schema_mapping from a previous call
    merged_mapping = {**existing_mapping, **schema_mapping}

    if merged_mapping != schema_mapping:
        insights_function.inputs = {
            **(insights_function.inputs or {}),
            "schema_mapping": {"value": merged_mapping},
        }
        insights_function.save(update_fields=["inputs", "encrypted_inputs"])

    webhook_url = get_webhook_url(insights_function.id)

    return WebhookInsightsFunctionCreateResult(
        insights_function=insights_function, webhook_url=webhook_url, insights_function_created=created
    )


def create_and_register_webhook(
    source: WebhookSource,
    config: Config,
    hog_fn_result: WebhookInsightsFunctionCreateResult,
    team_id: int,
    api_version: str | None = None,
) -> WebhookSetupResult:
    """Create the external webhook and save any extra inputs (e.g. signing secret) onto the InsightsFunction."""
    assert hog_fn_result.insights_function is not None

    result: WebhookCreationResult = source.create_webhook(
        config, hog_fn_result.webhook_url, team_id, api_version=api_version
    )

    if result.success and result.extra_inputs:
        insights_function = hog_fn_result.insights_function
        assert insights_function.inputs is not None
        insights_function.inputs = {
            **insights_function.inputs,
            **{key: {"value": value} for key, value in result.extra_inputs.items()},
        }
        insights_function.save(update_fields=["inputs", "encrypted_inputs"])

    return WebhookSetupResult(
        success=result.success,
        webhook_url=hog_fn_result.webhook_url,
        error=result.error,
        pending_inputs=list(result.pending_inputs),
    )


def reconcile_webhook_events(
    source: WebhookSource,
    config: Config,
    hog_fn_result: WebhookInsightsFunctionCreateResult,
    team_id: int,
    eligible_schema_names: list[str],
    api_version: str | None = None,
) -> WebhookSyncResult:
    """Reconcile a registered webhook's events with the selected schemas (no-op by default)."""
    return source.sync_webhook_events(
        config, hog_fn_result.webhook_url, team_id, eligible_schema_names, api_version=api_version
    )


@dataclasses.dataclass
class WebhookDeletionSetupResult:
    success: bool
    external_deleted: bool = False
    error: str | None = None


def delete_webhook_and_insights_function(
    team: Team,
    source: WebhookSource,
    config: Config,
    source_id: str,
    api_version: str | None = None,
) -> WebhookDeletionSetupResult:
    """Delete the InsightsFunction and attempt to remove the external webhook."""

    try:
        insights_function = InsightsFunction.objects.get(
            team=team,
            type="warehouse_source_webhook",
            inputs__source_id__value=source_id,
            deleted=False,
        )
    except InsightsFunction.DoesNotExist:
        return WebhookDeletionSetupResult(success=True, external_deleted=False)

    webhook_url = get_webhook_url(insights_function.id)

    external_result: WebhookDeletionResult = source.delete_webhook(
        config, webhook_url, team.pk, api_version=api_version
    )

    insights_function.deleted = True
    insights_function.enabled = False
    insights_function.save(update_fields=["deleted", "enabled"])

    return WebhookDeletionSetupResult(
        success=True,
        external_deleted=external_result.success,
        error=external_result.error if not external_result.success else None,
    )
