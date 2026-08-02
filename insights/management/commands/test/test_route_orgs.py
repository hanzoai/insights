"""What re-deriving the projections is allowed to decide.

The command has no judgement of its own any more, and that is the point: it used
to hold a `changes` diff — which org to rewrite, which to unattribute, which to
leave — and every one of those decisions was a chance to be half-right about a
mapping the app already knew in full. It now reads the records and rebuilds the
three views from them, so the only thing to pin is that it rebuilds ALL of them,
from ONE mapping, and that the SQL it would run routes each org to its own.
"""

from insights.management.commands.route_orgs import PROJECTIONS
from insights.models.event.plane import (
    DROP_EVENT_MV_SQL,
    DROP_USER_ALIAS_MV_SQL,
    DROP_USER_MV_SQL,
    EVENT_MV,
    EVENT_MV_SQL,
    USER_ALIAS_MV,
    USER_ALIAS_MV_SQL,
    USER_MV,
    USER_MV_SQL,
)

TWO = {"hanzo": 1, "maxpower": 7}


def test_all_three_projections_are_re_derived_together():
    """They read one source and must agree about whose project a row is in. A
    command that rebuilt the events view alone would leave the user views
    routing by yesterday's answer, and a project would read events attributed to
    users it cannot see.
    """
    assert PROJECTIONS == (
        (DROP_EVENT_MV_SQL, EVENT_MV_SQL),
        (DROP_USER_MV_SQL, USER_MV_SQL),
        (DROP_USER_ALIAS_MV_SQL, USER_ALIAS_MV_SQL),
    )


def test_each_projection_is_dropped_before_it_is_created():
    """`CREATE MATERIALIZED VIEW IF NOT EXISTS` over a live view is a no-op, so
    without the drop the command would report success and change nothing — which
    is exactly how `0220`'s corrected default sat unapplied for days.
    """
    for drop, create in PROJECTIONS:
        assert drop().startswith("DROP TABLE IF EXISTS")
        assert "CREATE MATERIALIZED VIEW IF NOT EXISTS" in create(TWO)


def test_a_projection_drops_and_creates_the_same_view():
    for (drop, create), name in zip(PROJECTIONS, (EVENT_MV, USER_MV, USER_ALIAS_MV)):
        assert f"`{name}`" in drop()
        assert f"`{name}`" in create(TWO)


def test_every_re_derived_view_carries_the_same_routing():
    """One mapping, three views. The command reads the records once and hands
    the same answer to each, so they cannot disagree even for the length of a
    run.
    """
    for _, create in PROJECTIONS:
        sql = create(TWO)
        assert "org IN ('hanzo', 'maxpower')" in sql
        assert "org = 'hanzo', toInt64(1)" in sql
        assert "org = 'maxpower', toInt64(7)" in sql


def test_an_unprovisioned_org_is_in_no_view():
    """`$public` owns no project. It is not routed, not defaulted, and not
    named — it simply is not projected.
    """
    for _, create in PROJECTIONS:
        assert "$public" not in create({"hanzo": 1})


def test_no_view_reads_a_routing_table():
    for _, create in PROJECTIONS:
        assert "org_team" not in create(TWO)
