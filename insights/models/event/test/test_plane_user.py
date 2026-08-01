"""The invariants the user projection is only correct because of.

Every assertion here pins a decision that is INVISIBLE in the SQL text unless
you already know why it is written that way — which is exactly the kind of
thing a later edit silently undoes.
"""

from insights.models.event.plane import (
    EVENT_COLUMNS,
    IDENTIFIED_SQL,
    USER_ALIAS_BACKFILL_SQL,
    USER_ALIAS_COLUMNS,
    USER_ALIAS_MV_SQL,
    USER_ALIAS_SELECT_SQL,
    USER_BACKFILL_SQL,
    USER_COLUMNS,
    USER_MV_SQL,
    USER_SELECT_SQL,
    USER_SQL,
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


def test_identified_cannot_contradict_the_key():
    """`is_identified` and the key are derived from ONE predicate.

    A key built from the IAM subject is always identified and a key built from
    the browser never is, so no later event can flip the flag on a merge. Two
    independent expressions could disagree; these cannot.
    """
    assert column(USER_COLUMNS, "is_identified") == f"toInt8({IDENTIFIED_SQL})"
    assert IDENTIFIED_SQL in USER_SQL


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
    """Opposite directions, because they answer opposite questions.

    A ReplacingMergeTree keeps the LARGEST version. `created_at` means first
    seen, so the user's version must DECREASE with time; an alias belongs to
    whoever signed in last, so its version must INCREASE.
    """
    assert column(USER_COLUMNS, "version") == "bitNot(toUInt64(toUnixTimestamp64Milli(time)))"
    assert column(USER_ALIAS_COLUMNS, "version") == "toInt64(toUnixTimestamp64Milli(time))"


def test_each_version_is_typed_for_the_column_it_lands_in():
    """`person.version` is UInt64; `person_distinct_id_overrides.version` is
    Int64. Neither insert may rely on a coercion."""
    assert column(USER_COLUMNS, "version").startswith("bitNot(toUInt64(")
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
