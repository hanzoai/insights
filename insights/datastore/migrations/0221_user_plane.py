"""Give the events on the plane the users they belong to.

`0217` projected `event.event` onto the event schema, so the warehouse holds
every product's events keyed by user. Nothing projected the USERS themselves,
and the People list, every actor drill-down and every cohort read `person` — so
the fork reported ZERO users against 5,000 of their own events.

Two views fix that from the same source, deriving identity from the same
expressions the event projection already uses:

    user_mv        this user exists            -> person
    user_alias_mv  this visitor IS that user   -> person_distinct_id_overrides

The alias is what makes a signup non-destructive. A visitor browses under a
browser-minted id, so their pageviews are written under it; they sign in, and
every later event is written under their IAM subject instead. Those are two
keys for one human, and without the alias the history simply ends at the moment
it starts being worth having. `@hanzo/event` sends the pre-login id alongside
the subject on every identified event, and Cloud stores it as `anonymous_id`,
so the join is already in the data — this view is only where it gets written
down in the shape the query engine reads (`person_distinct_id_overrides` is
exactly the table its person joins consult).

BACKFILL SAFETY. `0220` explains that re-projecting `sharded_events` DOUBLE-
COUNTS: `team_id` is in its collapse key, so a row written under a corrected
team does not replace the row it corrects. Neither target here has that shape.
`person` collapses on `(team_id, id)` and `person_distinct_id_overrides` on
`(team_id, distinct_id)`, and in both cases every component of the key is a
deterministic function of the source row — the same event always yields the
same key, so a second pass merges into the first pass's row instead of adding
one beside it. That is why these two backfill and the event projection does
not, and the difference is the collapse key, not a policy.

Requires `event.event` to exist — Cloud owns it; see
`insights/models/event/plane.py`.
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
    # Recreate so a changed projection takes effect on re-run.
    run_sql_with_exceptions(
        DROP_USER_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
    run_sql_with_exceptions(
        USER_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
    run_sql_with_exceptions(
        DROP_USER_ALIAS_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
    run_sql_with_exceptions(
        USER_ALIAS_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
    # The views are live first, so a backfill only ever overlaps them, and the
    # overlap collapses.
    run_sql_with_exceptions(
        USER_BACKFILL_SQL(),
        node_roles=[NodeRole.DATA],
    ),
    run_sql_with_exceptions(
        USER_ALIAS_BACKFILL_SQL(),
        node_roles=[NodeRole.DATA],
    ),
]
