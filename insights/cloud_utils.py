import os
from typing import Any, Optional

from django.conf import settings

is_cloud_cached: Optional[bool] = None
is_instance_licensed_cached: Optional[bool] = None
instance_license_cached: Optional[Any] = None


# Keep this in sync with isCloud() in nodejs/src/utils/env-utils.ts.
# "dev" refers to the hosted development environment, not local development (which is "local").
def is_cloud() -> bool:
    return (settings.CLOUD_DEPLOYMENT or "").upper() in ("EU", "US", "DEV", "E2E")


def is_dev_mode() -> bool:
    return bool(settings.DEBUG)


def is_ci() -> bool:
    return os.environ.get("GITHUB_ACTIONS") is not None


def get_cached_instance_license() -> Optional[Any]:
    """The instance's enterprise license, or None when there isn't one.

    Always None: licenses were issued against the enterprise edition, and the model that read them
    is not carried here. Callers already treat None as "unlicensed", which is what this instance is.
    """
    return None


# NOTE: This is purely for testing purposes
def TEST_clear_instance_license_cache(
    is_instance_licensed: Optional[bool] = None, instance_license: Optional[Any] = None
):
    global instance_license_cached
    instance_license_cached = instance_license
    global is_instance_licensed_cached
    is_instance_licensed_cached = is_instance_licensed


def get_api_host():
    if settings.SITE_URL == "https://us.hanzo.ai":
        return "https://us.i.hanzo.ai"
    elif settings.SITE_URL == "https://eu.hanzo.ai":
        return "https://eu.i.hanzo.ai"
    return settings.SITE_URL
