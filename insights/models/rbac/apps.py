from django.apps import AppConfig


class EEConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "insights.models.rbac"
    label = "ee"
    verbose_name = "Enterprise"
