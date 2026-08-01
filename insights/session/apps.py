from django.apps import AppConfig


class InsightsSessionConfig(AppConfig):
    name = "insights.session"
    label = "insights_session"
    verbose_name = "Sessions"

    def ready(self) -> None:
        import insights.session.signals  # noqa: F401, PLC0415 — registers the post_delete session cleanup
