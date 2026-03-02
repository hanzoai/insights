from datetime import datetime, timedelta
from math import ceil
from typing import Any, Optional

from posthog.schema import (
    CachedFunnelsQueryResponse,
    FunnelsQuery,
    FunnelsQueryResponse,
    FunnelVizType,
    InsightsQLQueryModifiers,
    ResolvedDateRangeResponse,
)

from posthog.insightsql import ast
from posthog.insightsql.constants import MAX_BYTES_BEFORE_EXTERNAL_GROUP_BY, InsightsQLGlobalSettings, LimitContext
from posthog.insightsql.printer import to_printed_insightsql
from posthog.insightsql.query import execute_insightsql_query
from posthog.insightsql.timings import InsightsQLTimings

from posthog.caching.insights_api import BASE_MINIMUM_INSIGHT_REFRESH_INTERVAL, REDUCED_MINIMUM_INSIGHT_REFRESH_INTERVAL
from posthog.insightsql_queries.insights.funnels import FunnelTrendsUDF, FunnelUDF
from posthog.insightsql_queries.insights.funnels.funnel_query_context import FunnelQueryContext
from posthog.insightsql_queries.insights.funnels.funnel_time_to_convert import FunnelTimeToConvertUDF
from posthog.insightsql_queries.query_runner import AnalyticsQueryRunner
from posthog.insightsql_queries.utils.query_date_range import QueryDateRange
from posthog.models import Team
from posthog.models.filters.mixins.utils import cached_property


class FunnelsQueryRunner(AnalyticsQueryRunner[FunnelsQueryResponse]):
    query: FunnelsQuery
    cached_response: CachedFunnelsQueryResponse
    context: FunnelQueryContext

    def __init__(
        self,
        query: FunnelsQuery | dict[str, Any],
        team: Team,
        timings: Optional[InsightsQLTimings] = None,
        modifiers: Optional[InsightsQLQueryModifiers] = None,
        limit_context: Optional[LimitContext] = None,
        **kwargs,
    ):
        super().__init__(query, team=team, timings=timings, modifiers=modifiers, limit_context=limit_context)

        self.context = FunnelQueryContext(
            query=self.query, team=team, timings=timings, modifiers=modifiers, limit_context=limit_context
        )
        self.kwargs = kwargs

    def _refresh_frequency(self):
        date_to = self.query_date_range.date_to()
        date_from = self.query_date_range.date_from()
        interval = self.query_date_range.interval_name

        delta_days: Optional[int] = None
        if date_from and date_to:
            delta = date_to - date_from
            delta_days = ceil(delta.total_seconds() / timedelta(days=1).total_seconds())

        refresh_frequency = BASE_MINIMUM_INSIGHT_REFRESH_INTERVAL
        if interval == "hour" or (delta_days is not None and delta_days <= 7):
            # The interval is shorter for short-term insights
            refresh_frequency = REDUCED_MINIMUM_INSIGHT_REFRESH_INTERVAL

        return refresh_frequency

    def to_query(self) -> ast.SelectQuery:
        return self.funnel_class.get_query()

    def to_actors_query(self) -> ast.SelectQuery:
        return self.funnel_actor_class.actor_query()

    def _calculate(self):
        query = self.to_query()
        timings = []

        # TODO: can we get this from execute_insightsql_query as well?
        insightsql = to_printed_insightsql(query, self.team)

        response = execute_insightsql_query(
            query_type="FunnelsQuery",
            query=query,
            team=self.team,
            timings=self.timings,
            modifiers=self.modifiers,
            limit_context=self.limit_context,
            settings=InsightsQLGlobalSettings(
                # Make sure funnel queries never OOM
                max_bytes_before_external_group_by=MAX_BYTES_BEFORE_EXTERNAL_GROUP_BY,
                allow_experimental_analyzer=True,
            ),
        )

        results = self.funnel_class._format_results(response.results)

        if response.timings is not None:
            timings.extend(response.timings)

        return FunnelsQueryResponse(
            results=results,
            timings=timings,
            insightsql=insightsql,
            modifiers=self.modifiers,
            resolved_date_range=ResolvedDateRangeResponse(
                date_from=self.query_date_range.date_from(),
                date_to=self.query_date_range.date_to(),
            ),
        )

    @cached_property
    def funnel_order_class(self):
        return FunnelUDF(context=self.context)

    @cached_property
    def funnel_class(self):
        funnelVizType = self.context.funnelsFilter.funnelVizType

        if funnelVizType == FunnelVizType.TRENDS:
            return FunnelTrendsUDF(context=self.context, **self.kwargs)
        elif funnelVizType == FunnelVizType.TIME_TO_CONVERT:
            return FunnelTimeToConvertUDF(context=self.context)
        else:
            return self.funnel_order_class

    @cached_property
    def funnel_actor_class(self):
        if self.context.funnelsFilter.funnelVizType == FunnelVizType.TRENDS:
            return FunnelTrendsUDF(context=self.context)

        return FunnelUDF(context=self.context)

    @property
    def exact_timerange(self):
        return self.query.dateRange and self.query.dateRange.explicitDate

    @cached_property
    def query_date_range(self):
        return QueryDateRange(
            date_range=self.query.dateRange,
            team=self.team,
            interval=self.query.interval,
            now=datetime.now(),
            exact_timerange=self.exact_timerange,
        )
