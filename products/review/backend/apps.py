from django.apps import AppConfig


class ReviewConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "products.review.backend"
    # A dependency names an app by its LABEL, so the label and the 25 dependencies
    # that spell it have to move together — half of that rename reaches production
    # as NodeNotFoundError at import time, which takes the health endpoint and the
    # backend test suite with it. They move together now.
    #
    # The rows already in django_migrations, and the tables they describe, were
    # named for the old label too, and no migration can rename them from inside the
    # graph it belongs to. Both apps were empty — nine tables, zero rows — so the
    # deploy step was to drop them and let the graph build itself under the name it
    # actually has, rather than to carry the old one forward.
    label = "review"

    def ready(self) -> None:
        # Deferred import: models aren't loadable at module import time, and ready() must stay light.
        from products.review.backend import receivers  # noqa: PLC0415

        receivers.connect()
