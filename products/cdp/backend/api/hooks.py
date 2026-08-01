from typing import cast
from urllib.parse import urlparse

from django.core.exceptions import ValidationError
from django.http import Http404

from rest_framework import exceptions, mixins, serializers, status, viewsets
from rest_framework.response import Response

from insights.api.routing import TeamAndOrgViewSetMixin
from insights.cdp.templates.zapier.template_zapier import template as template_zapier
from insights.models.user import User

from products.cdp.backend.api.insights_function import InsightsFunctionSerializer
from products.cdp.backend.models.insights_functions.insights_function import InsightsFunction
from products.cdp.backend.models.hook import HOOK_EVENTS, Hook


def create_zapier_insights_function(hook: Hook, serializer_context: dict, from_migration: bool = False) -> InsightsFunction:
    description = template_zapier.description
    if from_migration:
        description = f"{description} Migrated from legacy hook {hook.id}."

    serializer = InsightsFunctionSerializer(
        data={
            "template_id": template_zapier.id,
            "type": "destination",
            "name": f"Zapier webhook for action {hook.resource_id}",
            "description": description,
            "filters": {"actions": [{"id": str(hook.resource_id), "name": "", "type": "actions", "order": 0}]},
            "inputs": {
                "hook": {
                    "value": hook.target.replace("https://hooks.zapier.com/", ""),
                },
                "body": {
                    # NOTE: This is for backwards compatibility with the old webhook format
                    "value": {
                        "data": {
                            "event": "{event.event}",
                            "person": {"uuid": "{person.id}", "properties": "{person.properties}"},
                            "teamId": "{project.id}",
                            "eventUuid": "{event.uuid}",
                            "timestamp": "{event.timestamp}",
                            "distinctId": "{event.distinct_id}",
                            "properties": "{event.properties}",
                        },
                        "hook": {
                            "id": "{event.uuid}",
                            "event": "{event.event}",
                            "target": "https://hooks.zapier.com/{inputs.hook}",
                        },
                    }
                },
            },
            "enabled": True,
            "icon_url": template_zapier.icon_url,
        },
        context=serializer_context,
    )
    serializer.is_valid(raise_exception=True)
    return InsightsFunction(**serializer.validated_data)


class HookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hook
        fields = ("id", "created", "updated", "event", "target", "resource_id", "team")
        read_only_fields = ("team",)

    def validate_event(self, event):
        if event not in HOOK_EVENTS:
            raise exceptions.ValidationError(detail=f"Unexpected event {event}")
        return event

    def validate_target(self, target):
        if not valid_domain(target):
            raise exceptions.ValidationError(detail=f"'hooks.zapier.com' is the only allowed target domain")
        return target


# NOTE: This is a special API used by zapier. It will soon be deprecated completely in favour of script functions
class HookViewSet(
    TeamAndOrgViewSetMixin,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    Retrieve, create, update or destroy REST hooks.
    """

    scope_object = "webhook"
    # NOTE: This permissions is needed for Zapier calls but we don't want to expose it in the API docs until
    # it is able to support more than Zapier
    hide_api_docs = True
    queryset = Hook.objects.all()
    ordering = "-created_at"
    serializer_class = HookSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        hook = Hook(**serializer.validated_data)

        insights_function = create_zapier_insights_function(hook, serializer_context=self.get_serializer_context())
        insights_function.save()

        response_serializer = self.get_serializer(
            data={
                "id": insights_function.id,
                "event": serializer.validated_data["event"],
                "target": serializer.validated_data["target"],
                "resource_id": serializer.validated_data.get("resource_id"),
                "team": self.team.id,
            }
        )
        response_serializer.is_valid(raise_exception=False)

        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        user = cast(User, self.request.user)
        serializer.save(user=user, team_id=self.team_id)

    def destroy(self, request, *args, **kwargs):
        found = False
        try:
            instance = self.get_object()
            found = True

            # We do this by finding one where the description contains the hook id
            fns = InsightsFunction.objects.filter(
                team_id=self.team_id,
                template_id=template_zapier.id,
                description__icontains=f"{instance.id}",
            )

            for fn in fns:
                fn.enabled = False
                fn.deleted = True
                fn.save()

            self.perform_destroy(instance)

        except (Hook.DoesNotExist, Http404):
            pass

        if not found:
            # Otherwise we try and delete the script function by id
            try:
                insights_function = InsightsFunction.objects.get(
                    team_id=self.team_id, template_id=template_zapier.id, id=kwargs["pk"]
                )
                insights_function.enabled = False
                insights_function.deleted = True
                insights_function.save()
                found = True
            except (InsightsFunction.DoesNotExist, ValidationError):
                pass

        if found:
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)


def valid_domain(url) -> bool:
    target_domain = urlparse(url).netloc
    return target_domain == "hooks.zapier.com"
