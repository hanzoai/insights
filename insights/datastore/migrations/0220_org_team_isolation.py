"""Give every org its own project, and stop defaulting orgs into a customer's.

The routing table mapped `admin`, `hanzo` and `maxpower` all to project 1, and
`event_mv` defaulted every org it did not find — including `$public`, the
anonymous org that carries ~89% of the traffic — to project 1 as well. So a
single project held every event on the plane:

    SELECT team_id, count() FROM sharded_events GROUP BY team_id
    -> 1, 4211

Project 1 belongs to a real customer, so this is a tenant-isolation failure in
both directions: anonymous traffic and other orgs' traffic were readable from
that customer's project, and the plane could not separate tenants at all.
`maxpower` is a separate funded org, so its events were landing in Hanzo's own.

Unrouted traffic now lands in project 0, which nobody can read, because project
ids are handed out by `insights_team_id_seq` starting at 1. An org becomes
readable only when it is deliberately routed, so a tenant that first appears on
the plane tomorrow cannot land in another tenant's project by default.

The view is recreated because the default is compiled into its SELECT — that
is the whole of what this migration does, and it is the part that had never
run. Applied to insights.hanzo.ai on 2026-08-01: the live view still carried
`toInt64(1)` while the source had said `toInt64(0)` since this file was
written, so every unrouted org — 7,665 of 8,093 rows on the plane, 94.7% — was
still being routed into project 1. A migration that is committed is not a
migration that has run; this one sat unapplied behind `0217` for days while the
source read as though it had.

It no longer writes the mapping itself. It once carried a corrective row per
org, which made this file a SECOND author of a table the app already knows the
contents of, racing the first on a `version` that is just `now()`. The mapping
is published from the app's own org records by `manage.py route_orgs`, which is
now the only writer; see the routing note in `plane.py`.

This deliberately does NOT re-run the backfill, unlike the migrations that
changed `properties`. `sharded_events` is ordered by
`(team_id, toDate(timestamp), event, cityHash64(distinct_id), cityHash64(uuid))`
and collapses on that key, so a re-projection that changes `team_id` does not
replace the row it corrects — it writes a second copy under the new project and
double-counts every event it touches. Rows already written keep the project they
were captured under; correcting them means deleting the old copies, which is a
separate and deliberate operation, not a side effect of fixing the routing.
"""

from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.event.plane import DROP_EVENT_MV_SQL, EVENT_MV_SQL

operations = [
    run_sql_with_exceptions(
        DROP_EVENT_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
    run_sql_with_exceptions(
        EVENT_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
]
