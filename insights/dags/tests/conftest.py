# explicit fixture import is needed as autodiscovery doesn't work due to package layout
from insights.conftest import django_db_setup

__all__ = ["django_db_setup"]

from collections.abc import Iterator

import pytest
from insights.test.base import reset_datastore_database
from unittest.mock import patch

from insights.datastore.cluster import DatastoreCluster, get_cluster


def _patched_get_cluster_hosts(self, client, cluster, retry_policy=None):
    """
    Patch for local macOS Docker testing: use host_name instead of host_address.

    On macOS with Docker Desktop, system.clusters returns Docker-internal IPs
    (192.168.x.x) which aren't routable from the host. Using host_name returns
    "datastore" which resolves via /etc/hosts (set up by flox) to 127.0.0.1.
    """
    return client.execute(
        """
        SELECT host_name, port, shard_num, replica_num, getMacro('hostClusterType') as host_cluster_type, getMacro('hostClusterRole') as host_cluster_role
        FROM clusterAllReplicas(%(name)s, system.clusters)
        WHERE name = %(name)s and is_local
        ORDER BY shard_num, replica_num
        """,
        {"name": cluster},
    )


@pytest.fixture
def cluster(django_db_setup) -> Iterator[DatastoreCluster]:
    """
    Cluster fixture with macOS Docker-compatible hostname resolution.
    Patches DatastoreCluster to use host_name instead of host_address.
    """
    reset_datastore_database()
    try:
        with patch.object(
            DatastoreCluster,
            "_DatastoreCluster__get_cluster_hosts",
            _patched_get_cluster_hosts,
        ):
            yield get_cluster()
    finally:
        reset_datastore_database()
