from django.db import models

from insights.models.utils import UUIDTModel


class AccessControl(UUIDTModel):
    class Meta:
        app_label = "ee"
        db_table = "ee_accesscontrol"
        constraints = [
            models.UniqueConstraint(
                fields=["resource", "resource_id", "team", "organization_member", "role"],
                name="unique resource per target",
            )
        ]

    team = models.ForeignKey(
        "posthog.Team",
        on_delete=models.CASCADE,
        related_name="access_controls",
        related_query_name="access_controls",
    )

    access_level: models.CharField = models.CharField(max_length=32)
    resource: models.CharField = models.CharField(max_length=32)
    resource_id: models.CharField = models.CharField(max_length=36, null=True)

    organization_member = models.ForeignKey(
        "posthog.OrganizationMembership",
        on_delete=models.CASCADE,
        related_name="access_controls",
        related_query_name="access_controls",
        null=True,
    )

    role = models.ForeignKey(
        "ee.Role",
        on_delete=models.CASCADE,
        related_name="access_controls",
        related_query_name="access_controls",
        null=True,
    )

    created_by = models.ForeignKey(
        "posthog.User",
        on_delete=models.SET_NULL,
        null=True,
    )
    created_at: models.DateTimeField = models.DateTimeField(auto_now_add=True)
    updated_at: models.DateTimeField = models.DateTimeField(auto_now=True)
