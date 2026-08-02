from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.datastore.query_log_archive import DAILY_AGGREGATED_QUERY_LOG_ARCHIVE_VIEW

operations = [
    run_sql_with_exceptions(
        f"DROP VIEW IF EXISTS {DAILY_AGGREGATED_QUERY_LOG_ARCHIVE_VIEW} SYNC",
        node_roles=[NodeRole.OPS],
    ),
]
