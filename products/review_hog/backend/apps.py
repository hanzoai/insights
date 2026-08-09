from django.apps import AppConfig


class ReviewConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "products.review_hog.backend"
    # All 25 migrations in this app depend on ("review_hog", "NNNN_..."), and a
    # dependency names an app by its LABEL. Renaming it leaves every one of them
    # pointing at an app that does not exist, so the migration graph fails to
    # build -- which stops anything that loads the graph, the whole test suite
    # included, not just migrate.
    label = "review_hog"

    def ready(self) -> None:
        # Deferred import: models aren't loadable at module import time, and ready() must stay light.
        from products.review_hog.backend import receivers  # noqa: PLC0415

        receivers.connect()
