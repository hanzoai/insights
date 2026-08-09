"""Django app configuration for stamp."""

from django.apps import AppConfig


class StampConfig(AppConfig):
    name = "products.stamphog.backend"
    # The label is not a label. Django records every migration under
    # (app_label, name), and products/db_routing.yaml sends this app's models to
    # their own database by matching this same string. Renaming it re-runs
    # 0001_initial against tables that already exist, and until it does, routes
    # the product's writes to the default database.
    label = "stamphog"
