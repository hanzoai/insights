import datetime as dt

import structlog

from django.core.cache import cache

from insights.insightsql import ast
from insights.insightsql.parser import parse_select
from insights.insightsql.query import execute_insightsql_query

from insights.datastore.client.connection import Workload
from insights.models import Team

logger = structlog.get_logger(__name__)

HAS_LOGS_CACHE_TTL = int(dt.timedelta(days=7).total_seconds())


class HasLogsQueryRunner:
    def __init__(self, team: Team):
        self.team = team

    def run(self) -> bool:
        query = parse_select("SELECT 1 FROM logs LIMIT 1")
        assert isinstance(query, ast.SelectQuery)

        try:
            response = execute_insightsql_query(
                query_type="HasLogsQuery",
                query=query,
                team=self.team,
                workload=Workload.LOGS,
            )
        except Exception:
            # "Does this team have logs?" has an answer even when the table is
            # not there, and the answer is no. This deployment does not carry a
            # logs table -- `SELECT 1 FROM logs` fails on the datastore while the
            # same query against `events` succeeds -- so the question was raising
            # a 500 on a plain GET rather than answering it, and the logs scene
            # reported a server error instead of an empty state.
            logger.warning("has_logs_query_failed", team_id=self.team.id, exc_info=True)
            return False

        return len(response.results) > 0


def team_has_logs(team: Team) -> bool:
    cache_key = f"team:{team.id}:has_logs"
    if cache.get(cache_key) is True:
        return True

    has_logs = HasLogsQueryRunner(team).run()
    if has_logs:
        cache.set(cache_key, True, HAS_LOGS_CACHE_TTL)
    return has_logs
