from insights.dags.common.owners import JobOwners
from insights.models.health_issue import HealthIssue
from insights.temporal.health_checks.detectors import DATASTORE_BATCH_EXECUTION_POLICY
from insights.temporal.health_checks.framework import (
    _SEVERITY_WEIGHT,
    AlertContent,
    HealthCheck,
    Remediation,
    SignalContent,
    build_signal_extra,
)
from insights.temporal.health_checks.models import HealthCheckResult
from insights.temporal.health_checks.query import execute_datastore_health_team_query

SCROLL_DEPTH_LOOKBACK_DAYS = 30
SCROLL_DEPTH_SQL = """
SELECT team_id
FROM events
WHERE team_id IN %(team_ids)s
  AND event = '$pageleave'
  AND timestamp >= now() - INTERVAL %(lookback_days)s DAY
GROUP BY team_id
HAVING countIf(JSONHas(properties, '$prev_pageview_max_content_percentage')) = 0
"""


class ScrollDepthCheck(HealthCheck):
    name = "scroll_depth"
    kind = "scroll_depth"
    owner = JobOwners.TEAM_WEB_ANALYTICS
    policy = DATASTORE_BATCH_EXECUTION_POLICY
    schedule = "0 1 * * *"
    active_since_days = 30
    remediation = Remediation(
        human="""
            Open the Web analytics health page. Scroll depth is collected automatically by insights-js as
            part of $pageleave when autocapture is enabled, so the usual fix is to update to a recent
            insights-js version and make sure autocapture (and DOM / scroll tracking) hasn't been disabled.
        """,
        agent="""
            Use `execute-sql` to inspect a recent $pageleave event's properties and confirm the scroll
            fields are missing. Then fix it in the user's codebase: bump insights-js to a recent version and
            check the `insights.init` config doesn't disable autocapture or DOM/scroll tracking. Use
            `docs-search` for scroll-depth / autocapture configuration. Once insights-js starts sending
            scroll metadata, the issue clears on the next check run.
        """,
    )

    @classmethod
    def render_alert(cls, issue: HealthIssue) -> AlertContent:
        return AlertContent(
            title="Scroll-depth tracking disabled",
            summary=issue.payload.get("reason", "$pageleave events have no scroll-depth metadata"),
            link="/web/health",
        )

    @classmethod
    def render_signal(cls, issue: HealthIssue) -> SignalContent | None:
        title = "Scroll-depth tracking disabled"
        summary = issue.payload.get("reason", "$pageleave events have no scroll-depth metadata.")
        return SignalContent(
            description=(
                f"This project's `$pageleave` events carry no scroll-depth metadata over the last "
                f"{SCROLL_DEPTH_LOOKBACK_DAYS} days, so scroll-depth reports in web analytics will be empty. "
                "This usually means scroll-depth autocapture is disabled in the SDK config. Recommend enabling "
                "it so engagement-by-scroll-depth is captured."
            ),
            weight=_SEVERITY_WEIGHT[issue.severity],
            extra=build_signal_extra(issue, title=title, summary=summary, link="/web/health"),
        )

    def detect(self, team_ids: list[int]) -> dict[int, list[HealthCheckResult]]:
        rows = execute_datastore_health_team_query(
            SCROLL_DEPTH_SQL,
            team_ids=team_ids,
            lookback_days=SCROLL_DEPTH_LOOKBACK_DAYS,
        )

        issues: dict[int, list[HealthCheckResult]] = {}
        for (team_id,) in rows:
            issues[team_id] = [
                HealthCheckResult(
                    severity=HealthIssue.Severity.WARNING,
                    payload={
                        "reason": f"Team has $pageleave events but scroll depth tracking is not enabled in last {SCROLL_DEPTH_LOOKBACK_DAYS} days"
                    },
                    hash_keys=[],
                )
            ]

        return issues
