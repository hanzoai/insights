from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

import structlog

from posthog.models.utils import RootTeamMixin, UUIDTModel
from posthog.plugins.plugin_server_api import create_batch_insights_flow_job_invocation

logger = structlog.get_logger(__name__)


class InsightsFlowBatchJob(RootTeamMixin, UUIDTModel):
    """
    Stores the status and other meta information for a batch of InsightsFlow jobs (typically used for a broadcast)
    """

    class Meta:
        indexes = [
            models.Index(fields=["team"]),
        ]

    class State(models.TextChoices):
        WAITING = "waiting"
        QUEUED = "queued"
        ACTIVE = "active"
        COMPLETED = "completed"
        CANCELLED = "cancelled"
        FAILED = "failed"

    team = models.ForeignKey("posthog.Team", on_delete=models.DO_NOTHING)
    insights_flow = models.ForeignKey("posthog.InsightsFlow", on_delete=models.DO_NOTHING)
    variables = models.JSONField(default=dict)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    filters = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=State.choices, default=State.QUEUED)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey("posthog.User", on_delete=models.DO_NOTHING, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"InsightsFlow batch run {self.id}"


@receiver(post_save, sender=InsightsFlowBatchJob)
def handle_insights_flow_batch_job_created(sender, instance, created, **kwargs):
    if created:
        try:
            create_batch_insights_flow_job_invocation(
                team_id=instance.team.id, insights_flow_id=instance.insights_flow.id, batch_job_id=instance.id
            )
        except Exception as e:
            logger.exception(
                "Failed to create batch custom flow job invocation",
                batch_job_id=instance.id,
                error=str(e),
            )
            raise
