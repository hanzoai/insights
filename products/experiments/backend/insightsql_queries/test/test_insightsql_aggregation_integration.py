from insights.test.base import BaseTest

from insights.schema import EventsNode, ExperimentMeanMetric, ExperimentMetricMathType

from insights.insightsql import ast

from products.experiments.backend.insightsql_queries.base_query_utils import get_metric_value


class TestInsightsQLAggregationIntegration(BaseTest):
    def test_get_metric_value_with_insightsql_aggregation(self):
        """Test that get_metric_value correctly extracts inner expressions from InsightsQL aggregations."""

        # Test with aggregation function
        metric_with_agg = ExperimentMeanMetric(
            source=EventsNode(
                event="revenue_event",
                math=ExperimentMetricMathType.INSIGHTSQL,
                math_insightsql="sum(properties.revenue - properties.expense)",
            )
        )

        result = get_metric_value(metric_with_agg)

        # Should return the inner expression (ArithmeticOperation), not the full sum() call
        self.assertIsInstance(result, ast.ArithmeticOperation)
        self.assertEqual(result.op, ast.ArithmeticOperationOp.Sub)  # type: ignore[attr-defined]

        # Test without aggregation function
        metric_without_agg = ExperimentMeanMetric(
            source=EventsNode(
                event="revenue_event", math=ExperimentMetricMathType.INSIGHTSQL, math_insightsql="properties.revenue"
            )
        )

        result_no_agg = get_metric_value(metric_without_agg)

        # Should return the field expression directly
        self.assertIsInstance(result_no_agg, ast.Field)
        self.assertEqual(result_no_agg.chain, ["properties", "revenue"])  # type: ignore[attr-defined]
