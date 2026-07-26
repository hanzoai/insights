"""Show the unified Hanzo event stream in Insights.

Cloud INSERTs every product's events into `hanzo.events` on this same
warehouse. `cloud_events_mv` projects that stream onto the Insights event
schema on every insert, and the backfill carries the rows that arrived before
the view existed. Both write through `writable_events`, so there is still ONE
physical write path into `sharded_events`.

Requires `hanzo.events` to exist — Cloud owns it; see
`insights/models/event/cloud.py`.
"""

from insights.clickhouse.client.connection import NodeRole
from insights.clickhouse.client.migration_tools import run_sql_with_exceptions
from insights.models.event.cloud import (
    CLOUD_EVENTS_BACKFILL_SQL,
    CLOUD_EVENTS_MV_SQL,
    DROP_CLOUD_EVENTS_MV_SQL,
    TENANT_TEAM_DATA_SQL,
    TENANT_TEAM_TABLE_SQL,
)

operations = [
    # tenant -> team, read by the view. Created everywhere the view may run.
    run_sql_with_exceptions(
        TENANT_TEAM_TABLE_SQL(),
        node_roles=[NodeRole.DATA, NodeRole.COORDINATOR],
    ),
    run_sql_with_exceptions(
        TENANT_TEAM_DATA_SQL(),
        node_roles=[NodeRole.DATA, NodeRole.COORDINATOR],
    ),
    # Recreate so a changed projection takes effect on re-run.
    run_sql_with_exceptions(
        DROP_CLOUD_EVENTS_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
    run_sql_with_exceptions(
        CLOUD_EVENTS_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
    # The view is live first, so the backfill only ever overlaps it. uuid is
    # deterministic, so the overlap collapses in the ReplacingMergeTree.
    run_sql_with_exceptions(
        CLOUD_EVENTS_BACKFILL_SQL(),
        node_roles=[NodeRole.DATA],
    ),
]
