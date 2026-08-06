from freezegun import freeze_time
from insights.test.base import APIBaseTest, DatastoreTestMixin, snapshot_datastore_queries

from insights.schema import ErrorTrackingIssueCorrelationQuery

from products.error_tracking.backend.insightsql_queries.error_tracking_issue_correlation_query_runner import (
    ErrorTrackingIssueCorrelationQueryRunner,
)


class TestErrorTrackingIssueCorrelationQueryRunner(DatastoreTestMixin, APIBaseTest):
    @classmethod
    def setUpClass(cls):
        # Materialize $exception_issue_id so the rendered SQL deterministically uses the
        # materialized column (as in production) regardless of test execution order, rather
        # than depending on another test having materialized it first on the shared table.
        from ee.datastore.materialized_columns.columns import get_materialized_columns, materialize

        if ("$exception_issue_id", "properties") not in get_materialized_columns("events"):
            materialize("events", "$exception_issue_id", is_nullable=True)
        super().setUpClass()

    def _calculate(
        self,
    ):
        return (
            ErrorTrackingIssueCorrelationQueryRunner(
                team=self.team,
                query=ErrorTrackingIssueCorrelationQuery(
                    kind="ErrorTrackingIssueCorrelationQuery",
                    events=["$pageview"],
                ),
            )
            .calculate()
            .model_dump()
        )

    @freeze_time("2022-01-10T12:11:00")
    @snapshot_datastore_queries
    def test_column_names(self):
        columns = self._calculate()["columns"]
        self.assertEqual(
            columns,
            [
                "id",
                "status",
                "name",
                "description",
                "first_seen",
                "assignee",
                "external_issues",
                "last_seen",
                "library",
                "odds_ratio",
                "population",
                "event",
            ],
        )
