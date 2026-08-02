"""Read the ONE fact table, and say which signal you mean.

The plane was five tables with an identical envelope — `event.event`,
`event.error`, `event.log`, `event.span`, `event.metric`. That is CONSISTENT and
not UNIFIED: no question could span two signals without a hand-written UNION ALL,
and a new product meant a new table name, which is precisely how the namespace
this fork inherited grew nine `_v2`/`_v3` twins.

It is now ONE table, `event.fact`, one row per thing that happened, with a
`signal` column saying which sort. `event.event` becomes `signal = 'act'` — act
and not event, because `event` is the NAMESPACE and a value cannot also be the
set it belongs to.

WHY THREE VIEWS MOVE AND NOT ONE. `event_mv`, `user_mv` and `user_alias_mv` all
read the same source, so all three change together. Under the old shape naming
`event.event` selected product events by construction; under the new one that is
a PREDICATE, and a view that omitted it would publish every log line and every
span into the product-event stream and mint a `person` row for each. The
predicate is therefore built in one place (`plane.EVENT_FROM_SQL` /
`EVENT_SIGNAL_SQL`) and composed by all three, so a fourth view inherits it
rather than having to remember it.

A materialized view's SELECT is fixed at creation, so a changed source only takes
effect on a recreate and `0217`/`0221`/`0223` will not run again. This migration
recreates the three and nothing else.

NO BACKFILL, for the reason `0223` gives and `0220` proves: re-projecting
`sharded_events` DOUBLE-COUNTS, because `team_id` sits inside its collapse key so
a corrected row does not replace the row it corrects, and every AggregatingMergeTree
view attached to it (`sessions`, `raw_sessions*`) re-fires its `sumIf` counters.
The history already in the warehouse was written from the same rows through the
same projection; only the source table's name has changed.

PREREQUISITE, and it is a hard one: `event.fact` must exist and be populated.
hanzoai/o11y owns its DDL (`deploy/datastore/migrations/0002_event_fact.sql`) and
cloud owns the write path into it. Run that migration and its backfill FIRST — a
materialized view over a table that does not exist fails to create, and one over
an empty table silently projects nothing.
"""

from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.event.plane import (
    DROP_EVENT_MV_SQL,
    DROP_USER_ALIAS_MV_SQL,
    DROP_USER_MV_SQL,
    EVENT_MV_SQL,
    USER_ALIAS_MV_SQL,
    USER_MV_SQL,
    provisioned,
)

# ONE reading of the app's records, so every view this migration creates routes
# the same way. See the routing note in `plane.py`.
ROUTING = provisioned()

operations = [
    run_sql_with_exceptions(DROP_EVENT_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(EVENT_MV_SQL(ROUTING), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(DROP_USER_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(USER_MV_SQL(ROUTING), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(DROP_USER_ALIAS_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(USER_ALIAS_MV_SQL(ROUTING), node_roles=[NodeRole.DATA]),
]
