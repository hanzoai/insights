import structlog
from rest_framework import serializers

from insights.api.shared import UserBasicSerializer

from products.workflows.backend.models.insights_flow_batch_job import InsightsFlowBatchJob

logger = structlog.get_logger(__name__)


class InsightsFlowBatchJobSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = InsightsFlowBatchJob
        fields = [
            "id",
            "status",
            "insights_flow",
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

    def create(self, validated_data: dict, *args, **kwargs) -> InsightsFlowBatchJob:
        request = self.context["request"]
        team_id = self.context["team_id"]
        validated_data["created_by"] = request.user
        validated_data["team_id"] = team_id

        return super().create(validated_data=validated_data)
