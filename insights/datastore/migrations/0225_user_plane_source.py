"""Point the user plane at the table that is still being written.

The event plane was renamed `event.event` -> `event.fact`. `0223` recreated
`event_mv`, so the EVENTS followed. The two views that project the USERS did
not, and a view whose source stopped receiving rows does not fail — it simply
stops firing. `event.event` still answers every query with the 9,605 rows it
froze holding on 2026-08-02, which is the date the People list stopped growing.

The rename was also a MERGE. One table now holds every signal ingest accepts
— act, clip, error, log, span — so `FROM event.fact` alone projects a browser
that only ever threw an exception as a user. `plane.py` pins `signal = 'act'`,
and both views are recreated here because the predicate is compiled into the
view's SELECT: a changed expression only takes effect on a recreate, and `0221`
will not run again.

WITH A BACKFILL, unlike `0223`. That migration refused one because re-firing
`event_mv` re-enters `sessions` and `raw_sessions*`, which are
AggregatingMergeTree: their `sumIf` counters would count the same pageview
twice. Nothing in this file's path is aggregating. `person` collapses on
(team_id, id) and `person_distinct_id_overrides` on (team_id, distinct_id),
both ReplacingMergeTree, and `0222` made the version a function of
`ingested_at` — a column DEFAULT nothing on the wire can reach. The same source
row therefore yields the same version on every pass and the second one merges
into the first, so the backfill is re-runnable rather than merely survivable.

Its ONE condition is the one `0221` names: the key is a function of the event
GIVEN THE ROUTING, so re-routing an org that already has users leaves a stale
row under its old team. Every org now in `event.fact` — `$public`, `hanzo`,
`zoo`, `lux` — is already mapped in `org_team`, and this migration does not
move any of them.

Measured on insights.hanzo.ai before it ran: 709 act rows project 434 users, of
which 7 are already on the plane; 36 rows carry an alias, resolving to 4
distinct ids, of which 2 are present. The `signal` predicate is what excludes
the other 23 rows in the table — errors, which carry no `person_id` and would
have arrived as anonymous users.

The views are created before the backfill so the two only ever overlap, and the
overlap collapses.
"""

from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.event.plane import (
    DROP_USER_ALIAS_MV_SQL,
    DROP_USER_MV_SQL,
    USER_ALIAS_BACKFILL_SQL,
    USER_ALIAS_MV_SQL,
    USER_BACKFILL_SQL,
    USER_MV_SQL,
)

operations = [
    run_sql_with_exceptions(DROP_USER_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(USER_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(DROP_USER_ALIAS_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(USER_ALIAS_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(USER_BACKFILL_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(USER_ALIAS_BACKFILL_SQL(), node_roles=[NodeRole.DATA]),
]
