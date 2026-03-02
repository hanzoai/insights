from django.db import models

from insights.models.resource_transfer.visitors.base import ResourceTransferVisitor


class ActionVisitor(
    ResourceTransferVisitor,
    kind="Action",
    excluded_fields=[
        "is_calculating",
        "last_calculated_at",
        "bytecode",
        "bytecode_error",
        "last_summarized_at",
        "summary",
        "embedding_last_synced_at",
        "embedding_version",
        "events",
        "post_to_slack",
        "slack_message_format",
    ],
):
    @classmethod
    def get_model(cls) -> type[models.Model]:
        from insights.models import Action

        return Action
