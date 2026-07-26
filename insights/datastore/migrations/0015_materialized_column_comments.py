from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.settings import DATASTORE_CLUSTER

already_materialized_columns = [
    ("properties_issampledevent", "isSampledEvent"),
    ("properties_currentscreen", "currentScreen"),
    ("properties_objectname", "objectName"),
]

operations = []

for column_name, property in already_materialized_columns:
    statement = f"ALTER TABLE events ON CLUSTER '{DATASTORE_CLUSTER}' COMMENT COLUMN IF EXISTS {column_name} 'column_materializer::{property}'"
    operations.append(run_sql_with_exceptions(statement))
