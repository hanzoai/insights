from django.apps import AppConfig


class ReviewConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "products.review.backend"
    label = "review"

    def ready(self) -> None:
        # Deferred import: models aren't loadable at module import time, and ready() must stay light.
        from products.review.backend import receivers  # noqa: PLC0415

        receivers.connect()
