from typing import Any

from insights.insightsql import ast
from insights.insightsql.constants import LimitContext
from insights.insightsql.context import InsightsQLContext
from insights.insightsql.printer import prepare_and_print_ast

from insights.sync import database_sync_to_async_pool


@database_sync_to_async_pool
def compile_insightsql_for_streaming(node: ast.SelectQuery, *, team_id: int) -> tuple[str, dict[str, Any]]:
    """Compile a InsightsQL ``SelectQuery`` to Datastore SQL for the streaming HTTP client.

    Backfill workflows in this package run InsightsQL on a background path that has no
    request-scoped user. They need the activity to behave identically to the previous
    raw-SQL implementation, so property access-control restrictions are explicitly
    bypassed with ``restricted_properties=set()`` — otherwise the printer would call
    ``get_restricted_properties_for_team(team_id, user=None)``, which applies any
    property-level rules and would silently change cohort evaluation results compared
    to the raw-SQL baseline.

    Returns the printed SQL and the parameter dict captured on the printer context.
    """
    insightsql_context = InsightsQLContext(
        team_id=team_id,
        enable_select_queries=True,
        limit_context=LimitContext.COHORT_CALCULATION,
        output_format="JSONEachRow",
        restricted_properties=set(),
    )
    sql, _ = prepare_and_print_ast(node, insightsql_context, "datastore")
    return sql, insightsql_context.values
