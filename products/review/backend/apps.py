from django.apps import AppConfig


class ReviewConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "products.review.backend"
    # The module path is ours and moves with the rename; the label is not. All 25
    # migrations in this app depend on ("review_hog", "NNNN_..."), and a dependency
    # names an app by its LABEL -- so under "review" every one of them points at an
    # app that does not exist and the graph raises NodeNotFoundError. That is an
    # import-time failure, not a migrate-time one: it takes the backend test suite
    # with it. Finishing the rename means rewriting those 25 dependencies AND
    # renaming the rows already in django_migrations, which no migration can do
    # from inside the graph it is part of; it is a deploy step someone has to run.
    label = "review_hog"

    def ready(self) -> None:
        # Deferred import: models aren't loadable at module import time, and ready() must stay light.
        from products.review.backend import receivers  # noqa: PLC0415

        receivers.connect()
