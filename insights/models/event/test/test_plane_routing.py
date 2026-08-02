"""The invariants that keep one org's events out of another org's project.

The tenant is the ORG; `team_id` is the fork's physical column and cannot be
renamed without rebuilding `sharded_events`, so the two words meet at a boundary
in `plane.py`. These pin both halves of that boundary: that the emitted SQL
still names the column the warehouse actually has, and that an org nobody has
routed lands somewhere nobody can read.
"""

from insights.models.event.plane import (
    EVENT_COLUMNS,
    ORG_PROJECT_COLUMN,
    ORG_PROJECT_SQL,
    ORG_PROJECT_TABLE,
    ORG_PROJECT_TABLE_SQL,
    PROJECT_SQL,
    UNATTRIBUTED_PROJECT,
    USER_ALIAS_COLUMNS,
    USER_COLUMNS,
)


def test_an_unrouted_org_lands_where_no_project_can_read():
    """Project ids come from `insights_team_id_seq`, which starts at 1, so 0 is
    an id the app cannot mint. Defaulting to a real one is what put ~89% of the
    plane into project 1, which belongs to a customer.
    """
    assert UNATTRIBUTED_PROJECT == 0
    assert PROJECT_SQL.endswith(f", toInt64({UNATTRIBUTED_PROJECT}))")


def test_every_projection_routes_the_same_way():
    """Events and the users they belong to must agree about whose project they
    are in, or a project reads events attributed to users it cannot see.
    """
    projections = (
        EVENT_COLUMNS(historical=False),
        EVENT_COLUMNS(historical=True),
        USER_COLUMNS(),
        USER_ALIAS_COLUMNS(),
    )
    for columns in projections:
        assert dict(columns)["team_id"] == PROJECT_SQL


def test_the_lookup_names_the_physical_column():
    """Our vocabulary lives in the NAMES in `plane.py`. Aliasing the column to
    `project` in the emitted text would describe a column the warehouse does
    not have, and would rewrite every view that embeds this expression — a
    migration and a recreate of the live plane, bought for nothing.
    """
    assert f"SELECT org, {ORG_PROJECT_COLUMN} FROM" in ORG_PROJECT_SQL
    assert "AS project" not in ORG_PROJECT_SQL
    assert f"groupArray({ORG_PROJECT_COLUMN})" in PROJECT_SQL


def test_the_forks_word_is_spelled_exactly_twice():
    """The table and its column. Anywhere else and the boundary has leaked."""
    source = ORG_PROJECT_TABLE_SQL() + PROJECT_SQL
    assert ORG_PROJECT_TABLE == "org_team"
    assert ORG_PROJECT_COLUMN == "team"
    assert f"`{ORG_PROJECT_TABLE}`" in ORG_PROJECT_SQL
    assert f"    {ORG_PROJECT_COLUMN} Int64," in ORG_PROJECT_TABLE_SQL()
    assert "project" not in source


def test_the_routing_reads_the_live_row_per_org():
    """`FINAL` is what makes a correction a correction. Without it the lookup
    can read a superseded mapping and route an org to a project it has already
    been moved off.
    """
    assert "FINAL" in ORG_PROJECT_SQL


def test_this_file_names_no_orgs():
    """The mapping is derived from the app's own org records by `route_orgs`.
    A list here is a second author of the same fact, and the disagreement is
    what routed a separate funded org into Hanzo's project.
    """
    import insights.models.event.plane as plane

    for org in ("hanzo", "maxpower", "admin", "$public"):
        assert not any(
            org in value for name, value in vars(plane).items() if isinstance(value, str) and not name.startswith("__")
        ), f"{org} is named in plane.py"
