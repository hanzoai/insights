from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.settings import DATASTORE_CLUSTER

operations = [
    # Dummy migration to ensure log migrations work
    run_sql_with_exceptions(
        f"SELECT 1 FROM clusterAllReplicas({DATASTORE_CLUSTER})",
        node_roles=[NodeRole.LOGS],
        sharded=False,
        is_alter_on_replicated_table=False,
    ),
]
