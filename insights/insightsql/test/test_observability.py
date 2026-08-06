from insights.test.base import BaseTest
from unittest.mock import patch

from django.test import SimpleTestCase

from parameterized import parameterized
from prometheus_client import REGISTRY

from insights.insightsql import ast
from insights.insightsql.context import InsightsQLContext
from insights.insightsql.database.database import Database
from insights.insightsql.observability import (
    InsightsQLTypeObservability,
    classify_constant_type,
    classify_expr_type,
    classify_function_group,
    collect_insightsql_sql_shape,
    collect_insightsql_type_coverage,
    create_insightsql_type_observability,
    emit_insightsql_type_observability,
)
from insights.insightsql.parser import parse_select
from insights.insightsql.resolver import resolve_types
from insights.insightsql.transforms.property_types import build_property_swapper

from insights.datastore.query_tagging import Product
from insights.models import PropertyDefinition

from products.event_definitions.backend.models.property_definition import PropertyType as PropertyDefinitionType


def _metric(name: str, labels: dict[str, str]) -> float:
    return REGISTRY.get_sample_value(name, labels) or 0.0


class TestInsightsQLTypeObservability(SimpleTestCase):
    @patch("insights.insightsql.observability.TYPE_OBSERVABILITY_SAMPLE_RATE", 0.0)
    def test_zero_sample_rate_creates_no_accumulator(self):
        base = {"engine": "current", "dialect": "datastore", "source": "sql_editor"}
        before = _metric("insightsql_typecheck_total", {**base, "result": "success"})

        stats = create_insightsql_type_observability(dialect="datastore", source="sql_editor")

        self.assertIsNone(stats)
        emit_insightsql_type_observability(stats)  # no-op on None
        self.assertEqual(_metric("insightsql_typecheck_total", {**base, "result": "success"}), before)

    @patch("insights.insightsql.observability.TYPE_OBSERVABILITY_SAMPLE_RATE", 1.0)
    def test_sampling_returns_accumulator(self):
        stats = create_insightsql_type_observability(dialect="datastore", source="sql_editor")
        self.assertIsNotNone(stats)

    def test_observability_failures_never_propagate(self):
        # A bug anywhere in the observability path must not break query execution.
        stats = InsightsQLTypeObservability(dialect="datastore", source="sql_editor")
        before_errors = _metric("insightsql_type_observability_errors_total", {"stage": "collect_insightsql_type_coverage"})

        with patch("insights.insightsql.observability.TypeCoverageCollector", side_effect=RuntimeError("boom")):
            # Does not raise, despite the collector blowing up.
            collect_insightsql_type_coverage(ast.Constant(value=1), stats)

        self.assertEqual(
            _metric("insightsql_type_observability_errors_total", {"stage": "collect_insightsql_type_coverage"}) - before_errors,
            1,
        )

    def test_record_methods_swallow_bad_input(self):
        stats = InsightsQLTypeObservability(dialect="datastore", source="sql_editor")
        before_errors = _metric("insightsql_type_observability_errors_total", {"stage": "record_function_call"})

        # function_name=None makes classify_function_group raise (None.lower()); @_safe must swallow it.
        stats.record_function_call(function_name=None, return_type=ast.UnknownType(), signatures_present=False)  # type: ignore[arg-type]

        self.assertEqual(
            _metric("insightsql_type_observability_errors_total", {"stage": "record_function_call"}) - before_errors, 1
        )
        emit_insightsql_type_observability(stats)  # must not raise

    @patch("insights.insightsql.observability.TYPE_OBSERVABILITY_SAMPLE_RATE", 1.0)
    def test_emits_expression_coverage_metrics_with_bounded_labels(self):
        base = {"engine": "current", "dialect": "datastore", "source": "sql_editor"}
        before_observed = _metric("insightsql_expression_observed_total", base)
        before_precise = _metric("insightsql_expression_typed_total", {**base, "precision": "precise"})
        before_unknown = _metric("insightsql_expression_typed_total", {**base, "precision": "unknown"})

        stats = create_insightsql_type_observability(dialect="datastore", source="sql_editor")
        node = ast.Array(
            exprs=[
                ast.Constant(value="known", type=ast.StringType()),
                ast.Call(name="unknownFunc", args=[], type=ast.UnknownType()),
            ],
            type=ast.ArrayType(item_type=ast.UnknownType()),
        )

        collect_insightsql_type_coverage(node, stats)
        emit_insightsql_type_observability(stats)

        self.assertEqual(_metric("insightsql_expression_observed_total", base) - before_observed, 3)
        self.assertEqual(_metric("insightsql_expression_typed_total", {**base, "precision": "precise"}) - before_precise, 1)
        self.assertEqual(_metric("insightsql_expression_typed_total", {**base, "precision": "unknown"}) - before_unknown, 2)

    @parameterized.expand(
        [
            ("scalar", ast.StringType(), "precise"),
            ("unknown", ast.UnknownType(), "unknown"),
            ("array_of_unknown", ast.ArrayType(item_type=ast.UnknownType()), "unknown"),
        ]
    )
    def test_classifies_constant_type_precision(self, _name, type_, expected):
        self.assertEqual(classify_constant_type(type_), expected)

    def test_classifies_call_expr_precision(self):
        self.assertEqual(
            classify_expr_type(ast.CallType(name="concat", arg_types=[ast.StringType()], return_type=ast.StringType())),
            "precise",
        )

    def test_collects_sql_shape_pathologies_from_ast(self):
        stats = InsightsQLTypeObservability(dialect="datastore", source="sql_editor")
        node = ast.Call(
            name="ifNull",
            args=[
                ast.Call(name="toDateTime", args=[ast.Field(chain=["timestamp"])]),
                ast.Constant(value="fallback"),
            ],
        )

        collect_insightsql_sql_shape(node, stats)

        self.assertEqual(stats.sql_shape["nullable_comparison_wrapper"], 1)
        self.assertEqual(stats.sql_shape["datetime_cast"], 1)
        self.assertEqual(stats.sql_shape["property_conversion_wrapper"], 1)

    def test_records_property_typing_results(self):
        stats = InsightsQLTypeObservability(dialect="datastore", source="sql_editor")

        stats.record_property_definition_lookup(property_source="event", known_count=2, total_count=3)
        stats.record_property_definition_lookup(property_source="person", known_count=1, total_count=1)

        self.assertEqual(stats.property_typing["event_known"], 2)
        self.assertEqual(stats.property_typing["event_unknown"], 1)
        self.assertEqual(stats.property_typing["person_known"], 1)
        self.assertEqual(stats.unknown_by_reason["unknown_property_metadata"], 1)

    def test_records_materialized_property_usage_with_bounded_labels(self):
        stats = InsightsQLTypeObservability(dialect="datastore", source="sql_editor")

        stats.record_materialized_property_usage("materialized_column")
        stats.record_materialized_property_usage("json")
        stats.record_materialized_property_usage("json_subcolumn")
        stats.record_materialized_property_usage("not_a_real_source_kind")

        self.assertEqual(stats.materialized_property_usage["materialized_column"], 1)
        self.assertEqual(stats.materialized_property_usage["json"], 1)
        self.assertEqual(stats.materialized_property_usage["json_subcolumn"], 1)
        self.assertEqual(stats.materialized_property_usage["unknown"], 1)

    def test_records_and_emits_materialized_range_rewrites(self):
        base = {"engine": "current", "dialect": "datastore", "source": "sql_editor"}
        before_fired = _metric("insightsql_materialized_range_rewrite_total", {**base, "result": "fired_compare"})
        before_skipped = _metric("insightsql_materialized_range_rewrite_total", {**base, "result": "skipped"})

        stats = InsightsQLTypeObservability(dialect="datastore", source="sql_editor")
        stats.record_materialized_range_rewrite("fired_compare")
        stats.record_materialized_range_rewrite("fired_compare")
        stats.record_materialized_range_rewrite("skipped")
        stats.record_materialized_range_rewrite("not_a_real_outcome")
        emit_insightsql_type_observability(stats)

        self.assertEqual(
            _metric("insightsql_materialized_range_rewrite_total", {**base, "result": "fired_compare"}) - before_fired, 2
        )
        self.assertEqual(
            _metric("insightsql_materialized_range_rewrite_total", {**base, "result": "skipped"}) - before_skipped, 1
        )
        self.assertEqual(stats.materialized_range_rewrite["unknown"], 1)

    @patch("insights.insightsql.observability.TYPE_OBSERVABILITY_SAMPLE_RATE", 1.0)
    def test_source_falls_back_to_query_tags_product(self):
        with patch("insights.insightsql.observability.get_query_tags") as mock_tags:
            mock_tags.return_value.product = Product.WAREHOUSE
            stats = create_insightsql_type_observability(dialect="datastore")

        assert stats is not None
        self.assertEqual(stats.source, "warehouse")

    @patch("insights.insightsql.observability.TYPE_OBSERVABILITY_SAMPLE_RATE", 1.0)
    def test_explicit_source_wins_over_query_tags(self):
        with patch("insights.insightsql.observability.get_query_tags") as mock_tags:
            mock_tags.return_value.product = Product.WAREHOUSE
            stats = create_insightsql_type_observability(dialect="datastore", source="probe")

        assert stats is not None
        self.assertEqual(stats.source, "probe")

    @parameterized.expand(
        [
            ("toDateTime", "cast"),
            ("JSONExtractString", "json"),
            ("arrayMap", "array"),
            ("someCustomThing", "unknown"),
        ]
    )
    def test_function_groups_are_bounded(self, name, expected):
        self.assertEqual(classify_function_group(name), expected)


class TestTypeCoverageResolution(BaseTest):
    """Reference types (columns, properties) only resolve to a concrete scalar against a context."""

    def setUp(self):
        super().setUp()
        self.database = Database.create_for(team=self.team)
        self.context = InsightsQLContext(database=self.database, team_id=self.team.pk, enable_select_queries=True)

    def _resolved_column_type(self, query: str) -> ast.Type | None:
        node = parse_select(query)
        node = resolve_types(node, self.context, dialect="datastore")
        assert isinstance(node, ast.SelectQuery)
        # Populates context.property_swapper, which the property metadata path reads from.
        build_property_swapper(node, self.context)
        column_type = node.select[0].type
        # Selected columns are wrapped in a FieldAliasType; unwrap to the underlying reference.
        if isinstance(column_type, ast.FieldAliasType):
            return column_type.type
        return column_type

    def test_bare_field_with_typed_column_is_precise(self):
        field_type = self._resolved_column_type("SELECT timestamp FROM events")
        self.assertIsInstance(field_type, ast.FieldType)

        self.assertEqual(classify_expr_type(field_type, self.context), "precise")
        # No context → cannot resolve → partial.
        self.assertEqual(classify_expr_type(field_type), "partial")

    def test_property_with_metadata_is_precise(self):
        PropertyDefinition.objects.create(
            team=self.team,
            name="foo",
            property_type=PropertyDefinitionType.Numeric,
            type=PropertyDefinition.Type.EVENT,
        )
        property_type = self._resolved_column_type("SELECT properties.foo FROM events")
        self.assertIsInstance(property_type, ast.PropertyType)

        self.assertEqual(classify_expr_type(property_type, self.context), "precise")

    def test_property_without_metadata_is_partial_not_string_fallback(self):
        property_type = self._resolved_column_type("SELECT properties.unknown_prop FROM events")
        assert isinstance(property_type, ast.PropertyType)

        # Resolution falls back to the blob's String type (classify_constant_type would call that
        # precise); the special-casing returns partial instead, since metadata is missing.
        self.assertEqual(classify_constant_type(property_type.resolve_constant_type(self.context)), "precise")
        self.assertEqual(classify_expr_type(property_type, self.context), "partial")

    def test_unresolvable_field_classifies_partial_without_raising(self):
        before_errors = _metric("insightsql_type_observability_errors_total", {"stage": "collect_insightsql_type_coverage"})

        # events.person is a lazy join, not a DatabaseField — resolve_constant_type raises.
        field_type = ast.FieldType(name="person", table_type=ast.TableType(table=self.database.get_table("events")))

        self.assertEqual(classify_expr_type(field_type, self.context), "partial")
        # An expected unresolvable reference must not inflate the error counter.
        self.assertEqual(
            _metric("insightsql_type_observability_errors_total", {"stage": "collect_insightsql_type_coverage"}), before_errors
        )

    @parameterized.expand(
        [
            ("array_of_string", ast.ArrayType(item_type=ast.StringType()), "precise"),
            ("array_of_unknown", ast.ArrayType(item_type=ast.UnknownType()), "unknown"),
            ("tuple_all_known", ast.TupleType(item_types=[ast.StringType(), ast.IntegerType()]), "precise"),
            ("tuple_with_unknown", ast.TupleType(item_types=[ast.StringType(), ast.UnknownType()]), "unknown"),
        ]
    )
    def test_constant_types_recurse_unchanged_with_context(self, _name, type_, expected):
        # A threaded context must not change how constant types already classify.
        self.assertEqual(classify_expr_type(type_, self.context), expected)
        self.assertEqual(classify_expr_type(type_), expected)
