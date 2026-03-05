import structlog
from rest_framework import serializers

from posthog.api.shared import UserBasicSerializer

from products.workflows.backend.models.custom_flow_batch_job import CustomFlowBatchJob

logger = structlog.get_logger(__name__)


class CustomFlowBatchJobSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = CustomFlowBatchJob
        fields = [
            "id",
            "status",
            "custom_flow",
            "scheduled_at",
            "filters",
            "variables",
            "created_at",
            "created_by",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "created_by",
            "updated_at",
        ]

    def create(self, validated_data: dict, *args, **kwargs) -> CustomFlowBatchJob:
        request = self.context["request"]
        team_id = self.context["team_id"]
        validated_data["created_by"] = request.user
        validated_data["team_id"] = team_id

        return super().create(validated_data=validated_data)
