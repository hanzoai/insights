"""Data access for sentiment classification.

Fetches $ai_generation events from ClickHouse via InsightsQL and groups
results by trace_id for downstream processing.
"""

import json

from insights.temporal.llm_analytics.sentiment.constants import GENERATIONS_QUERY, MAX_GENERATIONS


def fetch_generations(
    team_id: int,
    trace_ids: list[str],
    date_from: str,
    date_to: str,
) -> dict[str, list[tuple[str, dict]]]:
    """Fetch $ai_generation events and group by trace_id.

    Returns {trace_id: [(event_uuid, parsed_props), ...]} with at most
    MAX_GENERATIONS rows per trace.
    """
    from insights.insightsql import ast
    from insights.insightsql.constants import LimitContext
    from insights.insightsql.parser import parse_select
    from insights.insightsql.query import execute_insightsql_query

    from insights.models.team import Team

    team = Team.objects.get(id=team_id)
    query = parse_select(GENERATIONS_QUERY)
    result = execute_insightsql_query(
        query_type="SentimentOnDemand",
        query=query,
        placeholders={
            "date_from": ast.Constant(value=date_from),
            "date_to": ast.Constant(value=date_to),
            "trace_ids": ast.Tuple(exprs=[ast.Constant(value=tid) for tid in trace_ids]),
            "max_rows": ast.Constant(value=MAX_GENERATIONS * len(trace_ids)),
        },
        team=team,
        limit_context=LimitContext.QUERY_ASYNC,
    )

    rows_by_trace: dict[str, list[tuple[str, dict]]] = {}
    for row in result.results or []:
        row_trace_id = str(row[2])
        trace_rows = rows_by_trace.setdefault(row_trace_id, [])
        if len(trace_rows) < MAX_GENERATIONS:
            raw_props = row[1]
            props = json.loads(raw_props) if isinstance(raw_props, str) else raw_props
            trace_rows.append((str(row[0]), props))

    return rows_by_trace
