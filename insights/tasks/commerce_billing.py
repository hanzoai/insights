"""
Commerce billing integration for Hanzo Insights.

Reports per-organization event usage to Commerce API (commerce.hanzo.svc)
for usage-based billing. Runs as a periodic Celery task.

Environment variables:
  COMMERCE_API_URL  -- Commerce API base URL (e.g. http://commerce.hanzo.svc:8001)
  COMMERCE_TOKEN    -- Inter-service auth token for Commerce API
"""

import os
from datetime import UTC, datetime, timedelta

import structlog
from celery import shared_task

logger = structlog.get_logger(__name__)

COMMERCE_API_URL = os.getenv("COMMERCE_API_URL", "")
COMMERCE_TOKEN = os.getenv("COMMERCE_TOKEN", "")


def _get_org_event_counts(period_start: datetime, period_end: datetime) -> list[dict]:
    """Query ClickHouse for per-org event counts in the given period.

    Returns a list of dicts: [{"org_id": str, "org_slug": str, "event_count": int}, ...]
    """
    from insights.clickhouse.client import sync_execute

    rows = sync_execute(
        """
        SELECT team_id, count() AS cnt
        FROM events
        WHERE timestamp >= %(start)s AND timestamp < %(end)s
        GROUP BY team_id
        """,
        {"start": period_start, "end": period_end},
    )

    if not rows:
        return []

    # Map team_id -> organization
    team_ids = [row[0] for row in rows]
    from insights.models.team.team import Team

    teams = (
        Team.objects.filter(id__in=team_ids)
        .select_related("organization")
        .only("id", "organization__id", "organization__slug", "organization__name")
    )
    team_to_org = {}
    for team in teams:
        team_to_org[team.id] = {
            "org_id": str(team.organization.id),
            "org_slug": getattr(team.organization, "slug", "") or "",
        }

    # Aggregate per org (multiple teams can belong to one org)
    org_counts: dict[str, dict] = {}
    for team_id, count in rows:
        org_info = team_to_org.get(team_id)
        if not org_info:
            continue
        org_id = org_info["org_id"]
        if org_id not in org_counts:
            org_counts[org_id] = {
                "org_id": org_id,
                "org_slug": org_info["org_slug"],
                "event_count": 0,
            }
        org_counts[org_id]["event_count"] += count

    return list(org_counts.values())


def _report_to_commerce(org_usage: list[dict], period_start: datetime, period_end: datetime) -> None:
    """POST usage data to Commerce API for billing."""
    if not COMMERCE_API_URL or not COMMERCE_TOKEN:
        logger.warning(
            "commerce_billing_skip",
            reason="COMMERCE_API_URL or COMMERCE_TOKEN not configured",
        )
        return

    import requests

    url = f"{COMMERCE_API_URL}/api/v1/usage"
    headers = {
        "Authorization": f"Bearer {COMMERCE_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "product": "insights",
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "records": [
            {
                "organization_id": entry["org_id"],
                "organization_slug": entry["org_slug"],
                "metric": "events_ingested",
                "quantity": entry["event_count"],
            }
            for entry in org_usage
        ],
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        if resp.status_code in (200, 201, 204):
            logger.info(
                "commerce_billing_reported",
                org_count=len(org_usage),
                total_events=sum(e["event_count"] for e in org_usage),
            )
        else:
            logger.error(
                "commerce_billing_error",
                status=resp.status_code,
                body=resp.text[:500],
            )
    except Exception:
        logger.exception("commerce_billing_request_failed")


@shared_task(ignore_result=True)
def report_insights_usage_to_commerce() -> None:
    """Periodic task: report per-org event counts to Commerce for billing.

    Reports the previous hour's usage. Intended to be scheduled hourly.
    """
    now = datetime.now(UTC)
    period_end = now.replace(minute=0, second=0, microsecond=0)
    period_start = period_end - timedelta(hours=1)

    logger.info(
        "commerce_billing_start",
        period_start=period_start.isoformat(),
        period_end=period_end.isoformat(),
    )

    try:
        org_usage = _get_org_event_counts(period_start, period_end)
        if org_usage:
            _report_to_commerce(org_usage, period_start, period_end)
        else:
            logger.info("commerce_billing_no_events")
    except Exception:
        logger.exception("commerce_billing_task_failed")
