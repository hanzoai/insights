from freezegun import freeze_time
from insights.test.base import APIBaseTest, DatastoreTestMixin, snapshot_datastore_queries

from insights.schema import ErrorTrackingIssueCorrelationQuery

from products.error_tracking.backend.insightsql_queries.error_tracking_issue_correlation_query_runner import (
    ErrorTrackingIssueCorrelationQueryRunner,
)


class TestErrorTrackingIssueCorrelationQueryRunner(DatastoreTestMixin, APIBaseTest):
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
