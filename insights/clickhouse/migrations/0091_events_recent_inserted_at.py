from insights.clickhouse.client.migration_tools import run_sql_with_exceptions
from insights.models.event.sql import EVENTS_RECENT_DATA_TABLE, EVENTS_RECENT_TABLE_SQL
from insights.settings import CLICKHOUSE_CLUSTER

operations = [
    run_sql_with_exceptions(
        f"DROP TABLE IF EXISTS {EVENTS_RECENT_DATA_TABLE()} ON CLUSTER '{CLICKHOUSE_CLUSTER}' SYNC"
    ),
    run_sql_with_exceptions(EVENTS_RECENT_TABLE_SQL()),
]
