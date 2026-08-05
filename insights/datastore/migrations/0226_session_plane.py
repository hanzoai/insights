"""Superseded by 0227. Kept for history and numbering; does nothing.

This migration created `replay_mv`, a projection that summarised a session from
the interaction stream into `session_replay_events` so the session list had rows
before a DOM recorder existed. It also wrote `block_urls` empty, which is what
made it unplayable by construction — and worse, unplayable for the recordings
that DO have blocks, because the two writers share a
SimpleAggregateFunction(min) timestamp and `build_block_list` drops every block
when the merged `min_first_timestamp` disagrees with the first block's start.
0227 has the full account.

The operations are emptied rather than the file deleted because this migration
is RECORDED AS APPLIED on existing deployments, and because it was written to be
re-runnable ("recreate so a changed projection takes effect"). Left intact, the
next re-run would recreate the view and silently break playback again. A fresh
install now never creates it at all.
"""

operations = []
