from insights.schema import (
    CachedSessionAttributionExplorerQueryResponse,
    InsightsQLFilters,
    SessionAttributionExplorerQuery,
    SessionAttributionExplorerQueryResponse,
    SessionAttributionGroupBy,
    SessionTableVersion,
)

from insights.insightsql import ast
from insights.insightsql.constants import LimitContext
from insights.insightsql.parser import parse_select

from insights.insightsql_queries.insights.paginators import InsightsQLHasMorePaginator
from insights.insightsql_queries.query_runner import AnalyticsQueryRunner

AD_IDS_PREFIXES_SESSIONS_V1 = [
    "gclid",
    "gad_source",
    "gclsrc",
    "dclid",
    "gbraid",
    "wbraid",
    "fbclid",
    "msclkid",
    "twclid",
    "li_fat_id",
    "mc_cid",
    "igshid",
    "ttclid",
]

AD_IDS_PREFIXES_SESSIONS_V2 = [
    "gclid",
    "gad_source",
    "gclsrc",
    "dclid",
    "gbraid",
    "wbraid",
    "fbclid",
    "msclkid",
    "twclid",
    "li_fat_id",
    "mc_cid",
    "igshid",
    "ttclid",
    "_kx",
    "irclid",
]


class SessionAttributionExplorerQueryRunner(AnalyticsQueryRunner[SessionAttributionExplorerQueryResponse]):
    query: SessionAttributionExplorerQuery
    cached_response: CachedSessionAttributionExplorerQueryResponse
    paginator: InsightsQLHasMorePaginator

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.paginator = InsightsQLHasMorePaginator.from_limit_context(
            limit_context=LimitContext.QUERY, limit=self.query.limit if self.query.limit else None
        )

    # We use string concatenation here, so that the resultant insightsql can be opened as its own insightsql insight,
    # so this part must never use user inputs.
    # Note that {filters} is a placeholder that is left as is, and replaced with actual filters in
    # execute_insightsql_query. Those filters *are* user input, which is why placeholders are used. It helps that
    # placeholders are valid in InsightsQL insights too, so it will "just work"!
    def to_query(self) -> ast.SelectQuery:
        with self.timings.measure("session_attribution_query_runner"):
            if self.query.modifiers and self.query.modifiers.sessionTableVersion == SessionTableVersion.V1:
                relevant_ad_ids = AD_IDS_PREFIXES_SESSIONS_V1
            else:
                relevant_ad_ids = AD_IDS_PREFIXES_SESSIONS_V2

            group_by = []

            def group_or_agg(group_name, field, result):
                if group_name in self.query.groupBy:
                    group_by.append(f'"{result}"')
                    return field
                else:
                    return f"topK(10)({field})"

            channel_type = group_or_agg(
                SessionAttributionGroupBy.CHANNEL_TYPE, "$channel_type", "context.columns.channel_type"
            )
            referring_domain = group_or_agg(
                SessionAttributionGroupBy.REFERRING_DOMAIN,
                "$entry_referring_domain",
                "context.columns.referring_domain",
            )
            utm_source = group_or_agg(
                SessionAttributionGroupBy.SOURCE, "$entry_utm_source", "context.columns.utm_source"
            )
            utm_medium = group_or_agg(
                SessionAttributionGroupBy.MEDIUM, "$entry_utm_medium", "context.columns.utm_medium"
            )
            utm_campaign = group_or_agg(
                SessionAttributionGroupBy.CAMPAIGN, "$entry_utm_campaign", "context.columns.utm_campaign"
            )

            ad_ids_concat = ",".join([f"if(isNotNull($entry_{ad_id}), '{ad_id}', NULL)" for ad_id in relevant_ad_ids])
            ad_ids = group_or_agg(
                SessionAttributionGroupBy.AD_IDS,
                f"nullIf(arrayStringConcat([{ad_ids_concat}], ','), '')",
                "context.columns.ad_ids",
            )

            entry_url = group_or_agg(
                SessionAttributionGroupBy.INITIAL_URL, "$entry_current_url", "context.columns.example_entry_urls"
            )

            filters = "{filters}"
            group_by_str = ("GROUP BY" + ", ".join(group_by)) if group_by else ""

            query_str = f"""
SELECT
    count() as "context.columns.count",
    {channel_type} as "context.columns.channel_type",
    {referring_domain} as "context.columns.referring_domain",
    {utm_source} as "context.columns.utm_source",
    {utm_medium} as "context.columns.utm_medium",
    {utm_campaign} as "context.columns.utm_campaign",
    {ad_ids} as "context.columns.ad_ids",
    {entry_url} as "context.columns.example_entry_urls"
FROM sessions
WHERE {filters}
{group_by_str}
ORDER BY "context.columns.count" DESC
"""

        query = parse_select(
            query_str,
            timings=self.timings,
        )
        assert isinstance(query, ast.SelectQuery)
        return query

    def _calculate(self):
        response = self.paginator.execute_insightsql_query(
            query_type="session_attribution_query",
            query=self.to_query(),
            team=self.team,
            timings=self.timings,
            modifiers=self.modifiers,
            filters=InsightsQLFilters(dateRange=self.query.filters.dateRange, properties=self.query.filters.properties)
            if self.query.filters
            else None,
        )

        return SessionAttributionExplorerQueryResponse(
            columns=response.columns,
            results=response.results,
            timings=response.timings,
            types=response.types,
            insightsql=response.insightsql,
            modifiers=self.modifiers,
            **self.paginator.response_params(),
        )
