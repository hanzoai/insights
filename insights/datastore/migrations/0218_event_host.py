"""Carry the site an event happened on.

`event_mv` did not project a `$host`, so every Hanzo property — hanzo.ai,
hanzo.app, hanzo.chat, cloud.hanzo.ai — read as one undifferentiated site and
the web-analytics host filter had nothing to filter on. The projection now
derives it from the envelope's `url`, and the view is recreated so events
carry it from here on.

This does NOT re-project the rows that arrived without a `$host`, for the same
reason `0220_org_team_isolation` does not re-project the rows that arrived
under the old team. A backfill is only a repair while it lands on the key the
original row already occupies. `sharded_events` is ordered by
`(team_id, toDate(timestamp), event, cityHash64(distinct_id), cityHash64(uuid))`
and collapses on that key, so a deterministic `uuid` collapses a re-projection
onto its original ONLY while `team_id` also agrees. Routing unattributed orgs
to `UNATTRIBUTED_TEAM` moved most of the plane off the team it was captured
with, so re-projecting now would write a second copy under the new team and
double-count every event it touched rather than adding a `$host` to it.

Adding `$host` to rows already written therefore means deleting the old copies,
which is a separate and deliberate operation — not a side effect of fixing the
projection.
"""

from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.event.plane import (
    DROP_EVENT_MV_SQL,
    EVENT_MV_SQL,
)

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
