from posthog.insightsql import ast
from posthog.insightsql.parser import parse_select
from posthog.insightsql.query import execute_insightsql_query

from posthog.clickhouse.client.connection import Workload
from posthog.models import Team


class HasLogsQueryRunner:
    def __init__(self, team: Team):
        self.team = team

    def run(self) -> bool:
        query = parse_select("SELECT 1 FROM logs LIMIT 1")
        assert isinstance(query, ast.SelectQuery)

        response = execute_insightsql_query(
            query_type="HasLogsQuery",
            query=query,
            team=self.team,
            workload=Workload.LOGS,
        )

        return len(response.results) > 0
