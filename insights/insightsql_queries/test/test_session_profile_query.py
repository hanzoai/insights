from insights.test.base import APIBaseTest, DatastoreTestMixin


from insights.insightsql.context import InsightsQLContext
from insights.insightsql.modifiers import create_default_modifiers_for_team
from insights.insightsql.parser import parse_select
from insights.insightsql.printer import prepare_ast_for_printing, print_prepared_ast


class TestSessionProfileQuery(DatastoreTestMixin, APIBaseTest):
    def _print_session_query(self, query: str) -> str:
        modifiers = create_default_modifiers_for_team(self.team)
        context = InsightsQLContext(
            team_id=self.team.pk,
            team=self.team,
            enable_select_queries=True,
            modifiers=modifiers,
        )
        prepared_ast = prepare_ast_for_printing(node=parse_select(query), context=context, dialect="datastore")
        if prepared_ast is None:
            return ""
        return print_prepared_ast(prepared_ast, context=context, dialect="datastore", pretty=True)



    def test_session_profile_with_timestamp_filter_v2(self):
        """
        Test that toDateTime is properly recognized for partition pruning on v2 sessions.
        The frontend extracts the timestamp from UUIDv7 and uses toDateTime for filtering.
        """
        actual = self._print_session_query(
            """
SELECT
    session_id,
    distinct_id,
    $start_timestamp,
    $end_timestamp,
    $session_duration
FROM sessions
WHERE $start_timestamp >= toDateTime('2025-01-15T10:00:00.000Z')
    AND $start_timestamp <= toDateTime('2025-01-15T11:00:00.000Z')
    AND session_id = '019c2a52-6519-772d-b99a-60ba7cc4e266'
LIMIT 1
"""
        )
        assert self.generalize_sql(actual) == self.snapshot
