from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.settings import DATASTORE_CLUSTER

operations = [
    run_sql_with_exceptions(
        f"ALTER TABLE sharded_events ON CLUSTER '{DATASTORE_CLUSTER}' MODIFY COLUMN properties VARCHAR CODEC(ZSTD(3))"
    )
]
