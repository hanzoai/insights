import os
from typing import Any, Optional

from django.conf import settings


# Keep this in sync with isCloud() in nodejs/src/utils/env-utils.ts.
# "dev" refers to the hosted development environment, not local development (which is "local").
def is_cloud() -> bool:
    return (settings.CLOUD_DEPLOYMENT or "").upper() in ("EU", "US", "DEV", "E2E")


def is_dev_mode() -> bool:
    return bool(settings.DEBUG)


def is_ci() -> bool:
    return os.environ.get("GITHUB_ACTIONS") is not None


def get_cached_instance_license() -> None:
    """License checking removed. Always returns None."""
    return None


# NOTE: This is purely for testing purposes
def TEST_clear_instance_license_cache(
    is_instance_licensed: Optional[bool] = None, instance_license: Optional[Any] = None
):
    pass


def get_api_host():
    if settings.SITE_URL == "https://insights.hanzo.ai":
        return "https://us.i.hanzo.ai"
    elif settings.SITE_URL == "https://insights.hanzo.ai":
        return "https://eu.i.hanzo.ai"
    return settings.SITE_URL
