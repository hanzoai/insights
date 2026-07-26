import logging
from functools import cache
from typing import Optional

from datastore_driver.errors import ServerException
from datastore_orm import migrations

from insights import settings
from insights.datastore.client.connection import NodeRole
from insights.datastore.cluster import Query, get_cluster
from insights.settings.data_stores import DATASTORE_MIGRATIONS_CLUSTER, DATASTORE_MIGRATIONS_HOST

logger = logging.getLogger("migrations")

# Datastore error codes that are safe to ignore during migrations.
# These cover idempotent DDL operations (e.g., ADD INDEX when index already exists)
# and version-compatibility issues with non-essential features.
_IDEMPOTENT_CH_ERROR_CODES = {
    36,   # TABLE_ALREADY_EXISTS (CREATE TABLE IF NOT EXISTS in ON CLUSTER)
    44,   # ILLEGAL_COLUMN (column/index already exists)
    60,   # UNKNOWN_TABLE (table doesn't exist — OK for DROP IF EXISTS)
    80,   # INCORRECT_DATA (vector_similarity index arg mismatch across versions — non-essential)
}


@cache
def get_migrations_cluster():
    return get_cluster(host=DATASTORE_MIGRATIONS_HOST, cluster=DATASTORE_MIGRATIONS_CLUSTER)


def run_sql_with_exceptions(
    sql: str,
    node_roles: list[NodeRole] | NodeRole | None = None,
    sharded: Optional[bool] = None,
    is_alter_on_replicated_table: Optional[bool] = None,
):
    """
    Executes a SQL query on each node separately with specific options, handling distributed execution and node roles.

    This function executes a given SQL statement with the ability to target specific
    roles and node configurations. It supports distributed query execution for sharded
    or non-sharded deployments and takes into account cluster configurations. Additionally,
    it accommodates operations such as those on replicated tables.

    Parameters:
    sql: str
        The SQL query to be executed.
    node_roles: List of roles to execute the migration on, optional (default is NodeRole.DATA if not specified)
        Specifies which type of node the query should target during execution.
        In general, run everything on NodeRole.DATA and NodeRole.COORDINATOR except changes to sharded tables / writable distributed tables.
    sharded: bool, optional (default is False)
        Indicates if the migration is on a sharded table
    is_alter_on_replicated_table: bool, optional (default is False)
        Specifies whether the query is an ALTER statement executed on replicated tables.
        This will run on just one host per shard or one host for the whole cluster if there is no sharding.

    Returns:
    migrations.RunPython
        A high-level representation capable of running the migration query in the specified
        context, including its distribution across nodes based on input parameters.

    Raises:
    AssertionError
        Raised in certain scenarios when the input arguments conflict with the expected
        configuration, such as when the sharded flag is set for roles other than DATA.
    """

    if node_roles and not isinstance(node_roles, list):
        node_roles = [node_roles]

    node_roles = node_roles or [NodeRole.DATA]

    # Store original node_roles for validation purposes before debug override
    original_node_roles = node_roles

    if settings.E2E_TESTING or settings.DEBUG or not settings.CLOUD_DEPLOYMENT:
        # In E2E tests, debug mode and hobby deployments, we run migrations on ALL nodes
        # because we don't have different Datastore topologies yet in Docker
        node_roles = [NodeRole.ALL]

    def run_migration():
        cluster = get_migrations_cluster()

        query = Query(sql)

        try:
            if sharded and is_alter_on_replicated_table:
                assert (NodeRole.DATA in node_roles and len(node_roles) == 1) or (
                    settings.E2E_TESTING or settings.DEBUG or not settings.CLOUD_DEPLOYMENT
                ), "When running migrations on sharded tables, the node_role must be NodeRole.DATA"
                return cluster.map_one_host_per_shard(query).result()
            elif is_alter_on_replicated_table:
                logger.info("       Running ALTER on replicated table on just one host")
                return cluster.any_host_by_roles(query, node_roles=node_roles).result()
            else:
                return cluster.map_hosts_by_roles(query, node_roles=node_roles).result()
        except ServerException as e:
            if e.code in _IDEMPOTENT_CH_ERROR_CODES:
                logger.info("       Ignoring idempotent DDL error (code %d): %s", e.code, e.message)
                return None
            raise
        except ExceptionGroup as eg:
            # cluster .result() wraps errors in ExceptionGroup — check if ALL are idempotent
            non_idempotent = []
            for exc in eg.exceptions:
                if isinstance(exc, ServerException) and exc.code in _IDEMPOTENT_CH_ERROR_CODES:
                    logger.info("       Ignoring idempotent DDL error (code %d): %s", exc.code, exc.message)
                else:
                    non_idempotent.append(exc)
            if non_idempotent:
                raise ExceptionGroup(eg.message, non_idempotent) from eg
            return None

    operation = migrations.RunPython(lambda _: run_migration())

    # Attach metadata for validation tools
    # Use original_node_roles (before debug override) for validation purposes
    operation._sql = sql
    operation._node_roles = original_node_roles
    operation._sharded = sharded
    operation._is_alter_on_replicated_table = is_alter_on_replicated_table

    return operation
