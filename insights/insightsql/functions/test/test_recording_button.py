from insights.test.base import BaseTest

from insights.insightsql.errors import QueryError
from insights.insightsql.query import execute_insightsql_query


class TestRecordingButton(BaseTest):
    def test_recording_button(self):
        response = execute_insightsql_query("select recordingButton('12345-6789', 'active')", self.team, pretty=False)
        self.assertEqual(
            response.clickhouse,
            f"SELECT tuple(%(insightsql_val_0)s, %(insightsql_val_1)s, %(insightsql_val_2)s, %(insightsql_val_3)s, %(insightsql_val_4)s, %(insightsql_val_5)s) LIMIT 100 SETTINGS readonly=2, max_execution_time=60, allow_experimental_object_type=1, format_csv_allow_double_quotes=0, max_ast_elements=4000000, max_expanded_ast_elements=4000000, max_bytes_before_external_group_by=0, transform_null_in=1, optimize_min_equality_disjunction_chain_length=4294967295, allow_experimental_join_condition=1, use_hive_partitioning=0",
        )
        self.assertEqual(
            response.insightsql,
            f"SELECT tuple('__hx_tag', 'RecordingButton', 'sessionId', '12345-6789', 'recordingStatus', 'active') LIMIT 100",
        )
        self.assertEqual(
            response.results[0][0],
            ("__hx_tag", "RecordingButton", "sessionId", "12345-6789", "recordingStatus", "active"),
        )

    def test_recording_button_error(self):
        with self.assertRaises(QueryError) as e:
            execute_insightsql_query(f"SELECT recordingButton()", self.team)
        self.assertEqual(str(e.exception), "Function 'recordingButton' expects at least 1 argument, found 0")
