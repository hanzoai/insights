import pytest
from unittest.mock import MagicMock, Mock, patch

from datastore_driver.errors import ServerException
from opentelemetry.trace import Status, StatusCode

from insights.datastore.client.connection import DatastoreUser, Workload
from insights.datastore.client.tracing import trace_datastore_query_decorator
from insights.settings import DATASTORE_DATABASE, DATASTORE_HOST


class TestTraceDatastoreQueryDecorator:
    """Test the trace_datastore_query_decorator decorator"""

    def test_decorator_success(self):
        """Test decorator with successful function execution"""

        @trace_datastore_query_decorator
        def test_function(
            query, args=None, workload=Workload.DEFAULT, team_id=None, readonly=False, ch_user=DatastoreUser.DEFAULT
        ):
            return [{"result": "success"}]

        with patch("insights.datastore.client.tracing.trace") as mock_trace:
            mock_span = Mock()
            mock_span.is_recording.return_value = True

            mock_context = MagicMock()
            mock_context.__enter__.return_value = mock_span
            mock_context.__exit__.return_value = None

            mock_tracer = Mock()
            mock_tracer.start_as_current_span.return_value = mock_context
            mock_trace.get_tracer.return_value = mock_tracer

            result = test_function(
                "SELECT 1",
                {"param": "value"},
                workload=Workload.ONLINE,
                team_id=123,
                readonly=True,
                ch_user=DatastoreUser.APP,
            )

            # Verify result
            assert result == [{"result": "success"}]

            # Verify span attributes were set correctly
            mock_span.set_attribute.assert_any_call("db.system", "datastore")
            mock_span.set_attribute.assert_any_call("db.name", DATASTORE_DATABASE)
            mock_span.set_attribute.assert_any_call("db.user", DatastoreUser.APP.value)
            mock_span.set_attribute.assert_any_call("db.statement", "SELECT 1")
            mock_span.set_attribute.assert_any_call("net.peer.name", DATASTORE_HOST)
            mock_span.set_attribute.assert_any_call("net.peer.port", 9000)
            mock_span.set_attribute.assert_any_call("span.kind", "client")
            mock_span.set_attribute.assert_any_call("datastore.initial_workload", Workload.ONLINE.value)
            mock_span.set_attribute.assert_any_call("datastore.team_id", "123")
            mock_span.set_attribute.assert_any_call("datastore.readonly", True)
            mock_span.set_attribute.assert_any_call("datastore.query_type", "Other")
            mock_span.set_attribute.assert_any_call("datastore.args_count", 1)
            mock_span.set_attribute.assert_any_call("datastore.args_keys", ["param"])
            mock_span.set_attribute.assert_any_call("datastore.result_rows", 1)
            mock_span.set_attribute.assert_any_call("datastore.success", True)

            # Verify success status
            status_call = mock_span.set_status.call_args[0][0]
            assert isinstance(status_call, Status)
            assert status_call.status_code == StatusCode.OK

    def test_decorator_with_list_args(self):
        """Test decorator with list/tuple arguments"""

        @trace_datastore_query_decorator
        def test_function(
            query, args=None, workload=Workload.DEFAULT, team_id=None, readonly=False, ch_user=DatastoreUser.DEFAULT
        ):
            return 5  # Simulate written rows

        with patch("insights.datastore.client.tracing.trace") as mock_trace:
            mock_span = Mock()
            mock_span.is_recording.return_value = True

            mock_context = MagicMock()
            mock_context.__enter__.return_value = mock_span
            mock_context.__exit__.return_value = None

            mock_tracer = Mock()
            mock_tracer.start_as_current_span.return_value = mock_context
            mock_trace.get_tracer.return_value = mock_tracer

            result = test_function("INSERT INTO table VALUES", [1, 2, 3])

            # Verify result
            assert result == 5

            # Verify args_count is set for list args
            mock_span.set_attribute.assert_any_call("datastore.args_count", 3)
            mock_span.set_attribute.assert_any_call("datastore.written_rows", 5)

    def test_decorator_with_no_args(self):
        """Test decorator with no arguments"""

        @trace_datastore_query_decorator
        def test_function(
            query, args=None, workload=Workload.DEFAULT, team_id=None, readonly=False, ch_user=DatastoreUser.DEFAULT
        ):
            return []

        with patch("insights.datastore.client.tracing.trace") as mock_trace:
            mock_span = Mock()
            mock_span.is_recording.return_value = True

            mock_context = MagicMock()
            mock_context.__enter__.return_value = mock_span
            mock_context.__exit__.return_value = None

            mock_tracer = Mock()
            mock_tracer.start_as_current_span.return_value = mock_context
            mock_trace.get_tracer.return_value = mock_tracer

            result = test_function("SELECT 1")

            # Verify result
            assert result == []

            # Verify no args-related attributes are set
            args_calls = [call for call in mock_span.set_attribute.call_args_list if "args" in str(call)]
            assert len(args_calls) == 0

    def test_decorator_error_handling(self):
        """Test decorator when function raises an exception"""

        @trace_datastore_query_decorator
        def test_function(
            query, args=None, workload=Workload.DEFAULT, team_id=None, readonly=False, ch_user=DatastoreUser.DEFAULT
        ):
            raise ServerException("Test error", code=500)

        with patch("insights.datastore.client.tracing.trace") as mock_trace:
            mock_span = Mock()
            mock_span.is_recording.return_value = True

            mock_context = MagicMock()
            mock_context.__enter__.return_value = mock_span
            mock_context.__exit__.return_value = None

            mock_tracer = Mock()
            mock_tracer.start_as_current_span.return_value = mock_context
            mock_trace.get_tracer.return_value = mock_tracer

            with pytest.raises(ServerException):
                test_function("SELECT 1")

            # Verify error attributes were set
            mock_span.set_attribute.assert_any_call("datastore.success", False)
            mock_span.set_attribute.assert_any_call("datastore.error_type", "ServerException")

            # Check error message
            found = False
            for call in mock_span.set_attribute.call_args_list:
                if call[0][0] == "datastore.error_message":
                    found = True
                    assert "Test error" in call[0][1]
                    break
            assert found, "datastore.error_message not set"

            # Check StatusCode.ERROR
            status_call = mock_span.set_status.call_args[0][0]
            assert isinstance(status_call, Status)
            assert status_call.status_code == StatusCode.ERROR
            mock_span.record_exception.assert_called_once()

    def test_decorator_default_values(self):
        """Test decorator with default parameter values"""

        @trace_datastore_query_decorator
        def test_function(
            query, args=None, workload=Workload.DEFAULT, team_id=None, readonly=False, ch_user=DatastoreUser.DEFAULT
        ):
            return []

        with patch("insights.datastore.client.tracing.trace") as mock_trace:
            mock_span = Mock()
            mock_span.is_recording.return_value = True

            mock_context = MagicMock()
            mock_context.__enter__.return_value = mock_span
            mock_context.__exit__.return_value = None

            mock_tracer = Mock()
            mock_tracer.start_as_current_span.return_value = mock_context
            mock_trace.get_tracer.return_value = mock_tracer

            test_function("SELECT 1")

            # Verify default values are used
            mock_span.set_attribute.assert_any_call("datastore.initial_workload", Workload.DEFAULT.value)
            mock_span.set_attribute.assert_any_call("datastore.readonly", False)
            mock_span.set_attribute.assert_any_call("datastore.query_type", "Other")
            mock_span.set_attribute.assert_any_call("db.user", DatastoreUser.DEFAULT.value)
            mock_span.set_attribute.assert_any_call("datastore.team_id", "")

    def test_decorator_execution_time(self):
        """Test that execution time is recorded"""

        @trace_datastore_query_decorator
        def test_function(
            query, args=None, workload=Workload.DEFAULT, team_id=None, readonly=False, ch_user=DatastoreUser.DEFAULT
        ):
            return []

        with patch("insights.datastore.client.tracing.trace") as mock_trace:
            mock_span = Mock()
            mock_span.is_recording.return_value = True

            mock_context = MagicMock()
            mock_context.__enter__.return_value = mock_span
            mock_context.__exit__.return_value = None

            mock_tracer = Mock()
            mock_tracer.start_as_current_span.return_value = mock_context
            mock_trace.get_tracer.return_value = mock_tracer

            test_function("SELECT 1")

            # Verify execution time was recorded
            execution_time_calls = [
                call for call in mock_span.set_attribute.call_args_list if "execution_time_ms" in str(call)
            ]
            assert len(execution_time_calls) == 1

    def test_decorator_span_not_recording(self):
        """Test behavior when span is not recording"""

        @trace_datastore_query_decorator
        def test_function(
            query, args=None, workload=Workload.DEFAULT, team_id=None, readonly=False, ch_user=DatastoreUser.DEFAULT
        ):
            return []

        with patch("insights.datastore.client.tracing.trace") as mock_trace:
            mock_span = Mock()
            mock_span.is_recording.return_value = False

            mock_context = MagicMock()
            mock_context.__enter__.return_value = mock_span
            mock_context.__exit__.return_value = None

            mock_tracer = Mock()
            mock_tracer.start_as_current_span.return_value = mock_context
            mock_trace.get_tracer.return_value = mock_tracer

            result = test_function("SELECT 1")

            # Verify result is returned
            assert result == []

            # When span is not recording, OpenTelemetry functions are no-ops
            # but we still call them, so the mock will record the calls
            # This is expected behavior since OpenTelemetry handles the no-op internally

    def test_decorator_team_id_literal_in_query(self):
        """Test decorator extracts team_id from a literal in the query string"""

        @trace_datastore_query_decorator
        def test_function(
            query, args=None, workload=Workload.DEFAULT, team_id=None, readonly=False, ch_user=DatastoreUser.DEFAULT
        ):
            return [1]

        with patch("insights.datastore.client.tracing.trace") as mock_trace:
            mock_span = Mock()
            mock_span.is_recording.return_value = True
            mock_context = MagicMock()
            mock_context.__enter__.return_value = mock_span
            mock_context.__exit__.return_value = None
            mock_tracer = Mock()
            mock_tracer.start_as_current_span.return_value = mock_context
            mock_trace.get_tracer.return_value = mock_tracer

            test_function("SELECT * FROM table WHERE team_id = 42 AND x = 1")
            mock_span.set_attribute.assert_any_call("datastore.team_id", "42")

    def test_decorator_team_id_param_in_query_and_args(self):
        """Test decorator extracts team_id from parameterized query and args dict"""

        @trace_datastore_query_decorator
        def test_function(
            query, args=None, workload=Workload.DEFAULT, team_id=None, readonly=False, ch_user=DatastoreUser.DEFAULT
        ):
            return [1]

        with patch("insights.datastore.client.tracing.trace") as mock_trace:
            mock_span = Mock()
            mock_span.is_recording.return_value = True
            mock_context = MagicMock()
            mock_context.__enter__.return_value = mock_span
            mock_context.__exit__.return_value = None
            mock_tracer = Mock()
            mock_tracer.start_as_current_span.return_value = mock_context
            mock_trace.get_tracer.return_value = mock_tracer

            test_function("SELECT * FROM table WHERE team_id = %(team_id)s AND x = 1", {"team_id": 123, "x": 2})
            mock_span.set_attribute.assert_any_call("datastore.team_id", "123")

    def test_decorator_team_id_not_present(self):
        """Test decorator sets team_id to empty string if not present anywhere"""

        @trace_datastore_query_decorator
        def test_function(
            query, args=None, workload=Workload.DEFAULT, team_id=None, readonly=False, ch_user=DatastoreUser.DEFAULT
        ):
            return [1]

        with patch("insights.datastore.client.tracing.trace") as mock_trace:
            mock_span = Mock()
            mock_span.is_recording.return_value = True
            mock_context = MagicMock()
            mock_context.__enter__.return_value = mock_span
            mock_context.__exit__.return_value = None
            mock_tracer = Mock()
            mock_tracer.start_as_current_span.return_value = mock_context
            mock_trace.get_tracer.return_value = mock_tracer

            test_function("SELECT * FROM table WHERE x = 1", {"x": 2})
            mock_span.set_attribute.assert_any_call("datastore.team_id", "")
