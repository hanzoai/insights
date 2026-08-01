from django.db import models

from insights.models.utils import UUIDTModel


class MessageTemplate(UUIDTModel):
    """
    A model for storing message templates used for email and eventually other messaging channels.
    """

    team = models.ForeignKey("insights.Team", on_delete=models.CASCADE)
    name = models.CharField(max_length=400)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey("insights.User", on_delete=models.SET_NULL, null=True, blank=True)
    message_category = models.ForeignKey("messaging.MessageCategory", on_delete=models.SET_NULL, null=True, blank=True)
    content = models.JSONField(default=dict)
    type = models.CharField(max_length=24, blank=True, default="email")
    deleted = models.BooleanField(default=False)

    class Meta:
        db_table = "insights_messagetemplate"

    def __str__(self):
        return self.name
