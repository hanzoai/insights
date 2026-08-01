from infi.datastore_orm import migrations

from insights.datastore.client import sync_execute
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.event.sql import EVENTS_TABLE_JSON_MV_SQL, KAFKA_EVENTS_TABLE_JSON_SQL
from insights.settings import DATASTORE_CLUSTER

ADD_COLUMNS_BASE_SQL = """
ALTER TABLE {table}
ON CLUSTER '{cluster}'
ADD COLUMN IF NOT EXISTS inserted_at Nullable(DateTime64(6, 'UTC')) DEFAULT NULL
"""


def add_columns_to_required_tables(_):
    sync_execute(ADD_COLUMNS_BASE_SQL.format(table="events", cluster=DATASTORE_CLUSTER))
    sync_execute(ADD_COLUMNS_BASE_SQL.format(table="writable_events", cluster=DATASTORE_CLUSTER))
    sync_execute(ADD_COLUMNS_BASE_SQL.format(table="sharded_events", cluster=DATASTORE_CLUSTER))


operations = [
    run_sql_with_exceptions(f"DROP TABLE IF EXISTS events_json_mv ON CLUSTER '{DATASTORE_CLUSTER}'"),
    run_sql_with_exceptions(f"DROP TABLE IF EXISTS kafka_events_json ON CLUSTER '{DATASTORE_CLUSTER}'"),
    migrations.RunPython(add_columns_to_required_tables),
    run_sql_with_exceptions(KAFKA_EVENTS_TABLE_JSON_SQL()),
    run_sql_with_exceptions(EVENTS_TABLE_JSON_MV_SQL()),
]
