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

BACKFILL SAFETY, AND ITS ONE CONDITION. `0220` explains that re-projecting
`sharded_events` DOUBLE-COUNTS: `team_id` is in its collapse key, so a row
written under a corrected team does not replace the row it corrects. `person`
collapses on `(team_id, id)` and `person_distinct_id_overrides` on
`(team_id, distinct_id)` — the SAME shape. What makes re-running these safe is
narrower than "the key is a function of the event", which is not true:
`team_id` is `transform(org, ...)` over `org_team`, a table `0220` exists to
MUTATE. The key is a function of the event GIVEN THE ROUTING, so a second pass
merges into the first pass's row for as long as the routing is unchanged, and
re-routing an org that already has events leaves a stale user row under its old
team — the same double-count, one table over.

That is not hypothetical here: `0220` moved `$public` from team 1 to team 0
AFTER `event_mv` had already written its events under team 1, and deliberately
did not re-project them. So on this warehouse the users are routed correctly
and ~92% of team 1's events still point at users that team cannot see. The
users are right and the events are stale. Reconciling them means deleting the
event rows written under the old routing, which is the "separate and deliberate
operation" `0220` names — an operator step, not a side effect of this file:

    -- events captured before 0220 under the routing it corrected
    DELETE FROM `insights`.`sharded_events`
    WHERE team_id = 1 AND person_id NOT IN (SELECT id FROM `insights`.`person` WHERE team_id = 1)

Re-routing an org with existing users needs the same treatment for `person` and
`person_distinct_id_overrides`, keyed on the old team.

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
