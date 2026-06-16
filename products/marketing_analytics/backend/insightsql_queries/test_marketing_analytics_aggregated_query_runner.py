from typing import Optional

from insights.test.base import BaseTest, ClickhouseTestMixin
from unittest.mock import Mock, patch

from insights.schema import BaseMathType, DateRange, MarketingAnalyticsAggregatedQuery, NodeKind

from insights.insightsql.test.utils import pretty_print_in_tests

from products.marketing_analytics.backend.insightsql_queries.marketing_analytics_aggregated_query_runner import (
    MarketingAnalyticsAggregatedQueryRunner,
)


class TestMarketingAnalyticsAggregatedQueryRunner(ClickhouseTestMixin, BaseTest):
    """Test suite for MarketingAnalyticsAggregatedQueryRunner."""

    maxDiff = None
    CLASS_DATA_LEVEL_SETUP = False

    def setUp(self):
        super().setUp()
        self.default_date_range = DateRange(date_from="2023-01-01", date_to="2023-01-31")
        self.default_query = MarketingAnalyticsAggregatedQuery(
            dateRange=self.default_date_range,
            properties=[],
        )

    def _create_query_runner(
        self, query: Optional[MarketingAnalyticsAggregatedQuery] = None
    ) -> MarketingAnalyticsAggregatedQueryRunner:
        if query is None:
            query = self.default_query
        return MarketingAnalyticsAggregatedQueryRunner(query=query, team=self.team)

    def test_join_uses_match_key_not_or_condition(self):
        """Verify the JOIN uses match_key instead of OR condition (ClickHouse doesn't support OR in JOIN ON)."""
        # Set up a conversion goal so the JOIN is generated
        self.team.marketing_analytics_config.conversion_goals = [
            {
                "kind": NodeKind.EVENTS_NODE,
                "event": "purchase",
                "conversion_goal_id": "test_goal",
                "conversion_goal_name": "Test Purchase",
                "name": "purchase",
                "math": BaseMathType.TOTAL,
                "schema_map": {"utm_campaign_name": "utm_campaign", "utm_source_name": "utm_source"},
            }
        ]
        self.team.marketing_analytics_config.save()

        runner = self._create_query_runner()

        # Mock the adapters to return a simple query
        mock_adapter = Mock()
        mock_adapter.get_source_id.return_value = "test_source"
        mock_adapter.build_query_string.return_value = (
            "SELECT 'Campaign' as campaign, 'id1' as id, 'google' as source, "
            "100 as impressions, 10 as clicks, 50.0 as cost, 5 as reported_conversion, "
            "'Campaign' as match_key"
        )

        with patch.object(runner, "_get_marketing_source_adapters", return_value=[mock_adapter]):
            query = runner.to_query()

        insightsql = query.to_insightsql()

        # Verify match_key is used for the JOIN (not campaign OR id)
        assert "campaign_costs.match_key" in insightsql, f"JOIN should use match_key field. Got: {insightsql}"
        assert "ucg.match_key" in insightsql, f"JOIN should reference ucg.match_key. Got: {insightsql}"

        # Verify there's no OR condition in the JOIN
        # The old code had: (campaign_costs.campaign = ucg.campaign) OR (campaign_costs.id = ucg.id)
        assert "or(equals(campaign_costs.campaign" not in insightsql.lower(), (
            f"JOIN should NOT use OR condition with campaign field. Got: {insightsql}"
        )

        # Snapshot the query
        assert pretty_print_in_tests(insightsql, self.team.pk) == self.snapshot
