from django.db import models
from django.utils import timezone

from insights.models.activity_logging.model_activity import ModelActivityMixin
from insights.models.scoping.root_mixin import TeamScopedRootMixin
from insights.models.utils import UUIDModel


class DashboardWidget(ModelActivityMixin, TeamScopedRootMixin, UUIDModel):
    widget_type = models.CharField(max_length=64)
    name = models.CharField(max_length=400, null=True, blank=True)
    description = models.TextField(blank=True)
    config = models.JSONField(default=dict)

    created_by = models.ForeignKey("insights.User", on_delete=models.SET_NULL, null=True, blank=True)
    last_modified_at = models.DateTimeField(default=timezone.now)
    last_modified_by = models.ForeignKey(
        "insights.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="modified_dashboard_widgets",
    )

    team = models.ForeignKey("insights.Team", on_delete=models.CASCADE)

    all_teams = models.Manager()  # noqa: DJ012

    class Meta(TeamScopedRootMixin.Meta):
        db_table = "insights_dashboardwidget"
        default_manager_name = "all_teams"
