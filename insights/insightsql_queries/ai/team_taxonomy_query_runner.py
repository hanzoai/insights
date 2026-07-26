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
from insights.insightsql.query import execute_insightsql_query

from insights.datastore.query_tagging import Product, tags_context
from insights.insightsql_queries.ai.utils import TaxonomyCacheMixin
from insights.insightsql_queries.query_runner import AnalyticsQueryRunner

try:
    from insights.taxonomy.taxonomy import CORE_FILTER_DEFINITIONS_BY_GROUP
except ImportError:
    CORE_FILTER_DEFINITIONS_BY_GROUP = {}


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

    def _calculate(self):
        query = self.to_query()
        insightsql = to_printed_insightsql(query, self.team)

        with tags_context(product=Product.MAX_AI):
            response = execute_insightsql_query(
                query_type="TeamTaxonomyQuery",
                query=query,
                team=self.team,
                timings=self.timings,
                modifiers=self.modifiers,
                limit_context=self.limit_context,
            )

        results: list[TeamTaxonomyItem] = []
        for event, count in response.results:
            if event_core_definition := CORE_FILTER_DEFINITIONS_BY_GROUP.get("events", {}).get(event):
                if event_core_definition.get("system") or event_core_definition.get("ignored_in_assistant"):
                    continue  # Skip irrelevant events
            results.append(TeamTaxonomyItem(event=event, count=count))

        return TeamTaxonomyQueryResponse(
            results=results, timings=response.timings, insightsql=insightsql, modifiers=self.modifiers
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
                    count DESC
                LIMIT 500
            """
        )

        return query
