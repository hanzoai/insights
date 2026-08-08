"""Guards on the Temporal `aggregate-and-chunk-org-reports` activity's
own report builder.

The end-to-end parity check against the legacy Celery task's SQS payloads
went with the billing queue it compared against — the Celery task has no
producer to send to, so there is nothing left to diff.
"""

from datetime import UTC, datetime

import pytest

from django.db import connection
from django.test.utils import CaptureQueriesContext

from insights.models import Organization, Team
from insights.temporal.usage_report.queries import QUERIES


def _all_destination_keys() -> list[str]:
    """Every key `_get_team_report` reads, derived from the registry so we
    don't have to keep the test in sync with the spec list by hand.
    """
    keys: list[str] = []
    for spec in QUERIES:
        if spec.output == "multi":
            keys.extend(spec.multi_keys_mapping.values())
        else:
            keys.append(spec.name)
    return keys


@pytest.mark.django_db(transaction=True)
def test_temporal_build_org_reports_does_not_run_per_org_membership_queries() -> None:
    """The Temporal-local `aggregator.build_org_reports` must fetch
    organization membership counts in bulk. The legacy Celery facade still
    runs one `OrganizationMembership.count()` per organization inside its
    team loop — that's the cost we lifted out of the
    `aggregate-and-chunk-org-reports` activity by routing it through the
    aggregator's own builder instead of the shared one.
    """
    from insights.temporal.usage_report.aggregator import (
        build_org_reports as temporal_build_org_reports,
        get_org_user_counts,
    )

    # Create a meaningful number of fresh orgs/teams so the per-org N+1
    # would have clear daylight from the bulk-fetch path. Without this,
    # query counts are low enough that any reasonable cap would pass.
    fresh_orgs: list[Organization] = []
    for i in range(20):
        org = Organization.objects.create(name=f"Bulk Org {i}")
        Team.objects.create(organization=org, name=f"Team {i}")
        fresh_orgs.append(org)

    period_start = datetime(2026, 5, 4, 0, 0, 0, tzinfo=UTC)
    all_data: dict[str, dict[int, int]] = {key: {} for key in _all_destination_keys()}

    with CaptureQueriesContext(connection) as captured:
        org_user_counts = get_org_user_counts()
        temporal_build_org_reports(all_data, period_start, org_user_counts)

    # The Temporal path runs ~2 queries (teams + bulk memberships)
    # regardless of org count. The legacy Celery path runs 1 + N. Cap
    # well below `1 + N` so any per-org N+1 here blows the test, while
    # leaving slack for harmless query-count drift (savepoints etc.).
    assert len(captured.captured_queries) <= 5, (
        f"Temporal build_org_reports issued {len(captured.captured_queries)} "
        f"queries — with {len(fresh_orgs)} fresh orgs this looks like a "
        f"per-org N+1, which dominates wall-clock for the aggregation activity."
    )
