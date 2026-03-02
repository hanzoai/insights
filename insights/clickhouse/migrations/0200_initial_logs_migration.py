from insights.clickhouse.client.connection import NodeRole
from insights.clickhouse.client.migration_tools import run_sql_with_exceptions
from insights.settings import CLICKHOUSE_CLUSTER

operations = [
    # Dummy migration to ensure log migrations work
    run_sql_with_exceptions(
        f"SELECT 1 FROM clusterAllReplicas({CLICKHOUSE_CLUSTER})",
        node_roles=[NodeRole.LOGS],
        sharded=False,
        is_alter_on_replicated_table=False,
    ),
]
