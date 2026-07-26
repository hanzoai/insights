from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.raw_sessions.sessions_v3 import DROP_RAW_SESSION_MATERIALIZED_VIEW_RECORDINGS_SQL_V3

operations = [
    run_sql_with_exceptions(DROP_RAW_SESSION_MATERIALIZED_VIEW_RECORDINGS_SQL_V3(), node_roles=[NodeRole.DATA]),
]
