from django.apps import AppConfig


class ReviewConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "products.review_hog.backend"
    # Every migration in this app depends on ("review_hog", "NNNN_..."), and a
    # dependency names an app by its LABEL. Renaming the label leaves each of
    # those pointing at an app that does not exist, so the migration graph fails
    # to build -- which is not a migrate-time problem but an import-time one:
    # anything that loads the graph, including the whole test suite, stops.
    label = "review_hog"

    def ready(self) -> None:
        # Deferred import: models aren't loadable at module import time, and ready() must stay light.
        from products.review_hog.backend import receivers  # noqa: PLC0415

        receivers.connect()
