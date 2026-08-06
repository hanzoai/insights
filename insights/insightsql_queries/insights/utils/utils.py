from collections.abc import Sequence
from copy import deepcopy
from typing import Optional

from insights.schema import (
    ActionsNode,
    BaseMathType,
    DataWarehouseNode,
    EventsNode,
    GroupNode,
    InsightsQLQueryModifiers,
    IntervalType,
    TrendsQuery,
)

from insights.insightsql import ast
from insights.insightsql.printer import to_printed_insightsql
from insights.insightsql.timings import InsightsQLTimings

from insights.insightsql_queries.utils.query_date_range import compare_interval_length
from insights.interval_specs import get_trunc_func
from insights.models.team.team import Team, WeekStartDay


def get_start_of_interval_insightsql(interval: str, *, team: Team, source: Optional[ast.Expr] = None) -> ast.Expr:
    trunc_func = get_trunc_func(interval)
    trunc_func_args: list[ast.Expr] = [source] if source else [ast.Field(chain=["timestamp"])]
    if trunc_func == "toStartOfWeek":
        trunc_func_args.append(ast.Constant(value=int((WeekStartDay(team.week_start_day or 0)).datastore_mode)))
    return ast.Call(name=trunc_func, args=trunc_func_args)


def get_start_of_interval_insightsql_str(interval: str, *, team: Team, source: str) -> str:
    trunc_func = get_trunc_func(interval)
    return f"{trunc_func}({source}{f', {int((WeekStartDay(team.week_start_day or 0)).datastore_mode)}' if trunc_func == 'toStartOfWeek' else ''})"


def series_should_be_set_to_dau(
    interval: IntervalType, series: EventsNode | ActionsNode | DataWarehouseNode | GroupNode
):
    return (
        series.math == BaseMathType.WEEKLY_ACTIVE and compare_interval_length(interval, ">=", IntervalType.WEEK)
    ) or (series.math == BaseMathType.MONTHLY_ACTIVE and compare_interval_length(interval, ">=", IntervalType.MONTH))


def convert_active_user_math_based_on_interval(query: TrendsQuery) -> TrendsQuery:
    """
    Convert WAU to DAU for week or longer intervals
    Convert MAU to DAU for month or longer intervals

    Works for both TrendsQuery and StickinessQuery

    Args:
        query: Either a TrendsQuery or StickinessQuery instance

    Returns:
        The same type of query that was passed in, with appropriate math conversions
    """
    modified_query = deepcopy(query)

    interval = modified_query.interval or IntervalType.DAY

    for series in modified_query.series:
        # Convert WAU to DAU for week or longer intervals
        # Convert MAU to DAU for month or longer intervals
        if series_should_be_set_to_dau(interval, series):
            series.math = BaseMathType.DAU

    return modified_query


def get_response_insightsql(
    queries: Sequence[ast.SelectQuery | ast.SelectSetQuery],
    *,
    team: Team,
    timings: InsightsQLTimings,
    modifiers: Optional[InsightsQLQueryModifiers] = None,
) -> str:
    if len(queries) == 0:
        return ""

    response_insightsql_query = ast.SelectSetQuery.create_from_queries(queries, "UNION ALL")

    # This only prints the query for the response payload — it never executes — and access to the
    # underlying warehouse tables is already enforced on the insight's executed query. Bypass warehouse
    # access control so building the printer's database doesn't fail closed in userless contexts.
    with timings.measure("printing_insightsql_for_response"):
        return to_printed_insightsql(response_insightsql_query, team, modifiers, bypass_warehouse_access_control=True)
