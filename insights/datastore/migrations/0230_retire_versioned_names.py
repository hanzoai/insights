"""Retire the version-suffixed table names, without dropping a row.

A `_v2` is a confession: two tables are the same thing and nobody deleted one.
The warehouse carried nine of them. This migration retires three and leaves the
other six declared rather than accidental — `bin/tables` holds the list and the
reason for each, and refuses a tenth.

Nothing here drops a table that holds data. The two objects dropped by name are
a Kafka engine table and a materialized view, neither of which stores rows, and
the one populated table is MOVED rather than deleted. `max_table_size_to_drop`
is deliberately NOT set: it reads as a safety rail and is the opposite of one —
`= 0` means "no limit, drop anything" — so leaving it alone keeps the server's
default refusal to drop something large, and these are empty.

WHAT THIS TOUCHES

1. `query_log_archive_v2` -> `retired.query_log_archive`.

   Migration 0196 renamed the pre-sharding archive aside to make room for the
   sharded one, and left it in the live namespace. It holds 575 rows, last
   written 2026-07-30, while `sharded_query_log_archive` has taken 1.9M rows
   and is still being written; nothing reads the old one. A cross-database
   RENAME between two Atomic databases is a metadata operation — every row is
   kept, no data moves, and the suffix leaves the namespace people read.

   The version distinction becomes a NAMESPACE distinction, which is the rule:
   `retired.query_log_archive` needs no number, because `retired` already says
   the thing the `_v2` was trying to say.

2. `kafka_log_entries_v3` and `log_entries_v3_mv` are dropped, and the clean
   `kafka_log_entries` / `log_entries_mv` pair is recreated to do their job.

   These are not leftovers — the `_v3` pair is the LIVE consumer, and the
   unsuffixed pair beside it is the stale one. Both read the topic
   `log_entries` (the topic itself has no version in its name), under two
   different consumer groups — `datastore_log_entries` and the server-default
   `group1` — and both write to `sharded_log_entries`. So every log line was
   consumed twice and written twice, deduplicated afterwards only because the
   destination is a ReplacingMergeTree. Retiring the name and retiring the
   duplicate are the same act.

   The survivor keeps the `_v3` pair's SEMANTICS, which were the better ones:
   the named consumer group, `kafka_skip_broken_messages`, and the guard
   against future-dated rows (see log_entries.py). Because it keeps the group
   name, it resumes from the offsets the retired consumer had already
   committed — no replay, no gap.

   The destination is deliberately NOT changed. The `_v3` view wrote to
   `writable_log_entries` and the clean one writes to `log_entries`; in
   production both are Distributed tables over `sharded_log_entries`, so they
   are the same destination, but in a freshly-built schema `log_entries` is a
   MergeTree of its own. Switching would make a fresh install differ from
   production, and that drift is what put nine names in the namespace to begin
   with. It is a real inconsistency and it is not this migration's to fix.

WHAT THIS DOES NOT TOUCH

The six `raw_sessions_v3` objects. They are the successor half of a dual-write
migration that is still in flight: both tables are written on every event, and
`database.py` resolves `sessionTableVersion` AUTO to V2, so v3 is written and
not yet read. Renaming a successor while it is still the successor only moves
the confession. They retire at the cutover, when the predecessor goes and the
survivor takes the plain name `raw_sessions`.
"""

from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.datastore.log_entries import KAFKA_LOG_ENTRIES_TABLE_SQL, LOG_ENTRIES_TABLE_MV_SQL

# The namespace retired tables live in. A name here needs no number.
RETIRED_DATABASE = "retired"

# IF EXISTS on both halves so this is a no-op on an install that never had the
# old name — a fresh schema has no query_log_archive_v2 to move.
MOVE_QUERY_LOG_ARCHIVE = [
    f"CREATE DATABASE IF NOT EXISTS {RETIRED_DATABASE}",
    f"RENAME TABLE IF EXISTS query_log_archive_v2 TO {RETIRED_DATABASE}.query_log_archive",
]

# Views before their sources: a materialized view whose FROM disappears first
# is a view that cannot be dropped cleanly.
DROP_DUPLICATE_LOG_ENTRIES_CONSUMER = [
    "DROP TABLE IF EXISTS log_entries_v3_mv",
    "DROP TABLE IF EXISTS kafka_log_entries_v3",
    "DROP TABLE IF EXISTS log_entries_mv",
    "DROP TABLE IF EXISTS kafka_log_entries",
]

operations = [
    *[run_sql_with_exceptions(sql, node_roles=[NodeRole.DATA]) for sql in MOVE_QUERY_LOG_ARCHIVE],
    *[
        run_sql_with_exceptions(sql, node_roles=[NodeRole.INGESTION_SMALL])
        for sql in DROP_DUPLICATE_LOG_ENTRIES_CONSUMER
    ],
    # Built from the same functions schema.py declares, so a migrated warehouse
    # and a freshly created one hold the identical object. That equality is the
    # property this whole change is about: the nine names existed because the
    # two drifted apart and nothing compared them.
    run_sql_with_exceptions(KAFKA_LOG_ENTRIES_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.INGESTION_SMALL]),
    run_sql_with_exceptions(LOG_ENTRIES_TABLE_MV_SQL(on_cluster=False), node_roles=[NodeRole.INGESTION_SMALL]),
]
