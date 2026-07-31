"""Give every org its own team, and stop defaulting orgs into a customer's.

`org_team` mapped `admin`, `hanzo` and `maxpower` all to team 1, and `event_mv`
defaulted every org it did not find — including `$public`, the anonymous org
that carries ~95% of the traffic — to team 1 as well. So a single team held
every event on the plane:

    SELECT team_id, count() FROM sharded_events GROUP BY team_id
    -> 1, 4211

Team 1 belongs to a real customer, so this is a tenant-isolation failure in both
directions: anonymous traffic and other orgs' traffic were readable from that
customer's project, and the plane could not separate tenants at all.

Unrouted traffic now lands in team 0, which no project can read, because team
ids are handed out by `insights_team_id_seq` starting at 1. An org becomes
readable only when someone deliberately routes it — an INSERT into `org_team` —
so a tenant that first appears on the plane tomorrow cannot land in another
tenant's project by default.

`org_team` keeps the newest row per org, so the mapping is corrected by writing
over it; the view is recreated because the default is compiled into its SELECT.

This deliberately does NOT re-run the backfill, unlike the migrations that
changed `properties`. `sharded_events` is ordered by
`(team_id, toDate(timestamp), event, cityHash64(distinct_id), cityHash64(uuid))`
and collapses on that key, so a re-projection that changes `team_id` does not
replace the row it corrects — it writes a second copy under the new team and
double-counts every event it touches. Rows already written keep the team they
were captured with; correcting them means deleting the old copies, which is a
separate and deliberate operation, not a side effect of fixing the routing.
"""

from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.event.plane import (
    DROP_EVENT_MV_SQL,
    EVENT_MV_SQL,
    ORG_TEAM_DATA_SQL,
)

operations = [
    run_sql_with_exceptions(
        ORG_TEAM_DATA_SQL(),
        node_roles=[NodeRole.DATA, NodeRole.COORDINATOR],
    ),
    run_sql_with_exceptions(
        DROP_EVENT_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
    run_sql_with_exceptions(
        EVENT_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
]
