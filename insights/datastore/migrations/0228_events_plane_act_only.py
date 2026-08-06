"""Pin `event_mv` to the `act` signal, so an error message stops becoming an event.

`event.fact` holds every signal the door accepts — act, clip, error, log, span —
discriminated by `signal`. The events plane is the PRODUCT-event plane, so its
projection has to say which signal it wants. `plane.py` says exactly that, and
names both failure modes:

    unpinned, an exception message arrives as an event name and a browser that
    only ever threw becomes a user.

`EVENT_WHERE()` was written for that. It was wired into the USERS plane
(`user_mv`, `user_alias_mv`) and never into the EVENTS plane, so half the comment
was implemented and the deployed `event_mv` selected `FROM event.fact` with no
predicate at all.

Measured on the live warehouse before writing this. `event.fact` held 69 rows at
`signal = 'error'`, and their `name` is the exception message, so `insights.events`
had accumulated event NAMES like:

    "ResizeObserver loop completed with undelivered notifications."   x17
    "The string did not match the expected pattern."                  x2
    "Loading chunk 3324 failed. (error: https://hanzo.ai/_next/...)"  x1

Those are not events. They are cardinality in the event taxonomy, which is what
autocomplete, the trend/funnel pickers and every property definition read from,
and each distinct message is a new entry forever.

WHAT THIS DOES NOT FIX, deliberately. Error tracking queries the events plane for
`event = '$exception'` (`error_tracking/backend/presentation/views/query.py`), and
finds one row today, because errors arrive under their message rather than under
the reserved name. This migration takes that 1 to 0 rather than papering over it
by minting `$exception` here: errors already have their own plane (`event.error`,
written from the same envelope), and projecting them a second time into the events
plane would be two homes for one fact. Pointing error tracking at the error plane
is its own change; this one stops the events plane being wrong.

Existing polluted rows are left in place. `sharded_events` is keyed on
`(team_id, toDate(timestamp), event, cityHash64(distinct_id), cityHash64(uuid))`,
so a delete is a mutation over that sort key, and ~25 rows do not justify one.
They age out; nothing new joins them.
"""

from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.event.plane import DROP_EVENT_MV_SQL, EVENT_MV_SQL

operations = [
    run_sql_with_exceptions(DROP_EVENT_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(EVENT_MV_SQL(), node_roles=[NodeRole.DATA]),
]
