"""Drop `replay_mv`, so a recorded session can play.

`session_replay_events` has one writer again: the blob pipeline. The browser
recorder sends rrweb snapshots to `/v1/replay`, the ingester writes a snappy
block to object storage and lands a row per block carrying `block_urls` and the
byte range the player reads back.

0226 added a SECOND writer — a projection of the interaction stream, which filled
`block_urls` with an empty array because it has no blobs to point at. Two writers
on this table do not coexist, and the failure is silent:

    `min_first_timestamp` is a SimpleAggregateFunction(min), so the merged row
    takes the EARLIEST timestamp either writer supplied. The first click on a
    page always precedes the recorder's first snapshot. `build_block_list`
    (`session_recordings/session_recording_v2_service.py`) then requires
    `blocks[0].start_time == start_time` EXACTLY and returns [] when they
    disagree — "we did not get the recording from the start, so show none of it".

Reproduced on the live warehouse before writing this: a session with one real
block listed `block_urls = ['s3://…?range=bytes=0-489']`, and `list_blocks`
returned 0 blocks once a single interaction event for the same `session_id`
landed a projected row 1.4s earlier. The bytes were in object storage the whole
time. Every browser session hits this, because a page that records also clicks.

Removing the projection empties the session list of sessions that were never
recorded. That is the point: a recording is a thing you can play, and listing one
that cannot play is the bug. The interaction stream is untouched in `event.fact`.

The rows 0226 already projected are NOT deleted here. They are inert — a session
id is unique, so an old fabricated row cannot collide with a new recording — and
a mutation over an AggregatingMergeTree is a heavier, slower operation than a
migration should perform on every deployment. They age out with retention.
"""

from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.event.plane import DROP_REPLAY_MV_SQL

operations = [
    run_sql_with_exceptions(
        DROP_REPLAY_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
]
