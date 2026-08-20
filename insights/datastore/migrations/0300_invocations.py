from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.invocations.sql import (
    DISTRIBUTED_FN_INVOCATION_RESULTS_TABLE_SQL,
    INSIGHTS_INVOCATION_RESULTS_DATA_TABLE_SQL,
    INSIGHTS_INVOCATION_RESULTS_MV_SQL,
    KAFKA_FN_INVOCATION_RESULTS_TABLE_SQL,
)

# The invocation-results family loses the mascot from its physical names:
# `hog_invocation_results*` becomes `invocations*`. The rows are function
# invocations, so the table now says so.
#
# Dropped and recreated rather than renamed. The family carries no rows to
# preserve — the whole point of a rename-in-place — and a drop keeps each
# object's definition in one place: 0261 and 0265 build the new names straight
# from `insights.models.invocations.sql`, so a database built from scratch
# never sees the old ones and this migration finds nothing to drop.
#
# Order is the write path in reverse: the MV reads the Kafka table, so it goes
# first; the data table is last because the MV writes into it.
#
# The legacy names are spelled out here rather than imported. A migration is a
# historical fact — the constants have moved on, and pointing this at them
# would make it drop whatever they name next. This file is the reason
# `hog_invocation_results` is allowlisted in bin/debrand: the one place a
# retired name still has to be sayable is the migration that retires it.
LEGACY_TABLE = "hog_invocation_results"
LEGACY_DATA_TABLE = f"{LEGACY_TABLE}_data"
LEGACY_KAFKA_TABLE = f"kafka_{LEGACY_TABLE}"
LEGACY_MV_TABLE = f"{LEGACY_TABLE}_mv"

operations = [
    # ---------- Retire the old family ----------
    run_sql_with_exceptions(f"DROP TABLE IF EXISTS {LEGACY_MV_TABLE}", node_roles=[NodeRole.AUX]),
    run_sql_with_exceptions(f"DROP TABLE IF EXISTS {LEGACY_KAFKA_TABLE}", node_roles=[NodeRole.AUX]),
    run_sql_with_exceptions(f"DROP TABLE IF EXISTS {LEGACY_TABLE}", node_roles=[NodeRole.AUX, NodeRole.DATA]),
    # SYNC so the replica is gone from ZooKeeper before this migration reports
    # done — the new data table takes a different znode, but a half-dropped
    # replica would leave the old name behind in `system.zookeeper`.
    run_sql_with_exceptions(f"DROP TABLE IF EXISTS {LEGACY_DATA_TABLE} SYNC", node_roles=[NodeRole.AUX]),
    # ---------- Build it back under the name it should have had ----------
    run_sql_with_exceptions(INSIGHTS_INVOCATION_RESULTS_DATA_TABLE_SQL(), node_roles=[NodeRole.AUX]),
    run_sql_with_exceptions(KAFKA_FN_INVOCATION_RESULTS_TABLE_SQL(), node_roles=[NodeRole.AUX]),
    run_sql_with_exceptions(INSIGHTS_INVOCATION_RESULTS_MV_SQL(), node_roles=[NodeRole.AUX]),
    run_sql_with_exceptions(
        DISTRIBUTED_FN_INVOCATION_RESULTS_TABLE_SQL(),
        node_roles=[NodeRole.AUX, NodeRole.DATA],
    ),
]
