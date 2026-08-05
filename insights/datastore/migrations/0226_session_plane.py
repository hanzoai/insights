"""Give session recording the sessions it is made of.

`insights.session_replay_events` had the same emptiness as `heatmaps` did in
0224, for the same reason and with the same fix. The whole pipeline was already
there — Kafka table, view, sharded Aggregating table, Distributed read — and its
topic `datastore_session_replay_events` HAS NO PRODUCER and never had one.
Neither Cloud nor this app writes it. Its only rows were four hand-made probes
(`abc`, `red-verify-…`, `replay-e2e-…`, `edit-probe-…`), which is why "session
replay is live" could be true of PLAYBACK and false of CAPTURE at the same time.

So the answer is 0217's again, and 0224's: one more view over the source that IS
being written.

NOTHING NEW IS CAPTURED TO MAKE THIS WORK. `@hanzo/observe` already annotates
every interaction with the semantic hierarchy that makes a session readable
("nav / Dashboard / UserCard / button[save]"), already stamps a `session_id`, and
already sends it down the one front door. A session summary is that stream,
grouped by the session it belongs to. There is no second SDK to ship, no blob
store to run, and no CDN script for a strict `default-src 'none'` CSP to break.

THIS IS DELIBERATELY NOT A DOM-SNAPSHOT RECORDER, and the columns say so rather
than pretending: `size` and the `block_*` arrays describe chunks of recorded DOM
in object storage, which this plane does not have, so they are 0 and empty. The
console counts are 0 for the same reason — that stream is not carried here — while
`console_error_count` IS measured, because an error rides the same `session_id`
as the clicks around it. A column that says "not measured here" is worth more
than one that guesses.

WHY RE-RUNNING IS SAFE WHERE 0224 REFUSED A BACKFILL. The target is an
AggregatingMergeTree keyed on the session, so the view emits one PARTIAL row per
insert block and the engine merges them; and a view only ever sees new inserts,
so re-creating it projects nothing twice. That is the opposite of
`sharded_heatmaps`, a plain MergeTree where a second pass would double every row
— which is exactly why 0224 has no backfill and this file needs no special case.

Historical sessions are NOT backfilled, for the honest reason: a summary
assembled today from events captured before the projection existed would claim a
recording that was never made.

Requires the event plane to exist — Cloud owns it; see
`insights/models/event/plane.py`.
"""

from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.event.plane import DROP_REPLAY_MV_SQL, REPLAY_MV_SQL

operations = [
    # Recreate so a changed projection takes effect on re-run.
    run_sql_with_exceptions(
        DROP_REPLAY_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
    run_sql_with_exceptions(
        REPLAY_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
]
