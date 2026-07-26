from insights.datastore.cluster import ON_CLUSTER_CLAUSE
from insights.settings.data_stores import DATASTORE_CLUSTER

# Deliberately using skip_unavailable_shards, as the things that use this table are usually not 100% critical, and can have bad knock-on effects if they keep waiting for shards.


def DISTRIBUTED_SYSTEM_PROCESSES_TABLE_SQL(on_cluster=True):
    on_cluster_clause = ON_CLUSTER_CLAUSE(on_cluster)
    return f"""
        CREATE TABLE IF NOT EXISTS distributed_system_processes {on_cluster_clause}
        ENGINE = Distributed({DATASTORE_CLUSTER}, system, processes)
        SETTINGS skip_unavailable_shards=1
    """
