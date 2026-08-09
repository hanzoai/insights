from django.apps import AppConfig


class ReviewConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "products.review_hog.backend"
    label = "review"

    def ready(self) -> None:
        # Deferred import: models aren't loadable at module import time, and ready() must stay light.
        from products.review_hog.backend import receivers  # noqa: PLC0415

        receivers.connect()
