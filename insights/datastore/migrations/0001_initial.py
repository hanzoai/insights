from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.event.sql import EVENTS_TABLE_SQL
from insights.settings import DATASTORE_CLUSTER, DATASTORE_DATABASE

operations = [
    run_sql_with_exceptions(f"CREATE DATABASE IF NOT EXISTS {DATASTORE_DATABASE} ON CLUSTER '{DATASTORE_CLUSTER}'"),
    run_sql_with_exceptions(EVENTS_TABLE_SQL()),
]
