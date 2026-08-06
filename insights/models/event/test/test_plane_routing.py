"""The invariants that keep one org's events out of another org's project.

The tenant is the ORG; `team_id` is the fork's physical column and cannot be
renamed without rebuilding `sharded_events`, so the two words meet at a boundary
in `plane.py`. These pin both halves of that boundary: that an org the app has
provisioned reaches its own project, and that everything else reaches NO project
— not a shared one, and not a default.
"""

import insights.models.event.plane as plane
from insights.models.event.plane import (
    EVENT_COLUMNS,
    EVENT_SELECT_SQL,
    PROJECT_SQL,
    ROUTED_SQL,
    UNROUTABLE_PROJECT,
    USER_ALIAS_COLUMNS,
    USER_ALIAS_SELECT_SQL,
    USER_COLUMNS,
    USER_SELECT_SQL,
)

# The live routing on insights.hanzo.ai: one Insights org, one project.
LIVE = {"hanzo": 1}

# Two orgs, so a case can tell "routed to its own" from "routed at all".
TWO = {"hanzo": 1, "maxpower": 7}


def projections(routing):
    return (
        EVENT_COLUMNS(routing, historical=False),
        EVENT_COLUMNS(routing, historical=True),
        USER_COLUMNS(routing),
        USER_ALIAS_COLUMNS(routing),
    )


def selects(routing):
    return (
        EVENT_SELECT_SQL(routing, historical=False),
        EVENT_SELECT_SQL(routing, historical=True),
        USER_SELECT_SQL(routing),
        USER_ALIAS_SELECT_SQL(routing),
    )


def test_each_org_reaches_its_own_project():
    assert PROJECT_SQL(TWO) == "multiIf(org = 'hanzo', toInt64(1), org = 'maxpower', toInt64(7), toInt64(0))"


def test_every_projection_routes_the_same_way():
    """Events and the users they belong to must agree about whose project they
    are in, or a project reads events attributed to users it cannot see.
    """
    for columns in projections(TWO):
        assert dict(columns)["team_id"] == PROJECT_SQL(TWO)


def test_every_projection_is_gated_by_the_same_orgs():
    """The gate is what makes the default unreachable. A view that projected
    without it would fall through to `UNROUTABLE_PROJECT` for every org the app
    has not provisioned — which is the shared bucket, back again.
    """
    for select in selects(TWO):
        assert ROUTED_SQL(TWO) in select or ROUTED_SQL(TWO, "e.") in select


def test_the_gate_admits_exactly_the_orgs_the_projection_has_a_branch_for():
    """Gate and projection are two spellings of one set, so they are checked
    against each other rather than each against a literal.
    """
    for org, project in TWO.items():
        assert f"'{org}'" in ROUTED_SQL(TWO)
        assert f"org = '{org}', toInt64({project})" in PROJECT_SQL(TWO)
    assert "$public" not in ROUTED_SQL(TWO)
    assert "$public" not in PROJECT_SQL(TWO)


def test_an_unprovisioned_org_is_not_projected_at_all():
    """`$public` carries ~94% of the plane and owns no project. It must not
    reach a project — not project 1, which belongs to a customer, and not a
    default bucket shared with `admin` and `maxpower`, which is where routing
    everything unmatched to 0 left it.
    """
    for select in selects(LIVE):
        assert "$public" not in select
        assert "org IN ('hanzo')" in select


def test_an_empty_routing_projects_nothing_rather_than_failing_to_parse():
    """A deployment that has provisioned no project routes nothing. `IN ()` is
    a syntax error, so the gate says `0` — the view is created and admits no
    row, instead of the migration failing.
    """
    assert ROUTED_SQL({}) == "0"
    for select in selects({}):
        assert " AND 0" in select


def test_the_unreachable_default_is_a_project_nobody_can_read():
    """`multiIf` needs a final branch and the gate makes it unreachable. It is
    0 because `insights_team_id_seq` starts at 1, so a gate/projection
    disagreement would make rows invisible rather than someone else's.
    """
    assert UNROUTABLE_PROJECT == 0
    assert PROJECT_SQL(TWO).endswith(f"toInt64({UNROUTABLE_PROJECT}))")
    assert PROJECT_SQL({}) == f"multiIf(toInt64({UNROUTABLE_PROJECT}))"


def test_there_is_no_routing_table():
    """The mapping lives at rest in the app's org records and nowhere else. A
    warehouse copy is a second opinion about a fact the app already holds, and
    the disagreement is what routed a funded org into Hanzo's project.
    """
    source = "".join(selects(TWO))
    assert "org_team" not in source
    assert "FINAL" not in source
    assert not any(name.startswith("ORG_PROJECT") for name in vars(plane))


def test_this_file_names_no_orgs():
    """The routing is DERIVED. A list of orgs in `plane.py` is a second author
    of the same fact, whatever it is spelled with.
    """
    for org in ("hanzo", "maxpower", "admin", "$public"):
        assert not any(
            org in value for name, value in vars(plane).items() if isinstance(value, str) and not name.startswith("__")
        ), f"{org} is named in plane.py"
