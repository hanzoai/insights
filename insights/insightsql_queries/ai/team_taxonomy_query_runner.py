from insights.schema import (
    CachedTeamTaxonomyQueryResponse,
    TeamTaxonomyItem,
    TeamTaxonomyQuery,
    TeamTaxonomyQueryResponse,
)

from insights.insightsql import ast
from insights.insightsql.constants import InsightsQLGlobalSettings
from insights.insightsql.parser import parse_select
from insights.insightsql.printer import to_printed_insightsql

from insights.datastore.query_tagging import Product, tags_context
from insights.insightsql_queries.ai.utils import TaxonomyCacheMixin
from insights.insightsql_queries.insights.paginators import InsightsQLHasMorePaginator
from insights.insightsql_queries.query_runner import AnalyticsQueryRunner

try:
    from insights.taxonomy.taxonomy import (
        IGNORED_EVENT_NAMES as IGNORED_EVENT_NAMES,
        WELL_KNOWN_EVENT_NAMES as WELL_KNOWN_EVENT_NAMES,
    )
except ImportError:
    IGNORED_EVENT_NAMES = []
    WELL_KNOWN_EVENT_NAMES = []

DEFAULT_LIMIT = 500


class TeamTaxonomyQueryRunner(TaxonomyCacheMixin, AnalyticsQueryRunner[TeamTaxonomyQueryResponse]):
    """
    Calculates the top events for a team sorted by count. The EventDefinition model doesn't store the count of events,
    so this query mitigates that.
    """

    query: TeamTaxonomyQuery
    cached_response: CachedTeamTaxonomyQueryResponse
    settings: InsightsQLGlobalSettings | None

    def __init__(self, *args, settings: InsightsQLGlobalSettings | None = None, **kwargs):
        super().__init__(*args, **kwargs)
        self.settings = settings
        self.paginator = InsightsQLHasMorePaginator(
            limit=self.query.limit or DEFAULT_LIMIT,
            offset=self.query.offset or 0,
        )

    def _calculate(self):
        query = self.to_query()
        insightsql = to_printed_insightsql(query, self.team)

        with tags_context(product=Product.MAX_AI):
            self.paginator.execute_insightsql_query(
                query_type="TeamTaxonomyQuery",
                query=query,
                team=self.team,
                user=self.user,
                timings=self.timings,
                modifiers=self.modifiers,
                limit_context=self.limit_context,
            )

        results: list[TeamTaxonomyItem] = [
            TeamTaxonomyItem(event=event, count=count) for event, count in self.paginator.results
        ]

        if not self.paginator.has_more():
            found_events = {item.event for item in results}
            results.extend(
                TeamTaxonomyItem(event=name, count=0) for name in WELL_KNOWN_EVENT_NAMES if name not in found_events
            )

        return TeamTaxonomyQueryResponse(
            results=results,
            timings=self.paginator.response.timings if self.paginator.response else None,
            insightsql=insightsql,
            modifiers=self.modifiers,
            **self.paginator.response_params(),
        )

    def to_query(self) -> ast.SelectQuery | ast.SelectSetQuery:
        query = parse_select(
            """
                SELECT
                    event,
                    count() as count
                FROM events
                WHERE
                    timestamp >= now () - INTERVAL 30 DAY
                GROUP BY
                    event
                ORDER BY
                    count DESC,
                    event ASC
            """
        )

        if IGNORED_EVENT_NAMES:
            assert isinstance(query, ast.SelectQuery)
            ignored_constants: list[ast.Expr] = [ast.Constant(value=name) for name in IGNORED_EVENT_NAMES]
            filter_expr = ast.CompareOperation(
                left=ast.Field(chain=["event"]),
                op=ast.CompareOperationOp.NotIn,
                right=ast.Array(exprs=ignored_constants),
            )
            if query.where:
                query.where = ast.And(exprs=[query.where, filter_expr])
            else:
                query.where = filter_expr

        return query
