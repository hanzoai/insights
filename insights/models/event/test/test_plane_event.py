"""The invariants the event projection is only correct because of.

The plane and the fork name the same fact differently, and nothing in the SQL
text says so. These pin the translation, because the failure it prevents is
silent: rows land, counts read zero, and no error is raised anywhere.
"""

from insights.models.event.plane import (
    EVENT_COLUMNS,
    EVENT_NAME_SQL,
    EVENT_SELECT_SQL,
    EVENT_SIGNAL_SQL,
    ORIGINAL_NAME_SQL,
    PROPERTY_COLUMN,
    RESERVED_KIND,
    USER_ALIAS_SELECT_SQL,
    USER_SELECT_SQL,
)

# The routing these cases are about. The builders are pure, so a test that asserts
# a projection's text names its own input rather than reading the app's records.
ROUTING = {"hanzo": 1}


def column(columns, name):
    return dict(columns())[name]


def test_a_page_is_named_the_way_every_lens_reads_it():
    """Web analytics, `sessions_mv.pageview_count` and `raw_sessions_v3_mv`
    all key on the literal `$pageview`. A projection that publishes the
    surface's own name publishes rows none of them can find.
    """
    event = dict(EVENT_COLUMNS(ROUTING, historical=False))["event"]
    for kind, reserved in RESERVED_KIND.items():
        assert f"kind = '{kind}', '{reserved}'" in event


def test_the_map_is_keyed_on_kind_not_on_the_name():
    """`kind` is the plane's closed vocabulary; a name is open. Keying on the
    name would leave a surface that invents `docs_page_viewed` uncounted.
    """
    assert EVENT_NAME_SQL.startswith("multiIf(kind = ")
    assert "name = " not in EVENT_NAME_SQL


def test_an_event_that_already_arrived_reserved_keeps_its_name():
    """multiIf's fallback is the name itself, so the back-map is a rename of
    the kinds it lists and a passthrough of everything else.
    """
    assert EVENT_NAME_SQL.endswith(", name)")


def test_the_surface_name_survives_the_rename():
    """`$pageview` says WHICH KIND of fact this is; it cannot also say what
    the surface called it. Renaming without preserving would make
    `page_viewed` and `docs_page_viewed` the same row to every breakdown.
    """
    assert PROPERTY_COLUMN["$event_name"] == ORIGINAL_NAME_SQL
    for kind in RESERVED_KIND:
        assert f"'{kind}'" in ORIGINAL_NAME_SQL
    for reserved in RESERVED_KIND.values():
        assert f"'{reserved}'" in ORIGINAL_NAME_SQL


def test_nothing_is_preserved_when_nothing_was_renamed():
    """An event that arrived as its reserved name has no original to keep, and
    `text_json` drops the empty string rather than writing `$event_name: ''`.
    """
    assert ORIGINAL_NAME_SQL.endswith(", name, '')")
    assert "NOT (name IN (" in ORIGINAL_NAME_SQL


def test_the_projection_reads_the_plane_and_names_its_signal():
    """The one source, and the one predicate.

    A view pointed at the retired `hanzo.events` compiles, runs, and delivers
    nothing — which is how this feed went dry. The plane is now ONE table, so
    naming it is no longer enough: without `signal = 'act'` this view would
    publish every log line, span, error and replay clip into the product-event
    stream, and `user_mv` would mint a person for each of them.
    """
    sql = EVENT_SELECT_SQL(ROUTING, historical=False)
    # The WHERE is the signal AND the routing gate: which sort of fact, and whose.
    assert sql.endswith("FROM event.fact\nWHERE signal = 'act' AND org IN ('hanzo')")


def test_every_projection_of_the_plane_names_its_signal():
    """All three views read the same table, so all three must scope it. The
    predicate is composed from one place precisely so a fourth cannot forget it.
    """
    for sql in (
        EVENT_SELECT_SQL(ROUTING, historical=False),
        EVENT_SELECT_SQL(ROUTING, historical=True),
        USER_SELECT_SQL(ROUTING),
        USER_ALIAS_SELECT_SQL(ROUTING),
    ):
        assert "FROM event.fact" in sql, sql
        assert EVENT_SIGNAL_SQL in sql, sql
