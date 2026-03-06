from django.db import models

from insights.models.utils import UUIDTModel, sane_repr


class DashboardPrivilege(UUIDTModel):
    dashboard = models.ForeignKey(
        "posthog.Dashboard",
        on_delete=models.CASCADE,
        related_name="privileges",
        related_query_name="privilege",
    )
    user = models.ForeignKey(
        "posthog.User",
        on_delete=models.CASCADE,
        related_name="explicit_dashboard_privileges",
        related_query_name="explicit_dashboard_privilege",
    )
    # Matches Dashboard.RestrictionLevel choices (21=view, 37=edit)
    level = models.PositiveSmallIntegerField(
        choices=[(21, "Can view dashboard"), (37, "Can edit dashboard")]
    )
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "ee"
        db_table = "ee_dashboardprivilege"
        constraints = [
            models.UniqueConstraint(fields=["dashboard", "user"], name="unique_explicit_dashboard_privilege")
        ]

    __repr__ = sane_repr("dashboard", "user", "level")
