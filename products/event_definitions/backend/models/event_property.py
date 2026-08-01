from django.db import models

from insights.models.utils import UniqueConstraintByExpression, sane_repr


class EventProperty(models.Model):
    id = models.BigAutoField(primary_key=True)
    team = models.ForeignKey("insights.Team", on_delete=models.CASCADE, db_index=False)
    project = models.ForeignKey("insights.Project", on_delete=models.CASCADE, null=True)
    event = models.CharField(max_length=400, null=False)
    property = models.CharField(max_length=400, null=False)

    class Meta:
        db_table = "insights_eventproperty"
        constraints = [
            UniqueConstraintByExpression(
                concurrently=True,
                name="insights_event_property_unique_proj_event_property",
                expression="(coalesce(project_id, team_id), event, property)",
            ),
        ]
        indexes = [
            models.Index(fields=["project"], name="insights_eve_proj_id_dd2337d2"),
            models.Index(fields=["team", "event"]),
        ]

    __repr__ = sane_repr("event", "property", "team_id")
