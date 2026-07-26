from insights.datastore.client.migration_tools import NodeRole, run_sql_with_exceptions
from insights.datastore.distributed_system_processes import DISTRIBUTED_SYSTEM_PROCESSES_TABLE_SQL

operations = [
    run_sql_with_exceptions(
        DISTRIBUTED_SYSTEM_PROCESSES_TABLE_SQL(on_cluster=False),
        node_roles=[NodeRole.DATA, NodeRole.COORDINATOR],
    ),
]
