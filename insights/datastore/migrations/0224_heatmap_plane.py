"""Give the heat map the clicks it is drawn from.

`insights.heatmaps` has had the whole pipeline since it was forked — Kafka table,
view, sharded table, Distributed read — and 0 rows. It reads from a DEDICATED
table, not from `events`, so no amount of `$click` volume could ever fill it: the
only writer was `heatmaps_mv`, fed by `kafka_heatmaps`, fed by an ingestion
consumer this deployment does not run. Cloud writes the plane directly, so the
topic has no producer and never had one.

`0217` already established the answer for exactly this shape: one more view over
the source that IS being written. `heatmap_mv` projects the pointer position off
`event.event` into `writable_heatmaps`, the same write-side table the Kafka view
targets, so both writers agree about sharding and nothing downstream changes.

THE POSITION IS NEW ON THE WIRE. `@hanzo/observe` took the element off the click
and discarded the MouseEvent, so a `$click` named WHICH thing was clicked and
never where it sat — element identity cannot be drawn as a heat map. It now
measures `$x`, `$y`, `$target_fixed`, `$viewport_width` and `$viewport_height`,
and Cloud carries them in `attributes` like any other property, so the ingest
path learned nothing new.

Consequence, and it is the honest one: this view is live the moment it is
created, and stays EMPTY until an SDK that measures a position is deployed to the
sites. A click without one is not projected (the position is required, not
defaulted) — every historical click would otherwise pile up at the origin and
draw a hot corner that nobody clicked.

No backfill, for two reasons that agree: `sharded_heatmaps` is a plain MergeTree
with no collapse key, so a second pass would DOUBLE every row rather than replace
it — and no click in the warehouse carries a position anyway, so it would project
nothing. See the note at the end of `insights/models/event/plane.py`.

Requires `event.event` to exist — Cloud owns it; see
`insights/models/event/plane.py`.
"""

from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.event.plane import DROP_HEATMAP_MV_SQL, HEATMAP_MV_SQL

operations = [
    # Recreate so a changed projection takes effect on re-run.
    run_sql_with_exceptions(
        DROP_HEATMAP_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
    run_sql_with_exceptions(
        HEATMAP_MV_SQL(),
        node_roles=[NodeRole.DATA],
    ),
]
