"""The invariants the user projection is only correct because of.

Every assertion here pins a decision that is INVISIBLE in the SQL text unless
you already know why it is written that way — which is exactly the kind of
thing a later edit silently undoes.
"""

from insights.models.event.plane import (
    BAND,
    BAND_ANONYMOUS,
    BAND_IDENTIFIED,
    BAND_OVERRIDE,
    EVENT_COLUMNS,
    IDENTIFIED_SQL,
    INGESTED_MS,
    NOW_MS,
    OVERRIDE_VERSION,
    USER_ALIAS_BACKFILL_SQL,
    USER_ALIAS_COLUMNS,
    USER_ALIAS_MV_SQL,
    USER_ALIAS_SELECT_SQL,
    USER_ALIAS_TOMBSTONE_SQL,
    USER_BACKFILL_SQL,
    USER_COLUMNS,
    USER_MV_SQL,
    USER_SELECT_SQL,
    USER_SQL,
    USER_TOMBSTONE_SQL,
    precedence,
)


def column(columns, name):
    return dict(columns())[name]


def test_a_user_row_exists_for_every_user_an_event_names():
    """The two projections must key on the SAME expression.

    If they drift, events reference a user the list has no row for — which is
    the exact shape of the bug this plane was written to fix, just moved one
    table over.
    """
    events = dict(EVENT_COLUMNS(historical=False))
    assert column(USER_COLUMNS, "id") == events["person_id"] == USER_SQL


def test_identified_is_derived_from_the_same_predicate_as_the_key():
    """Per row, the flag and the key come from ONE predicate, so they agree."""
    assert column(USER_COLUMNS, "is_identified") == f"toInt8({IDENTIFIED_SQL})"
    assert IDENTIFIED_SQL in USER_SQL


def test_a_user_once_identified_can_never_become_anonymous_again():
    """The flag cannot be a per-row invariant, so precedence has to carry it.

    Two rows CAN share a key and disagree: the reduced ingest lane stamps the
    subject into `distinct_id` and leaves `person_id` empty, and a caller may
    send any `distinct_id` it likes — including someone else's subject. Both
    land on that subject's key flagged NOT identified.

    Identification therefore outranks time: every identified version is above
    every anonymous one, whatever the clocks say, so the disagreement settles
    the one way that is true.
    """
    clock = f"({BAND} - 1 - {INGESTED_MS})"
    anonymous = f"{BAND_ANONYMOUS} * {BAND} + {clock}"
    identified = f"{BAND_IDENTIFIED} * {BAND} + {clock}"
    assert precedence(str(BAND_ANONYMOUS), INGESTED_MS, first=True) == anonymous
    assert precedence(str(BAND_IDENTIFIED), INGESTED_MS, first=True) == identified

    # The bands cannot meet: the widest a clock can range is one band, so the
    # best anonymous version is still below the worst identified one.
    assert BAND_ANONYMOUS * BAND + (BAND - 1) < BAND_IDENTIFIED * BAND


def test_precedence_is_never_the_callers_to_choose():
    """`time` is the caller's; `ingested_at` is a column DEFAULT it cannot reach.

    `clampTS` only pulls the FUTURE back to now, so a caller can back-date
    inside its own org. Under first-wins that would let a back-dated row outrank
    every genuine one, permanently.
    """
    for expression in (column(USER_COLUMNS, "version"), column(USER_ALIAS_COLUMNS, "version")):
        assert INGESTED_MS in expression
        assert "time" not in expression.replace("toUnixTimestamp64Milli", "")


def test_created_at_reads_the_clock_that_decided_the_row():
    """A row that wins on one clock and reports another is two facts in a coat."""
    assert column(USER_COLUMNS, "created_at") == "toDateTime64(ingested_at, 3, 'UTC')"


def test_the_plane_leaves_room_above_itself():
    """Every projected version is below the band reserved for deleting one.

    Without this a projected row is immortal — its version is a function of the
    event that made it, so nothing outside the projection can bid higher. The
    first cut of this plane anchored at the top of the UInt64 and had to be
    deleted row by row to be corrected (`0222`).
    """
    highest_projected = BAND_IDENTIFIED * BAND + (BAND - 1)
    assert highest_projected < BAND_OVERRIDE * BAND
    assert str(BAND_OVERRIDE) == OVERRIDE_VERSION.split(" * ", 1)[0]
    # …and the whole space still fits the narrower of the two columns (Int64).
    assert (BAND_OVERRIDE + 1) * BAND - 1 < 2**63


def test_a_clock_can_never_carry_a_row_into_the_band_above_it():
    """The bands partition the space only if the clock stays inside one.

    `BAND - 1 - ms` exceeds BAND for any NEGATIVE ms, which would put an
    anonymous row in the identified band — so the clock is clamped at zero and
    the partition holds for every input, not just the expected ones.
    """
    assert INGESTED_MS.startswith("greatest(0, ")
    assert NOW_MS.startswith("greatest(0, ")


def test_a_tombstone_outranks_the_backfill_that_would_recreate_it():
    """Deleting a projected user has to survive the next re-projection."""
    for sql in (USER_TOMBSTONE_SQL(), USER_ALIAS_TOMBSTONE_SQL()):
        assert OVERRIDE_VERSION in sql
        assert "toInt8(1)" in sql  # is_deleted
    # Bound to one tenant, and by a bound parameter — never a formatted id.
    assert "team_id = %(team_id)s" in USER_TOMBSTONE_SQL()
    assert "team_id = %(team_id)s" in USER_ALIAS_TOMBSTONE_SQL()


def test_the_alias_predicate_reads_the_source_row_not_the_projection():
    """Regression guard for a view that could not be created at all.

    The alias projection writes a column called `person_id`, and ClickHouse
    resolves a WHERE against the SELECT's aliases BEFORE the table's columns.
    Unqualified, `person_id != ''` compares the projected UUID to a string and
    the whole view fails with CANNOT_PARSE_UUID.
    """
    sql = USER_ALIAS_SELECT_SQL()
    where = sql.split("WHERE", 1)[1]
    assert "e.person_id != ''" in where
    assert " person_id != ''" not in where


def test_the_alias_never_points_a_user_at_themselves():
    """An alias is only a fact when there are two DIFFERENT ids to join."""
    where = USER_ALIAS_SELECT_SQL().split("WHERE", 1)[1]
    assert "e.anonymous_id != ''" in where
    assert "e.anonymous_id != e.person_id" in where


def test_first_seen_wins_for_the_user_and_last_write_wins_for_the_alias():
    """Opposite directions within a band, because they answer opposite questions.

    A ReplacingMergeTree keeps the LARGEST version. `created_at` means first
    seen, so the user's clock must DECREASE with time; an alias belongs to
    whoever signed in last, so its clock must INCREASE.
    """
    assert f"({BAND} - 1 - {INGESTED_MS})" in column(USER_COLUMNS, "version")
    alias = column(USER_ALIAS_COLUMNS, "version")
    assert alias.endswith(f"+ {INGESTED_MS})")
    assert f"({BAND} - 1 -" not in alias


def test_each_version_is_typed_for_the_column_it_lands_in():
    """`person.version` is UInt64; `person_distinct_id_overrides.version` is
    Int64. Neither insert may rely on a coercion."""
    assert column(USER_COLUMNS, "version").startswith("toUInt64(")
    assert column(USER_ALIAS_COLUMNS, "version").startswith("toInt64(")


def test_the_backfill_writes_exactly_what_the_view_writes():
    """Same projection, same columns, in the same order — so a re-run collapses
    into the rows the view already wrote instead of landing beside them."""
    for backfill, select, columns in (
        (USER_BACKFILL_SQL, USER_SELECT_SQL, USER_COLUMNS),
        (USER_ALIAS_BACKFILL_SQL, USER_ALIAS_SELECT_SQL, USER_ALIAS_COLUMNS),
    ):
        names = ", ".join(name for name, _ in columns())
        assert f"({names})" in backfill()
        assert select() in backfill()


def test_the_views_target_the_write_side_tables():
    """Never the local tables — the same write path the fork's own views use."""
    assert "`insights`.`writable_person`" in USER_MV_SQL()
    assert "`insights`.`writable_person_distinct_id_overrides`" in USER_ALIAS_MV_SQL()
