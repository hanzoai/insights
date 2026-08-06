import pytest

from insights.insightsql.insightsql import ast
from insights.insightsql.printer import prepare_ast_for_printing, print_prepared_ast

from insights.credentials import AWSKeyPair
from insights.sync import database_sync_to_async

from products.batch_exports.backend.insightsql_source import UnsupportedInsightsQLQueryError
from products.batch_exports.backend.service import BatchExportModel
from products.batch_exports.backend.temporal.record_batch_model import (
    InsightsQLQueryRecordBatchModel,
    SessionsRecordBatchModel,
    resolve_batch_exports_model,
)

pytestmark = [pytest.mark.asyncio, pytest.mark.django_db]


class TestSessionsRecordBatchModel:
    async def test_get_insightsql_query(self, ateam, data_interval_start, data_interval_end):
        model = SessionsRecordBatchModel(
            team_id=ateam.id,
        )
        insightsql_query = model.get_insightsql_query(data_interval_start, data_interval_end)
        team_id_filter = ast.CompareOperation(
            op=ast.CompareOperationOp.Eq,
            left=ast.Field(chain=["sessions", "team_id"]),
            right=ast.Constant(value=ateam.id),
        )

        assert insightsql_query.where is not None
        assert isinstance(insightsql_query.where, ast.And)
        assert team_id_filter in insightsql_query.where.exprs

    async def test_as_query_with_parameters(self, ateam, data_interval_start, data_interval_end):
        model = SessionsRecordBatchModel(
            team_id=ateam.id,
        )
        printed_query, _ = await model.as_query_with_parameters(data_interval_start, data_interval_end)

        assert f"equals(raw_sessions.team_id, {ateam.id})" in printed_query
        assert "FORMAT ArrowStream" in printed_query
        assert (
            f"greaterOrEquals(_inserted_at, toDateTime64('{data_interval_start:%Y-%m-%d %H:%M:%S.%f}', 6, 'UTC')"
            in printed_query
        )
        assert f"less(_inserted_at, toDateTime64('{data_interval_end:%Y-%m-%d %H:%M:%S.%f}', 6, 'UTC')" in printed_query

        # check that we have a date range set on the inner query using the session ID
        assert (
            "lessOrEquals(fromUnixTimestamp(intDiv(toUInt64(bitShiftRight(raw_sessions.session_id_v7, 80)), 1000)), plus("
            in printed_query
        )
        assert (
            "greaterOrEquals(fromUnixTimestamp(intDiv(toUInt64(bitShiftRight(raw_sessions.session_id_v7, 80)), 1000)), minus("
            in printed_query
        )

    async def test_get_insightsql_query_returns_independent_ast_per_call(
        self, ateam, another_ateam, data_interval_start, data_interval_end
    ):
        """get_insightsql_query must return an independent AST each time, not a shared mutable reference."""
        model_a = SessionsRecordBatchModel(team_id=ateam.id)
        model_b = SessionsRecordBatchModel(team_id=another_ateam.id)

        query_a = model_a.get_insightsql_query(data_interval_start, data_interval_end)
        query_b = model_b.get_insightsql_query(data_interval_start, data_interval_end)

        assert query_a is not query_b

    async def test_interleaved_calls_do_not_mix_team_ids(
        self, ateam, another_ateam, data_interval_start, data_interval_end
    ):
        """Regression test to reproduce a previous race condition in as_query_with_parameters where
        two different models were created with different team IDs, and the second model's query
        overwrote the first model's query."""

        model_a = SessionsRecordBatchModel(team_id=ateam.id)
        model_b = SessionsRecordBatchModel(team_id=another_ateam.id)

        # Task A: get_insightsql_query sets .where with team A's filter
        insightsql_query_a = model_a.get_insightsql_query(data_interval_start, data_interval_end)
        # Task A: awaits get_insightsql_context (yields control)
        context_a = await model_a.get_insightsql_context()
        # Task B runs during the yield and overwrites .where with team B's filter
        model_b.get_insightsql_query(data_interval_start, data_interval_end)
        # Task A resumes and prints the query — insightsql_query_a is a ref to the shared object
        prepared = await database_sync_to_async(prepare_ast_for_printing)(
            insightsql_query_a, context=context_a, dialect="datastore", stack=[]
        )
        assert prepared is not None
        context_a.output_format = "ArrowStream"
        printed_query = print_prepared_ast(prepared, context=context_a, dialect="datastore", stack=[])

        assert f"equals(raw_sessions.team_id, {ateam.id})" in printed_query
        assert f"team_id, {another_ateam.id}" not in printed_query

    async def test_as_insert_into_s3_query_with_parameters(self, ateam, data_interval_start, data_interval_end):
        model = SessionsRecordBatchModel(
            team_id=ateam.id,
        )
        printed_query, _ = await model.as_insert_into_s3_query_with_parameters(
            data_interval_start=data_interval_start,
            data_interval_end=data_interval_end,
            s3_folder="https://test-bucket.s3.amazonaws.com/test-prefix",
            credentials=AWSKeyPair.unsafe_from_strings("test-key", "test-secret"),
            num_partitions=5,
        )

        assert "INSERT INTO FUNCTION" in printed_query
        # parition_id is a Datastore variable, so we need to escape it
        assert "https://test-bucket.s3.amazonaws.com/test-prefix/export_{{_partition_id}}.arrow" in printed_query
        assert "PARTITION BY rand() %% 5" in printed_query
        assert f"equals(raw_sessions.team_id, {ateam.id})" in printed_query
        assert (
            f"greaterOrEquals(_inserted_at, toDateTime64('{data_interval_start:%Y-%m-%d %H:%M:%S.%f}', 6, 'UTC')"
            in printed_query
        )
        assert f"less(_inserted_at, toDateTime64('{data_interval_end:%Y-%m-%d %H:%M:%S.%f}', 6, 'UTC')" in printed_query

        # check that we have a date range set on the inner query using the session ID
        assert (
            "lessOrEquals(fromUnixTimestamp(intDiv(toUInt64(bitShiftRight(raw_sessions.session_id_v7, 80)), 1000)), plus("
            in printed_query
        )
        assert (
            "greaterOrEquals(fromUnixTimestamp(intDiv(toUInt64(bitShiftRight(raw_sessions.session_id_v7, 80)), 1000)), minus("
            in printed_query
        )
        # the sessions query carries its settings on the AST, so the printer renders them
        assert "SETTINGS" in printed_query
        assert "optimize_aggregation_in_order=1" in printed_query
        # this model needs no request settings: the printer already emitted them
        assert model.get_datastore_request_settings() == {}

    async def test_as_insert_into_s3_query_with_parameters_keyless_auth(
        self, ateam, data_interval_start, data_interval_end
    ):
        """Test that keyless S3 auth generates the correct s3() function call without credentials."""
        model = SessionsRecordBatchModel(
            team_id=ateam.id,
        )
        printed_query, _ = await model.as_insert_into_s3_query_with_parameters(
            data_interval_start=data_interval_start,
            data_interval_end=data_interval_end,
            s3_folder="https://test-bucket.s3.amazonaws.com/test-prefix",
            credentials=None,
            num_partitions=5,
        )

        assert "INSERT INTO FUNCTION" in printed_query
        assert "https://test-bucket.s3.amazonaws.com/test-prefix/export_{{_partition_id}}.arrow" in printed_query
        # For keyless auth, the s3() call should only have 2 parameters (url, format), not 4
        assert (
            "s3('https://test-bucket.s3.amazonaws.com/test-prefix/export_{{_partition_id}}.arrow', 'ArrowStream')"
            in printed_query
        )
        assert "PARTITION BY rand() %% 5" in printed_query


class TestInsightsQLQueryRecordBatchModel:
    async def test_as_query_with_parameters(self, ateam, data_interval_start, data_interval_end):
        model = InsightsQLQueryRecordBatchModel(
            team_id=ateam.id, insightsql_query="SELECT event AS event, distinct_id AS distinct_id FROM events"
        )
        printed_query, query_parameters = await model.as_query_with_parameters(data_interval_start, data_interval_end)

        # should add filter on team_id
        assert f"equals(events.team_id, {ateam.id})" in printed_query
        assert "FORMAT ArrowStream" in printed_query
        assert "log_comment" in query_parameters

    async def test_as_insert_into_s3_query_with_parameters(self, ateam, data_interval_start, data_interval_end):
        model = InsightsQLQueryRecordBatchModel(
            team_id=ateam.id, insightsql_query="SELECT event AS event, distinct_id AS distinct_id FROM events"
        )
        printed_query, query_parameters = await model.as_insert_into_s3_query_with_parameters(
            data_interval_start=data_interval_start,
            data_interval_end=data_interval_end,
            s3_folder="https://test-bucket.s3.amazonaws.com/test-prefix",
            credentials=AWSKeyPair.unsafe_from_strings("test-key", "test-secret"),
            num_partitions=5,
        )

        assert "INSERT INTO FUNCTION" in printed_query
        assert "https://test-bucket.s3.amazonaws.com/test-prefix/export_{{_partition_id}}.arrow" in printed_query
        assert "PARTITION BY rand() %% 5" in printed_query
        assert f"equals(events.team_id, {ateam.id})" in printed_query
        # the user's query is wrapped as-is: settings are sent as query parameters, so we never write a
        # SETTINGS clause into the query
        assert "SETTINGS" not in printed_query

    async def test_get_datastore_request_settings(self):
        """Batch export settings are sent as query parameters rather than a SETTINGS clause.

        Values are rendered the way the InsightsQL printer renders them (bools as 1/0), so a
        setting reads the same in query_log however it was applied. Datastore rejects
        unknown setting names outright, so a typo here fails the export.
        """
        model = InsightsQLQueryRecordBatchModel(team_id=1, insightsql_query="SELECT event AS event FROM events")

        assert model.get_datastore_request_settings() == {
            "optimize_aggregation_in_order": "1",
            "max_bytes_before_external_sort": "50000000000",
            "max_bytes_before_external_group_by": "50000000000",
        }

    @pytest.mark.parametrize(
        "insightsql_query,expected_message",
        [
            ("SELECT event AS event FROM events WHERE {filters}", "Placeholders are not supported"),
            ("SELECT event AS event FROM events WHERE event = {placeholder_field}", "Placeholders are not supported"),
            ("SELECT event AS event FROM events WHERE event = {concat('a', 'b')}", "Placeholders are not supported"),
            ("not a valid query", "Failed to parse InsightsQL query"),
            ("DROP TABLE events", "Failed to parse InsightsQL query"),
        ],
        ids=["filters", "placeholder-field", "placeholder-expression", "invalid-syntax", "not-a-select"],
    )
    async def test_get_insightsql_query_raises_on_unsupported_query(
        self, insightsql_query, expected_message, data_interval_start, data_interval_end
    ):
        model = InsightsQLQueryRecordBatchModel(team_id=1, insightsql_query=insightsql_query)

        with pytest.raises(UnsupportedInsightsQLQueryError, match=expected_message):
            model.get_insightsql_query(data_interval_start, data_interval_end)

    async def test_resolve_batch_exports_model_returns_insightsql_model(self):
        batch_export_model = BatchExportModel(
            name="insightsql", schema=None, insightsql_query="SELECT event AS event FROM events"
        )

        _, record_batch_model, model_name, _, _, _ = resolve_batch_exports_model(
            team_id=1, batch_export_model=batch_export_model
        )

        assert isinstance(record_batch_model, InsightsQLQueryRecordBatchModel)
        assert model_name == "insightsql"
        assert record_batch_model.insightsql_query == batch_export_model.insightsql_query

    async def test_resolve_batch_exports_model_raises_without_insightsql_query(self):
        """Without this, a missing query would fall through to the events template path and export the wrong data."""
        with pytest.raises(UnsupportedInsightsQLQueryError):
            resolve_batch_exports_model(team_id=1, batch_export_model=BatchExportModel(name="insightsql", schema=None))
