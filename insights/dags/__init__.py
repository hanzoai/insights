import os

import django

# setup Insights Django Project
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "insights.settings")

# Skip the self-capture API token initialization for Dagster
# This prevents hanging during database connection in app.ready()
os.environ["SERVER_GATEWAY_INTERFACE"] = "ASGI"

django.setup()
