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
from insights.models.event.plane import DROP_EVENT_MV_SQL, EVENT_BACKFILL_SQL, EVENT_MV_SQL

# This migration used to create `insights.org_team`, the org -> project lookup
# the view read. There is no such table any more: the mapping lives in the app's
# own org records and the views are compiled from them (see the routing note in
# `plane.py`, and `0225`). The operation is removed rather than left inert,
# because a migration that creates a table nothing reads is how a dropped object
# comes back on the next fresh install.

# ONE reading of the app's records, so every view this migration creates routes
# the same way. See the routing note in `plane.py`.
# Routing is gone: the org IS the tenant, so there is no org -> project map to
# read and these builders take no argument. Keeping the old call shape here
# broke the import of EVERY datastore migration, so nothing could run at all.

operations = [
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
