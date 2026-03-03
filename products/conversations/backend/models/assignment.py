from django.db import models

from insights.models.utils import UUIDTModel


class TicketAssignment(UUIDTModel):
    ticket = models.OneToOneField("conversations.Ticket", on_delete=models.CASCADE, related_name="assignment")
    user = models.ForeignKey("posthog.User", null=True, on_delete=models.CASCADE)
    role_id_legacy = models.IntegerField(null=True, db_column="role_id")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "posthog_conversations_ticket_assignment"
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(user__isnull=False, role_id_legacy__isnull=True)
                    | models.Q(user__isnull=True, role_id_legacy__isnull=False)
                ),
                name="exactly_one_assignee_type",
            ),
        ]
