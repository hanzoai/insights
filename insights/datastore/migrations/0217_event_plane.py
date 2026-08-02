"""Show the unified Hanzo event plane in Insights.

Every product's facts land in `event.event` on this same warehouse. `event_mv`
projects that plane onto the Insights event schema on every insert, and the
backfill carries the rows that arrived before the view existed. Both write
through `writable_events`, so there is still ONE physical write path into
`sharded_events`.

Requires `event.event` to exist — Cloud owns it; see
`insights/models/event/plane.py`.
"""

from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.event.plane import DROP_EVENT_MV_SQL, EVENT_BACKFILL_SQL, EVENT_MV_SQL, ORG_PROJECT_TABLE_SQL

operations = [
    # org -> project, read by the view. Created everywhere the view may run,
    # and left EMPTY: which project an org owns is the app's own record, so it
    # is published by `manage.py route_orgs` rather than seeded here. A
    # migration that also authored the mapping is what let a hand-written copy
    # disagree with it — see the routing note in `plane.py`.
    run_sql_with_exceptions(
        ORG_PROJECT_TABLE_SQL(),
        node_roles=[NodeRole.DATA, NodeRole.COORDINATOR],
    ),
    # Recreate so a changed projection takes effect on re-run.
    run_sql_with_exceptions(
        DROP_EVENT_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
    run_sql_with_exceptions(
        EVENT_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
    # The view is live first, so the backfill only ever overlaps it. uuid is
    # deterministic, so the overlap collapses in the ReplacingMergeTree.
    run_sql_with_exceptions(
        EVENT_BACKFILL_SQL(),
        node_roles=[NodeRole.DATA],
    ),
]
