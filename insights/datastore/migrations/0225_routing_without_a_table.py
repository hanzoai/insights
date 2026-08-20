"""Delete the routing table, and compile the routing into the views instead.

`insights.org_team` was a warehouse copy of something the app already knows:
`Organization.slug` is the value the envelope carries as `org`, and an org's
project is its first team. A second copy of a fact is a second opinion about it,
and this one disagreed — `admin` and `maxpower` were both mapped to project 1, so
a separate funded org's events landed in Hanzo's own project. `0220` fixed the
disagreement by DERIVING the copy. That made the copy right; it did not stop it
being a copy, and a copy is a thing that can drift again.

So there is no copy. `manage.py route_orgs` now drops and recreates the three
projections from the app's own records, and this migration does the same thing
once so the live views stop reading a table that is about to go.

AND THE DEFAULT GOES WITH IT. `0220` moved unrouted traffic off project 1 — which
belongs to a customer — and into project 0, which nobody can read. That closed the
leak and left a smell: `$public`, `admin` and `maxpower` were then three distinct
tenants in ONE bucket, indistinguishable by the only column `sharded_events` keys
on. The view now considers only orgs that own a project (`ROUTED_SQL`), so
nothing is defaulted anywhere. Every row is still on `event.fact` — the plane is
lossless — and an org becomes projectable the moment the app provisions it.

Measured on insights.hanzo.ai, 2026-08-02, before this ran:
`insights.org_team` = {$public: 0, admin: 0, maxpower: 0, hanzo: 1}; one Insights
org (`hanzo`) owning one project (1). So the compiled routing is {hanzo: 1} and
the three tenants sharing bucket 0 stop being projected at all.

NO BACKFILL, for the reason `0220` proves: `sharded_events` collapses on a key
that includes `team_id`, so re-projecting under a corrected project does not
replace the row it corrects — it writes a second copy and double-counts. Rows
already written keep the project they were captured under. The 292 rows under
project 0 stay there; deleting them is a separate, deliberate operation.

DROPPING THE TABLE IS THE OPERATOR'S. It is populated, and nothing in this repo
drops populated tables. Once these views are live and no `SHOW CREATE` mentions
it, the table is dead and one statement retires it:

    DROP TABLE IF EXISTS insights.org_team;

Until then it is simply an unread table, which costs nothing but the four rows.
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
)

# ONE reading of the app's records, so every view this migration creates routes
# the same way. See the routing note in `plane.py`.
# Routing is gone: the org IS the tenant, so there is no org -> project map to
# read and these builders take no argument. Keeping the old call shape here
# broke the import of EVERY datastore migration, so nothing could run at all.

operations = [
    run_sql_with_exceptions(DROP_EVENT_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(EVENT_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(DROP_USER_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(USER_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(DROP_USER_ALIAS_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(USER_ALIAS_MV_SQL(), node_roles=[NodeRole.DATA]),
]
