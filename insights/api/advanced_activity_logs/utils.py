from datetime import datetime, timedelta
from typing import Optional

from django.utils import timezone

from insights.constants import AvailableFeature
from insights.models import Organization


def get_activity_log_lookback_restriction(organization: Organization) -> Optional[datetime]:
    """The earliest activity this organization may read, or None for no restriction."""
    audit_log_feature = organization.get_available_feature(AvailableFeature.AUDIT_LOGS)

    if not audit_log_feature:
        return None

    limit = audit_log_feature.get("limit")
    unit = audit_log_feature.get("unit")

    # A feature that states no limit places no restriction, as it does for the other countable
    # quota gates: projects (`api/project.py`) and alerts (`models/alert.py`).
    #
    # Replay retention is NOT a third example, though it looks like one. There
    # `parse_feature_to_entitlement` returns None for a no-limit feature and the callers treat
    # that as misconfigured rather than unlimited -- `api/team.py` raises, and the enforcement
    # activity logs and skips the team. Reading it as precedent here would be reading it
    # backwards, so it is named only to say it is not one.
    #
    # This used to fall back to the smallest window billing ever sold, which inverted the gate:
    # an organization WITHOUT the feature read its whole history, and one WITH it was silently
    # cut to 60 days. There is no billing here to name a smaller window, and truncating an audit
    # log is not something to infer.
    if limit is None or unit is None:
        return None

    unit_lower = unit.lower()
    if unit_lower in ("day", "days"):
        delta = timedelta(days=limit)
    elif unit_lower in ("month", "months"):
        delta = timedelta(days=limit * 30)
    elif unit_lower in ("year", "years"):
        delta = timedelta(days=limit * 365)
    else:
        raise ValueError(f"Invalid unit: {unit}")

    return timezone.now() - delta
