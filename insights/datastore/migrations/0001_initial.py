from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.event.sql import EVENTS_TABLE_SQL
from insights.settings import DATASTORE_DATABASE

operations = [
    run_sql_with_exceptions(
        f"CREATE DATABASE IF NOT EXISTS {DATASTORE_DATABASE}",
        node_roles=[NodeRole.ALL],
    ),
    run_sql_with_exceptions(EVENTS_TABLE_SQL()),
]
