"""Django app configuration for stamp."""

from django.apps import AppConfig


class StampConfig(AppConfig):
    name = "products.stamp.backend"
    # The module path is a label and moves with the rename; the app label does not.
    # Django records every migration under (app_label, name), and products/db_routing.yaml
    # sends this app's models to their own database by matching the same string. Renaming
    # it re-runs 0001_initial against tables that already exist, and quietly routes the
    # product's writes to the default database in the meantime.
    label = "stamphog"
