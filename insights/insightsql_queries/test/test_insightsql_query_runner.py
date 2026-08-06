from datetime import UTC, datetime
from typing import cast

from insights.test.base import APIBaseTest, DatastoreTestMixin, _create_event, _create_person, flush_persons_and_events
from unittest.mock import patch

from parameterized import parameterized

from insights.schema import (
    CachedInsightsQLQueryResponse,
    InsightsQLFilters,
    InsightsQLPropertyFilter,
    InsightsQLQuery,
    InsightsQLQueryResponse,
    InsightsQLVariable,
)

from insights.insightsql import ast
from insights.insightsql.errors import ExposedInsightsQLError, QueryError
from insights.insightsql.user_query_validator import INSIGHTSQL_PERSONAL_API_KEY_OFFSET_ALLOWED_FLAG, OFFSET_NOT_ALLOWED_MESSAGE
from insights.insightsql.visitor import clear_locations

from insights.caching.utils import ThresholdMode, staleness_threshold_map
from insights.insightsql_queries.insightsql_query_runner import InsightsQLQueryRunner
from insights.models.utils import UUIDT

from products.product_analytics.backend.models.insight_variable import InsightVariable
from products.warehouse_sources.backend.facade.models import ExternalDataSource
from products.warehouse_sources.backend.facade.types import ExternalDataSourceType


class TestInsightsQLQueryRunner(DatastoreTestMixin, APIBaseTest):
    maxDiff = None
    random_uuid: str

    def _create_random_persons(self) -> str:
        random_uuid = f"RANDOM_TEST_ID::{UUIDT()}"
        for index in range(10):
            _create_person(
                properties={
                    "email": f"jacob{index}@{random_uuid}.hanzo.ai",
                    "name": f"Mr Jacob {random_uuid}",
                    "random_uuid": random_uuid,
                    "index": index,
                },
                team=self.team,
                distinct_ids=[f"id-{random_uuid}-{index}"],
                is_identified=True,
            )
            _create_event(
                distinct_id=f"id-{random_uuid}-{index}",
                event=f"clicky-{index}",
                team=self.team,
            )
        flush_persons_and_events()
        return random_uuid

    def _create_runner(self, query: InsightsQLQuery) -> InsightsQLQueryRunner:
        return InsightsQLQueryRunner(team=self.team, query=query)

    def setUp(self):
        super().setUp()
        self.random_uuid = self._create_random_persons()

    def test_default_insightsql_query(self):
        runner = self._create_runner(InsightsQLQuery(query="select count(event) from events"))
        query = runner.to_query()
        query = clear_locations(query)
        expected = ast.SelectQuery(
            select=[ast.Call(name="count", args=[ast.Field(chain=["event"])])],
            select_from=ast.JoinExpr(table=ast.Field(chain=["events"])),
        )
        self.assertEqual(clear_locations(query), expected)
        response = runner.calculate()
        self.assertEqual(response.results[0][0], 10)

        self.assertEqual(response.hasMore, False)
        self.assertIsNotNone(response.limit)

    def test_default_insightsql_query_with_limit(self):
        runner = self._create_runner(InsightsQLQuery(query="select event from events limit 5"))
        response = runner.calculate()
        assert response.results is not None
        self.assertEqual(len(response.results), 5)
        self.assertNotIn("hasMore", response)

    def test_insightsql_query_filters(self):
        runner = self._create_runner(
            InsightsQLQuery(
                query="select count(event) from events where {filters}",
                filters=InsightsQLFilters(properties=[InsightsQLPropertyFilter(key="event='clicky-3'")]),
            )
        )
        query = runner.to_query()
        query = clear_locations(query)
        expected = ast.SelectQuery(
            select=[ast.Call(name="count", args=[ast.Field(chain=["event"])])],
            select_from=ast.JoinExpr(table=ast.Field(chain=["events"])),
            where=ast.CompareOperation(
                left=ast.Field(chain=["event"]),
                op=ast.CompareOperationOp.Eq,
                right=ast.Constant(value="clicky-3"),
            ),
        )
        self.assertEqual(clear_locations(query), expected)
        response = runner.calculate()
        self.assertEqual(response.results[0][0], 1)

    def test_insightsql_query_values(self):
        runner = self._create_runner(
            InsightsQLQuery(
                query="select count(event) from events where event={e}",
                values={"e": "clicky-3"},
            )
        )
        query = runner.to_query()
        query = clear_locations(query)
        expected = ast.SelectQuery(
            select=[ast.Call(name="count", args=[ast.Field(chain=["event"])])],
            select_from=ast.JoinExpr(table=ast.Field(chain=["events"])),
            where=ast.CompareOperation(
                left=ast.Field(chain=["event"]),
                op=ast.CompareOperationOp.Eq,
                right=ast.Constant(value="clicky-3"),
            ),
        )
        self.assertEqual(clear_locations(query), expected)
        response = runner.calculate()
        self.assertEqual(response.results[0][0], 1)

    def test_cache_target_age_is_two_hours_in_future_after_run(self):
        runner = self._create_runner(InsightsQLQuery(query="select count(event) from events"))

        fixed_now = datetime(2023, 1, 1, 12, 0, 0, tzinfo=UTC)
        expected_target_age = fixed_now + staleness_threshold_map[ThresholdMode.DEFAULT]["day"]

        with patch("insights.insightsql_queries.query_runner.datetime") as mock_datetime:
            mock_datetime.now.return_value = fixed_now
            mock_datetime.timezone.utc = UTC

            response = cast(CachedInsightsQLQueryResponse, runner.run())

            self.assertIsNotNone(response.cache_target_age)
            self.assertEqual(response.cache_target_age, expected_target_age)

    @parameterized.expand(
        [
            # system.information_schema.* mirrors mutable data-catalog state, so it must never be
            # served from the query cache — recompute every time regardless of the caller's mode.
            ("metrics", "select name, status from system.information_schema.metrics", True),
            ("tables", "select * from system.information_schema.tables", True),
            ("relationships", "select * from system.information_schema.relationships", True),
            ("columns", "select * from system.information_schema.columns", True),
            ("other_system_table", "select id, name from system.insights", False),
            ("events", "select count(event) from events", False),
            ("unparseable", "INVALID SQL SYNTAX", False),
        ]
    )
    def test_requires_fresh_calculation(self, _name: str, query: str, expected: bool):
        runner = self._create_runner(InsightsQLQuery(query=query))
        self.assertEqual(runner.requires_fresh_calculation(), expected)

    def test_requires_fresh_calculation_false_for_external_connection(self):
        # External-connection queries run against an upstream source, never the Datastore catalog,
        # so they keep normal caching even if the text happens to reference information_schema.
        runner = self._create_runner(
            InsightsQLQuery(query="select * from system.information_schema.metrics", connectionId="conn-123")
        )
        self.assertFalse(runner.requires_fresh_calculation())

    def test_variables_in_hog_expression(self):
        variable = InsightVariable.objects.create(team=self.team, name="Foo", code_name="foo", type="Boolean")
        variable_id = str(variable.id)

        runner = self._create_runner(
            InsightsQLQuery(
                query="select {variables.foo ? 'exists' : 'does not'}",
                variables={
                    variable_id: InsightsQLVariable(code_name=variable.code_name, variableId=variable_id, value=True)
                },
            )
        )

        response = runner.calculate()
        self.assertEqual(response.results[0][0], "exists")

    def test_variables_in_hog_expression_sql(self):
        variable = InsightVariable.objects.create(team=self.team, name="Bar", code_name="bar", type="Boolean")
        variable_id = str(variable.id)

        _create_event(distinct_id=f"id-{self.random_uuid}-3", event="clicky-3", team=self.team)
        flush_persons_and_events()

        query = "select count() from events where {variables.bar ? sql(event = 'clicky-3') : sql(event = 'clicky-4')}"

        runner_true = self._create_runner(
            InsightsQLQuery(
                query=query,
                variables={
                    variable_id: InsightsQLVariable(code_name=variable.code_name, variableId=variable_id, value=True)
                },
            )
        )
        result_true = runner_true.calculate()
        self.assertEqual(result_true.results[0][0], 2)

        runner_false = self._create_runner(
            InsightsQLQuery(
                query=query,
                variables={
                    variable_id: InsightsQLVariable(code_name=variable.code_name, variableId=variable_id, value=False)
                },
            )
        )
        result_false = runner_false.calculate()
        self.assertEqual(result_false.results[0][0], 1)

    def test_invalid_connection_id_raises_exposed_insightsql_error(self):
        runner = self._create_runner(
            InsightsQLQuery(
                query="select 1",
                connectionId=str(UUIDT()),
            )
        )

        with self.assertRaises(ExposedInsightsQLError):
            runner.calculate()

    @patch("insights.insightsql_queries.insightsql_query_runner.execute_insightsql_query")
    def test_send_raw_query_uses_raw_query_string_for_direct_connections(self, mock_execute_insightsql_query):
        source = ExternalDataSource.objects.create(
            source_id="selected-upstream-source",
            connection_id="selected-connection",
            destination_id="destination-1",
            team=self.team,
            status=ExternalDataSource.Status.COMPLETED,
            source_type=ExternalDataSourceType.POSTGRES,
            access_method=ExternalDataSource.AccessMethod.DIRECT,
        )
        mock_execute_insightsql_query.return_value = InsightsQLQueryResponse(results=[(1,)], columns=["value"], types=[])

        runner = self._create_runner(
            InsightsQLQuery(
                query="select 1::int as value",
                connectionId=str(source.id),
                sendRawQuery=True,
            )
        )

        response = runner.calculate()

        self.assertEqual(response.results, [(1,)])
        mock_execute_insightsql_query.assert_called_once()
        self.assertEqual(mock_execute_insightsql_query.call_args.kwargs["query"], "select 1::int as value")
        self.assertEqual(mock_execute_insightsql_query.call_args.kwargs["connection_id"], str(source.id))
        self.assertEqual(mock_execute_insightsql_query.call_args.kwargs["send_raw_query"], True)

    @patch("insights.insightsql_queries.insightsql_query_runner.execute_insightsql_query")
    def test_send_raw_query_is_ignored_without_direct_connection(self, mock_execute_insightsql_query):
        mock_execute_insightsql_query.return_value = InsightsQLQueryResponse(results=[(10,)], columns=["count"], types=[])

        runner = self._create_runner(
            InsightsQLQuery(
                query="select count(event) from events limit 100",
                sendRawQuery=True,
            )
        )

        response = runner.calculate()

        self.assertEqual(response.results, [(10,)])
        mock_execute_insightsql_query.assert_called_once()
        self.assertIsInstance(mock_execute_insightsql_query.call_args.kwargs["query"], ast.SelectQuery)
        self.assertNotIn("send_raw_query", mock_execute_insightsql_query.call_args.kwargs)

    def test_soft_deleted_connection_id_raises_exposed_insightsql_error(self):
        source = ExternalDataSource.objects.create(
            source_id="selected-upstream-source",
            connection_id="selected-connection",
            destination_id="destination-1",
            team=self.team,
            status=ExternalDataSource.Status.COMPLETED,
            source_type=ExternalDataSourceType.POSTGRES,
            deleted=True,
        )
        runner = self._create_runner(
            InsightsQLQuery(
                query="select 1",
                connectionId=str(source.id),
            )
        )

        with self.assertRaises(ExposedInsightsQLError):
            runner.calculate()

    def test_non_direct_connection_id_raises_exposed_insightsql_error(self):
        source = ExternalDataSource.objects.create(
            source_id="selected-upstream-source",
            connection_id="selected-connection",
            destination_id="destination-1",
            team=self.team,
            status=ExternalDataSource.Status.COMPLETED,
            source_type=ExternalDataSourceType.STRIPE,
            access_method=ExternalDataSource.AccessMethod.WAREHOUSE,
        )

        runner = self._create_runner(
            InsightsQLQuery(
                query="select * from stripe.customers limit 1",
                connectionId=str(source.id),
            )
        )

        with self.assertRaises(ExposedInsightsQLError):
            runner.calculate()

    @parameterized.expand(
        [
            # Plain OFFSET on SelectQuery
            ("top_level", "select event from events limit 10 offset 5"),
            # Recursion into a subquery
            ("subquery", "select * from (select event from events limit 10 offset 5) sub"),
            # Distinct AST node: SelectSetQuery.offset (OFFSET at UNION level)
            (
                "select_set_outer",
                "(select event from events limit 5) union all (select event from events limit 5) limit 10 offset 5",
            ),
            # Distinct AST node: LimitByExpr.offset_value
            ("limit_by", "select event, timestamp from events limit 5 by event offset 10"),
            # OFFSET arrives via placeholder — proves hook runs after to_query() substitution.
            ("placeholder", "select event from events limit 10 offset {o}"),
        ]
    )
    @patch("hanzo_insights.feature_enabled", return_value=False)
    def test_query_service_rejects_offset(self, _name, sql, _mock_flag):
        values = {"o": 50} if "{o}" in sql else None
        runner = self._create_runner(InsightsQLQuery(query=sql, values=values))
        runner.is_query_service = True

        with self.assertRaises(QueryError) as ctx:
            runner.calculate()
        self.assertEqual(OFFSET_NOT_ALLOWED_MESSAGE, str(ctx.exception))

    @patch("hanzo_insights.feature_enabled", return_value=True)
    def test_query_service_allows_offset_when_org_on_allow_list(self, _mock_flag):
        # Grandfathered via the allow-list flag → query passes through to execution.
        runner = self._create_runner(InsightsQLQuery(query="select event from events limit 10 offset 5"))
        runner.is_query_service = True

        response = runner.calculate()
        self.assertEqual(len(response.results), 5)

    def test_query_service_fails_open_when_flag_service_errors(self):
        # Flag-service outage must not cascade into rejecting previously-valid traffic.
        # Scope the error to our flag only — a blanket raise would break unrelated flag checks
        # downstream in the query execution path.
        def flag_side_effect(flag, *_args, **_kwargs):
            if flag == INSIGHTSQL_PERSONAL_API_KEY_OFFSET_ALLOWED_FLAG:
                raise RuntimeError("flag service down")
            return False

        runner = self._create_runner(InsightsQLQuery(query="select event from events limit 10 offset 5"))
        runner.is_query_service = True

        with patch("hanzo_insights.feature_enabled", side_effect=flag_side_effect):
            response = runner.calculate()
        self.assertEqual(len(response.results), 5)

    @patch("hanzo_insights.feature_enabled", return_value=False)
    def test_non_query_service_allows_offset(self, _mock_flag):
        # Product queries (Trends/Funnels/etc.) have is_query_service=False — must pass through
        # even when the flag says "deny everything." Guards the `if self.is_query_service:` gate.
        runner = self._create_runner(InsightsQLQuery(query="select event from events limit 10 offset 5"))

        response = runner.calculate()
        self.assertEqual(len(response.results), 5)
