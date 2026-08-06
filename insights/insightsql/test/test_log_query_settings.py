import pytest
from insights.test.base import APIBaseTest, DatastoreTestMixin
from unittest import TestCase

from datastore_driver.errors import ServerException
from parameterized import parameterized

from insights.insightsql.constants import InsightsQLGlobalSettings
from insights.insightsql.errors import QueryError
from insights.insightsql.query import InsightsQLQueryExecutor

from insights.errors import (
    CH_TRANSIENT_ERRORS,
    CHQueryErrorCorruptedParquetMetadata,
    CHQueryErrorTableIsReadOnly,
    CHQueryErrorTooManyBytes,
    ExposedCHQueryError,
    InternalCHQueryError,
    QueryErrorCategory,
    classify_query_error,
    wrap_datastore_query_error,
)


class TestLogQuerySettings(DatastoreTestMixin, APIBaseTest):
    """Tests that user InsightsQL queries on log tables get max_bytes_to_read settings applied."""

    def _get_datastore_sql_for(self, query: str, query_type: str = "InsightsQLQuery") -> str:
        executor = InsightsQLQueryExecutor(
            query=query,
            team=self.team,
            query_type=query_type,
        )
        sql, _context = executor.generate_datastore_sql()
        return sql

    # --- User InsightsQL queries on log tables ---
    def test_user_query_on_logs_table_has_max_bytes_to_read(self):
        sql = self._get_datastore_sql_for("SELECT * FROM logs LIMIT 10")
        assert f"max_bytes_to_read=" in sql.replace(" ", "")

    def test_user_query_on_logs_table_has_throw_overflow_mode(self):
        sql = self._get_datastore_sql_for("SELECT * FROM logs LIMIT 10")
        assert "read_overflow_mode" in sql
        assert "throw" in sql

    def test_user_query_on_log_attributes_table_has_max_bytes_to_read(self):
        sql = self._get_datastore_sql_for("SELECT * FROM log_attributes LIMIT 10")
        assert f"max_bytes_to_read=" in sql.replace(" ", "")

    def test_user_query_on_logs_kafka_metrics_table_has_max_bytes_to_read(self):
        sql = self._get_datastore_sql_for("SELECT * FROM logs_kafka_metrics LIMIT 10")
        assert f"max_bytes_to_read=" in sql.replace(" ", "")

    # --- Non-log user queries should NOT have log settings ---
    def test_user_query_on_events_table_has_no_max_bytes_to_read(self):
        sql = self._get_datastore_sql_for("SELECT * FROM events LIMIT 10")
        assert "max_bytes_to_read" not in sql

    def test_user_query_on_persons_table_has_no_max_bytes_to_read(self):
        sql = self._get_datastore_sql_for("SELECT * FROM persons LIMIT 10")
        assert "max_bytes_to_read" not in sql

    def test_user_query_on_sessions_table_has_no_max_bytes_to_read(self):
        sql = self._get_datastore_sql_for("SELECT * FROM sessions LIMIT 10")
        assert "max_bytes_to_read" not in sql

    # --- Internal query runners should NOT get log settings ---
    def test_internal_logs_query_type_has_no_max_bytes_to_read(self):
        sql = self._get_datastore_sql_for(
            "SELECT * FROM logs LIMIT 10",
            query_type="LogsQuery",
        )
        assert "max_bytes_to_read" not in sql

    def test_internal_has_logs_query_type_has_no_max_bytes_to_read(self):
        sql = self._get_datastore_sql_for(
            "SELECT * FROM logs LIMIT 10",
            query_type="HasLogsQuery",
        )
        assert "max_bytes_to_read" not in sql

    def test_user_query_on_logs_applies_settings_even_with_custom_settings(self):
        executor = InsightsQLQueryExecutor(
            query="SELECT * FROM logs LIMIT 10",
            team=self.team,
            query_type="InsightsQLQuery",
            settings=InsightsQLGlobalSettings(max_execution_time=30),
        )
        sql, _context = executor.generate_datastore_sql()
        assert f"max_bytes_to_read=" in sql.replace(" ", "")
        # The user's other settings should still be preserved
        assert "max_execution_time" in sql

    def test_mixed_events_and_logs_join_raises_workload_error(self):
        with pytest.raises(QueryError):
            self._get_datastore_sql_for("SELECT * FROM events e JOIN logs l ON e.uuid = l.uuid LIMIT 10")


class TestTooManyBytesError(DatastoreTestMixin, APIBaseTest):
    """Tests that TOO_MANY_BYTES error is exposed to users."""

    def test_wrap_datastore_query_error_returns_exposed_error_for_too_many_bytes(self):
        server_error = ServerException(
            "DB::Exception: Limit for result exceeded, max bytes: 5000000000. Stack trace: ...",
            code=307,
        )
        wrapped = wrap_datastore_query_error(server_error)
        assert isinstance(wrapped, CHQueryErrorTooManyBytes)
        assert isinstance(wrapped, ExposedCHQueryError)

    def test_wrap_datastore_query_error_too_many_bytes_has_friendly_message(self):
        server_error = ServerException(
            "DB::Exception: Limit for result exceeded, max bytes: 5000000000. Stack trace: ...",
            code=307,
        )
        wrapped = wrap_datastore_query_error(server_error)
        message = str(wrapped)
        # Should NOT contain raw Datastore internals
        assert "DB::Exception" not in message
        assert "Stack trace" not in message

        assert "limit for result exceeded" in message.lower()

    def test_wrap_datastore_query_error_too_many_bytes_has_code_name(self):
        server_error = ServerException(
            "DB::Exception: Limit for result exceeded, max bytes: 5000000000.",
            code=307,
        )
        wrapped = wrap_datastore_query_error(server_error)
        assert getattr(wrapped, "code_name", None) == "too_many_bytes"

    def test_wrap_datastore_query_error_read_only_is_stable_and_transient(self):
        # Code 242 (TABLE_IS_READ_ONLY) is a self-healing replica error; it must map to the
        # importable class that lives in CH_TRANSIENT_ERRORS so tasks can retry it, rather than
        # falling back to a dynamically generated class that no autoretry tuple references.
        server_error = ServerException("DB::Exception: Table is in readonly mode.", code=242)
        wrapped = wrap_datastore_query_error(server_error)
        assert isinstance(wrapped, CHQueryErrorTableIsReadOnly)
        assert isinstance(wrapped, CH_TRANSIENT_ERRORS)


class TestCorruptedParquetMetadataError(TestCase):
    """A Parquet file with oversized/corrupted thrift metadata surfaces as a raw STD_EXCEPTION
    (code 1001). It must be translated into a friendly, exposed error instead of leaking the raw
    Datastore message into the SQL editor."""

    THRIFT_MESSAGE = (
        "DB::Exception: parquet::ParquetException: Couldn't deserialize thrift: "
        "TProtocolException: Exceeded size limit. Stack trace: ..."
    )

    def test_thrift_deserialization_error_is_exposed_and_friendly(self) -> None:
        wrapped = wrap_datastore_query_error(ServerException(self.THRIFT_MESSAGE, code=1001))
        assert isinstance(wrapped, CHQueryErrorCorruptedParquetMetadata)
        assert isinstance(wrapped, ExposedCHQueryError)
        message = str(wrapped)
        assert "DB::Exception" not in message
        assert "thrift" not in message.lower()
        assert "corrupted or oversized metadata" in message

    def test_unrelated_std_exception_stays_internal(self) -> None:
        # The translation must be narrow: a generic STD_EXCEPTION should not be exposed to users.
        wrapped = wrap_datastore_query_error(ServerException("DB::Exception: something else.", code=1001))
        assert not isinstance(wrapped, CHQueryErrorCorruptedParquetMetadata)
        assert isinstance(wrapped, InternalCHQueryError)


class TestArgumentCountErrorsAreUserFacing(TestCase):
    """Wrong-function-arg-count errors are user query mistakes, not internal bugs, so they must
    surface as exposed 4xx errors and be classified USER_ERROR rather than captured as internals."""

    @parameterized.expand(
        [
            (34, "TOO_MANY_ARGUMENTS_FOR_FUNCTION"),
            (35, "TOO_FEW_ARGUMENTS_FOR_FUNCTION"),
            (42, "NUMBER_OF_ARGUMENTS_DOESNT_MATCH"),
        ]
    )
    def test_argument_count_error_is_exposed_and_user_error(self, code: int, name: str) -> None:
        server_error = ServerException(f"DB::Exception: Function minus {name.lower()}.", code=code)
        wrapped = wrap_datastore_query_error(server_error)
        assert isinstance(wrapped, ExposedCHQueryError)
        assert classify_query_error(wrapped) == QueryErrorCategory.USER_ERROR
