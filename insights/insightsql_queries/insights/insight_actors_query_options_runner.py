from typing import cast

from insights.schema import (
    CachedInsightActorsQueryOptionsResponse,
    InsightActorsQueryOptions,
    InsightActorsQueryOptionsResponse,
)

from insights.insightsql import ast

from insights.insightsql_queries.insights.lifecycle_query_runner import LifecycleQueryRunner
from insights.insightsql_queries.insights.trends.trends_query_runner import TrendsQueryRunner
from insights.insightsql_queries.query_runner import QueryRunner, get_query_runner
from insights.models.filters.mixins.utils import cached_property


class InsightActorsQueryOptionsRunner(QueryRunner):
    query: InsightActorsQueryOptions
    cached_response: CachedInsightActorsQueryOptionsResponse

    @cached_property
    def source_runner(self) -> QueryRunner:
        return get_query_runner(self.query.source.source, self.team, self.timings, self.limit_context)

    def to_query(self) -> ast.SelectQuery | ast.SelectSetQuery:
        raise ValueError(f"Cannot convert source query of type {self.query.source.kind} to query")

    def _calculate(self) -> InsightActorsQueryOptionsResponse:
        if isinstance(self.source_runner, TrendsQueryRunner):
            trends_runner = cast(TrendsQueryRunner, self.source_runner)
            return trends_runner.to_actors_query_options()
        elif isinstance(self.source_runner, LifecycleQueryRunner):
            lifecycle_runner = cast(LifecycleQueryRunner, self.source_runner)
            return lifecycle_runner.to_actors_query_options()

        return InsightActorsQueryOptionsResponse(day=None, status=None, interval=None, breakdown=None, series=None)
