"""Name a page the way every lens reads it, or the lens reads zero.

`0217` projected the plane's `name` straight through. The plane names a fact
the way the SURFACE says it — `page_viewed` — and every lens this fork ships
names that same fact the way ITS schema says it: the literal `$pageview`. Web
analytics, `sessions_mv.pageview_count` and `raw_sessions_v3_mv`'s
page/screen aggregates all key on that literal, so the passthrough published
rows into the warehouse that no lens could find.

It is not a cosmetic mismatch, and the warehouse says so. On 2026-08-01 the
window 06:00–15:00 UTC held 168 sessions and 0 counted pageviews; from 16:00,
with the back-map in place, the same traffic counted 32. Same events, same
volume — only the name differed.

WHY A SECOND MIGRATION. The projection is compiled into the view's SELECT, so
a changed expression only takes effect on a recreate, and `0217` will not run
again. This one recreates `event_mv` and nothing else.

NO BACKFILL, deliberately. Re-projecting would fix the historical names —
`uuid` is `MD5(id)`, so the rows collapse in the ReplacingMergeTree — but it
also re-fires every view attached to `sharded_events`, and `sessions` and
`raw_sessions*` are AggregatingMergeTree: their `sumIf` counters would count
the same pageview twice. Correcting a name by inflating a count trades one
wrong number for another. The mislabeled window stays as history; from here
forward the name is right.
"""

from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.event.plane import DROP_EVENT_MV_SQL, EVENT_MV_SQL

operations = [
    run_sql_with_exceptions(DROP_EVENT_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(EVENT_MV_SQL(), node_roles=[NodeRole.DATA]),
]
