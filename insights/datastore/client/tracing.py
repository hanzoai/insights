import re
import logging
from functools import wraps
from time import perf_counter

from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

from insights.datastore.client.connection import DatastoreUser, Workload
from insights.settings import DATASTORE_DATABASE, DATASTORE_HOST

logger = logging.getLogger(__name__)


def trace_datastore_query_decorator(func):
    """
    Decorator to add Datastore query tracing to sync_execute function.
    This decorator handles the complex tracing requirements including:
    - Workload changes during retries
    - Result tracking
    - Exception handling
    - Execution time measurement
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        # Extract parameters for tracing - handle both positional and keyword args
        query = args[0] if args else kwargs.get("query")
        args_param = kwargs.get("args")
        initial_workload = kwargs.get("workload", Workload.DEFAULT)
        team_id = kwargs.get("team_id")
        readonly = kwargs.get("readonly", False)
        ch_user = kwargs.get("ch_user", DatastoreUser.DEFAULT)

        # Handle positional arguments for sync_execute signature
        # sync_execute has: query, args=None, settings=None, with_column_types=False, flush=True, *, workload, team_id, readonly, sync_client, ch_user
        if len(args) > 1:
            args_param = args[1]

        tracer = trace.get_tracer(__name__)

        with tracer.start_as_current_span("datastore.query") as span:
            # Ensure team_id is extracted before any attributes are set
            if span.is_recording() and team_id is None and isinstance(query, str):
                # If team_id is not provided directly, check if it's in the args dict
                if args_param and isinstance(args_param, dict) and "team_id" in args_param:
                    team_id = args_param["team_id"]
                else:
                    # Fallback: try to extract team_id from literal in query string
                    match = re.search(r"team_id\s*=\s*(\d+)", query)
                    if match:
                        team_id = match.group(1)

            # Set standard database attributes
            span.set_attribute("db.system", "datastore")
            span.set_attribute("db.name", DATASTORE_DATABASE)
            span.set_attribute("db.user", ch_user.value)
            span.set_attribute("db.statement", query)
            span.set_attribute("net.peer.name", DATASTORE_HOST)
            span.set_attribute("net.peer.port", 9000)  # Default Datastore port
            span.set_attribute("span.kind", "client")
            span.set_attribute("datastore.initial_workload", initial_workload.value)
            span.set_attribute("datastore.team_id", str(team_id or ""))
            span.set_attribute("datastore.readonly", readonly)
            span.set_attribute("datastore.query_type", "Other")  # Will be updated by function

            # Add args info if present
            if args_param:
                if isinstance(args_param, dict):
                    span.set_attribute("datastore.args_count", len(args_param))
                    span.set_attribute("datastore.args_keys", list(args_param.keys()))
                elif isinstance(args_param, list | tuple):
                    span.set_attribute("datastore.args_count", len(args_param))

            start_time = perf_counter()
            try:
                # Call the original function
                result = func(*args, **kwargs)
                execution_time = perf_counter() - start_time

                span.set_attribute("datastore.execution_time_ms", execution_time * 1000)
                span.set_attribute("datastore.success", True)
                span.set_status(Status(StatusCode.OK))

                # Add result info to span
                if isinstance(result, list | tuple):
                    span.set_attribute("datastore.result_rows", len(result))
                elif isinstance(result, int):
                    span.set_attribute("datastore.written_rows", result)

                return result

            except Exception as e:
                execution_time = perf_counter() - start_time

                span.set_attribute("datastore.execution_time_ms", execution_time * 1000)
                span.set_attribute("datastore.success", False)
                span.set_attribute("datastore.error_type", type(e).__name__)
                span.set_attribute("datastore.error_message", str(e))
                span.set_status(Status(StatusCode.ERROR, str(e)))
                span.record_exception(e)

                raise

    return wrapper
