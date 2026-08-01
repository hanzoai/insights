"""Decide a projected user by the SERVER's clock, and leave room above the plane.

`0221` got two things wrong, and they are the same mistake twice: it let the
version mean more than one thing at a time.

CALLER-CHOSEN PRECEDENCE. The version was built from `time`, which is the
CALLER's — `clampTS` only pulls the future back to now, so a caller may
back-date within its own org. Under a first-wins rule that is not a rounding
error, it is the whole decision: a back-dated row outranks every genuine one
forever. It is reachable in one more way nobody had to craft — the reduced
ingest lane stamps the subject into `distinct_id` and leaves `person_id` empty,
so a signed-in user's own rows can arrive keyed as the same user and flagged
NOT identified. Whichever of those landed earliest won, so `is_identified`
could go 1 -> 0 and stay there. Precedence now reads `ingested_at`, a column
DEFAULT (`now64(3)`) that nothing on the wire can reach, and identification
outranks time — so a user we have ever known by name stays known, and the worst
an anonymous row can do is add them before we learn it.

IMMORTAL ROWS. The version was `bitNot(ms)`, which anchors every projected row
at the top of the UInt64. Nothing can bid higher than the top: no tombstone, no
richer source, no correction. The fork's own delete writes `version + 100` and
loses by nineteen orders of magnitude. Versions now sit in bands with the top
band reserved for exactly the decisions the plane does not get to make.

The proof that this mattered is the repair itself: rows written by the old
scheme cannot be superseded by the new one — nothing can outrank the top — so
they have to be DELETED. That is an operator step, below, not something this
migration does silently.

    -- retire the rows the first scheme wrote. 3 * (1 << 61) is the ceiling of
    -- the plane's whole version space, so this matches the retired shape and
    -- nothing else: the fork's own rows carry small versions, and every row it
    -- removes is re-projected by the backfill in this migration.
    DELETE FROM `insights`.`person` WHERE version >= 6917529027641081856

Applied to insights.hanzo.ai on 2026-08-01: 1348 rows retired, 11 fork-written
rows untouched, all users re-projected.
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
    # The projection is compiled into the view's SELECT, so a changed version
    # only takes effect on a recreate.
    run_sql_with_exceptions(DROP_USER_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(USER_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(DROP_USER_ALIAS_MV_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(USER_ALIAS_MV_SQL(), node_roles=[NodeRole.DATA]),
    # Views first, so the backfill only ever overlaps them, and the overlap
    # collapses. Re-running is safe for the reason 0221 gives — and only for
    # rows whose routing has not changed since; see its BACKFILL SAFETY note.
    run_sql_with_exceptions(USER_BACKFILL_SQL(), node_roles=[NodeRole.DATA]),
    run_sql_with_exceptions(USER_ALIAS_BACKFILL_SQL(), node_roles=[NodeRole.DATA]),
]
