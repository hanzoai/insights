from typing import Any

from rest_framework import request, response, serializers, viewsets
from rest_framework.serializers import BaseSerializer

from insights.api.routing import TeamAndOrgViewSetMixin
from insights.kafka_client.routing import get_producer
from insights.kafka_client.topics import KAFKA_APP_METRICS2
from insights.models.event.util import format_datastore_timestamp
from insights.utils import cast_timestamp_or_now

from products.cdp.backend.models.plugin import PluginConfig


class MetalyticsCreateRequestSerializer(serializers.Serializer):
    metric_name = serializers.ChoiceField(choices=["viewed"], required=True)
    instance_id = serializers.CharField(required=True)


class MetalyticsViewSet(TeamAndOrgViewSetMixin, viewsets.GenericViewSet):
    scope_object = "INTERNAL"
    queryset = PluginConfig.objects.all()

    def get_serializer_class(self) -> type[BaseSerializer]:
        return MetalyticsCreateRequestSerializer if self.action == "create" else MetalyticsCreateRequestSerializer

    def create(self, request: request.Request, *args: Any, **kwargs: Any) -> response.Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        payload = {
            **validated_data,
            "team_id": self.team_id,
            "app_source_id": self.request.user.pk,
            "app_source": "metalytics",
            "count": 1,
            "timestamp": format_datastore_timestamp(cast_timestamp_or_now(None)),
        }

        get_producer(topic=KAFKA_APP_METRICS2).produce(topic=KAFKA_APP_METRICS2, data=payload)

        return response.Response({})
