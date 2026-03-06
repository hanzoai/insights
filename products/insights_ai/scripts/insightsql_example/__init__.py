"""InsightsQL example renderer for skill templates.

Provides a function to render a query dict (with a `kind` field) into
the corresponding InsightsQL string via the query runner infrastructure.

Only available when DEBUG=True, since it requires Django and a database.
"""

from __future__ import annotations

from typing import Any

_cached_team: Any = None

FROZEN_TIME = "2025-12-10T00:00:00"


def render_insightsql_example(query_dict: dict[str, Any]) -> str:
    """Render a query dict to a InsightsQL string using the query runner pipeline.

    Time is frozen to FROZEN_TIME so that relative date ranges produce
    deterministic output regardless of when the build runs.

    Usage in a template::

        {{ render_insightsql_example({"kind": "TrendsQuery", "series": [{"kind": "EventsNode", "event": "$pageview"}], "dateRange": {"date_from": "-7d"}}) }}

    Raises:
        RuntimeError: If DEBUG is not True or no Team exists in the database.
    """
    from django.conf import settings

    if not settings.DEBUG:
        raise RuntimeError("render_insightsql_example is only available when DEBUG=True")

    global _cached_team
    if _cached_team is None:
        from insights.models.team import Team

        _cached_team = Team.objects.first()
        if _cached_team is None:
            raise RuntimeError("render_insightsql_example requires at least one Team in the database")

    from freezegun import freeze_time

    from insights.schema import InsightsQLFilters

    from insights.insightsql.filters import replace_filters
    from insights.insightsql.printer.utils import to_printed_insightsql

    from insights.insightsql_queries.query_runner import get_query_runner

    with freeze_time(FROZEN_TIME):
        kind = query_dict.get("kind")

        if kind == "RecordingsQuery":
            return _render_recordings_query(query_dict, _cached_team)

        runner = get_query_runner(query_dict, _cached_team)
        ast_query = runner.to_query()

        from products.error_tracking.backend.insightsql_queries.error_tracking_query_runner import ErrorTrackingQueryRunner
        from products.logs.backend.logs_query_runner import LogsQueryRunner

        insightsql_filters = InsightsQLFilters()
        if isinstance(runner, ErrorTrackingQueryRunner):
            insightsql_filters = InsightsQLFilters(
                filterTestAccounts=runner.query.filterTestAccounts,
                properties=runner.insightsql_properties,
            )
        elif isinstance(runner, LogsQueryRunner):
            insightsql_filters = InsightsQLFilters(dateRange=runner.query.dateRange)
        ast_query = replace_filters(ast_query, insightsql_filters, _cached_team)

        return to_printed_insightsql(ast_query, _cached_team)


def _render_recordings_query(query_dict: dict[str, Any], team: Any) -> str:
    from insights.schema import RecordingsQuery

    from insights.insightsql.printer.utils import to_printed_insightsql

    from insights.session_recordings.queries.session_recording_list_from_query import SessionRecordingListFromQuery

    query = RecordingsQuery(**{k: v for k, v in query_dict.items() if k != "kind"})
    listing = SessionRecordingListFromQuery(team=team, query=query)
    ast_query = listing.get_query()
    return to_printed_insightsql(ast_query, team)
