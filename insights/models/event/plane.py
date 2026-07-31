"""Projection of the Hanzo event plane onto the Insights event schema.

An event is the fact; a message is the container it travels in. Every product's
facts land in ONE place on the ONE warehouse — `event.event` on the Hanzo
Datastore — with an envelope that is identical across `event.event`,
`event.error`, `event.log` and `event.span`. It is a plain MergeTree family
table, so a materialized view over it fires on every insert: the unified stream
reaches Insights with no second capture tier, no queue and no extra process.

`event_mv` writes through `writable_events`, the same Distributed write-side
table the fork's own event views target (`events_json_mv`,
`events_recent_json_mv`), so rows are sharded by `sipHash64(distinct_id)`
exactly like natively captured events.

The envelope carries the columns Insights reads as first-class values — `org`,
`time`, `name`, `kind`, `product`, `session_id`, `distinct_id`, `person_id`,
`url`, `path` — and everything else in one `attributes` map, so the projection
below is a rename plus a JSON merge, not a translation layer.

Prerequisite: `event.event` must exist. Cloud owns the write path into it; this
module only reads it, and deliberately does not declare it.
"""

from insights.datastore.table_engines import ReplacingMergeTree, ReplicationScheme
from insights.settings.data_stores import DATASTORE_DATABASE

from .sql import WRITABLE_EVENTS_DATA_TABLE

EVENT_TABLE = "event.event"
EVENT_MV = "event_mv"

# org -> team. Every org on the plane that is not listed here lands in
# UNATTRIBUTED_TEAM, so no event is ever dropped. Routing an org to another team
# is an INSERT into this table, never an edit to this file.
ORG_TEAM_TABLE = "org_team"

# Traffic that belongs to no provisioned tenant: the anonymous `$public` org,
# and any org that has not been routed yet.
#
# Team ids are handed out by `insights_team_id_seq`, which starts at 1, so 0 is
# a team that cannot exist and therefore one no project can read. That is the
# point: an org is only ever readable once someone deliberately routes it, so a
# tenant that appears on the plane tomorrow cannot land in another tenant's
# project by default. Seeding this as a real team is what commingled ~95% of
# traffic — every anonymous pageview, plus every org nobody had mapped — into
# team 1, which belongs to an actual customer.
#
# Nothing is lost: the rows are in the warehouse with team_id 0, and routing
# them to a real project later is the same one INSERT as any other org.
UNATTRIBUTED_TEAM = 0
ROOT_TEAM = UNATTRIBUTED_TEAM

# Only orgs with a provisioned Insights team are routed to one. `admin` and
# `maxpower` are carried explicitly rather than dropped from the seed: this
# table keeps the newest row per org, so a mapping is corrected by writing over
# it, and leaving them out would leave their old rows pointing at team 1.
ORG_TEAM = [
    ("hanzo", 1),
    ("admin", UNATTRIBUTED_TEAM),
    ("maxpower", UNATTRIBUTED_TEAM),
    ("$public", UNATTRIBUTED_TEAM),
]

EMPTY_JSON = "'{}'"

# ── the five layers of `properties`, merged in this order ────────────────────
# JSONMergePatch takes the LAST writer of a key, so each block below overrides
# the one above it: the envelope's own columns are the most authoritative
# description of an event and are merged last.

# Envelope columns, keyed by the property the Insights UI reads. The `$` keys
# populate the URL / SESSION columns of the event explorer; `product`, `tenant`
# and `kind` are the plane's own dimensions and keep their own names.
PROPERTY_COLUMN = {
    "$current_url": "url",
    # The site an event happened on. Web analytics filters by `$host`, so
    # without it every Hanzo property reads as one undifferentiated site.
    # `domain` is total over any String and returns '' for a relative or empty
    # url, which `text_json` then drops.
    "$host": "domain(url)",
    "$pathname": "path",
    "$session_id": "session_id",
    "product": "product",
    "tenant": "org",
    "kind": "kind",
}

# Attributes that carry a well-known meaning get the `$` name the UI expects.
# Renamed rather than duplicated: the raw key is filtered out of the passthrough
# below, so a referrer appears exactly once, as `$referrer`.
PROPERTY_ATTRIBUTE = {
    "$referrer": "referrer",
    "$referring_domain": "referrer_domain",
    "$lib": "library",
    "$lib_version": "library_version",
}

# Attributes read as numbers. `toFloat64OrZero` is total over any String, so a
# malformed value reads 0 and is filtered out rather than throwing.
NUMBER_ATTRIBUTE = ["quantity", "revenue"]

# The @hanzo/observe AST annotation. `el` is a named Tuple, so each element is a
# real subcolumn and `el.role` reads exactly like a flat column. `$path` is the
# DOM ancestry joined into one string: a breakdown over an array explodes it
# into its elements, and the useful value is the whole path.
PROPERTY_EL = {
    "$el": "el.label",
    "$role": "el.role",
    "$testid": "el.testid",
    "$name": "el.name",
    "$component": "el.component",
    "$path": "arrayStringConcat(el.path, ' > ')",
}

# Keys the passthrough must not repeat, because a block above already named them.
CLAIMED_ATTRIBUTE = sorted(set(PROPERTY_ATTRIBUTE.values()) | set(NUMBER_ATTRIBUTE))


def literal(properties: dict[str, str]) -> str:
    return "map(" + ", ".join(f"'{key}', {column}" for key, column in properties.items()) + ")"


def text_json(properties: dict[str, str]) -> str:
    """A JSON document of the non-empty entries of `properties`."""
    return f"toJSONString(mapFilter((k, v) -> v != '', {literal(properties)}))"


NUMBER_JSON = (
    "toJSONString(mapFilter((k, v) -> v != 0, "
    + literal({key: f"toFloat64OrZero(attributes['{key}'])" for key in NUMBER_ATTRIBUTE})
    + "))"
)

CLAIMED_JSON = "[" + ", ".join(f"'{key}'" for key in CLAIMED_ATTRIBUTE) + "]"

ATTRIBUTE_JSON = f"toJSONString(mapFilter((k, v) -> v != '' AND NOT has({CLAIMED_JSON}, k), attributes))"

RENAMED_JSON = text_json({key: f"attributes['{value}']" for key, value in PROPERTY_ATTRIBUTE.items()})

PROPERTIES_SQL = (
    "JSONMergePatch("
    f"{NUMBER_JSON}, "
    f"{text_json(PROPERTY_EL)}, "
    f"{ATTRIBUTE_JSON}, "
    f"{RENAMED_JSON}, "
    f"{text_json(PROPERTY_COLUMN)})"
)

# MD5 is a total function over any String, so the uuid is deterministic: a
# replay or a re-run of the backfill produces the same key and the
# ReplacingMergeTree collapses it.
UUID_SQL = "reinterpretAsUUID(MD5(id))"
DISTINCT_SQL = "if(distinct_id != '', distinct_id, anonymous_id)"
PERSON_SQL = f"reinterpretAsUUID(MD5(if(person_id != '', person_id, {DISTINCT_SQL})))"

# Both arrays come from the identical subquery, so they are ordered alike and
# element i of one names element i of the other. An empty table yields empty
# arrays and `transform` returns the default, so the lookup cannot throw.
ORG_TEAM_SQL = f"SELECT org, team FROM `{DATASTORE_DATABASE}`.`{ORG_TEAM_TABLE}` FINAL ORDER BY org"
TEAM_SQL = (
    "transform(org"
    f", (SELECT groupArray(org) FROM ({ORG_TEAM_SQL}))"
    f", (SELECT groupArray(team) FROM ({ORG_TEAM_SQL}))"
    f", toInt64({ROOT_TEAM}))"
)


def EVENT_COLUMNS(historical: bool) -> list[tuple[str, str]]:
    return [
        ("uuid", UUID_SQL),
        ("event", "name"),
        ("properties", PROPERTIES_SQL),
        ("timestamp", "toDateTime64(time, 6, 'UTC')"),
        ("team_id", TEAM_SQL),
        ("distinct_id", DISTINCT_SQL),
        ("elements_chain", "''"),
        ("created_at", "toDateTime64(ingested_at, 6, 'UTC')"),
        ("person_id", PERSON_SQL),
        # The plane carries no person profile, so person properties are read
        # from the person tables rather than off the event.
        ("person_mode", "'propertyless'"),
        ("historical_migration", "true" if historical else "false"),
    ]


def EVENT_SELECT_SQL(historical: bool) -> str:
    projection = ",\n    ".join(f"{expression} AS {name}" for name, expression in EVENT_COLUMNS(historical))
    return f"SELECT\n    {projection}\nFROM {EVENT_TABLE}"


def ORG_TEAM_TABLE_SQL() -> str:
    return f"""
CREATE TABLE IF NOT EXISTS `{DATASTORE_DATABASE}`.`{ORG_TEAM_TABLE}` (
    org String,
    team Int64,
    version UInt32 DEFAULT toUnixTimestamp(now())
) ENGINE = {ReplacingMergeTree(ORG_TEAM_TABLE, ver="version", replication_scheme=ReplicationScheme.REPLICATED)}
ORDER BY org
"""


def ORG_TEAM_DATA_SQL(rows: list[tuple[str, int]] = ORG_TEAM) -> str:
    values = ", ".join(f"('{org}', {team})" for org, team in rows)
    return f"INSERT INTO `{DATASTORE_DATABASE}`.`{ORG_TEAM_TABLE}` (org, team) VALUES {values}"


def EVENT_MV_SQL() -> str:
    return f"""
CREATE MATERIALIZED VIEW IF NOT EXISTS `{DATASTORE_DATABASE}`.`{EVENT_MV}`
TO `{DATASTORE_DATABASE}`.`{WRITABLE_EVENTS_DATA_TABLE()}`
AS {EVENT_SELECT_SQL(historical=False)}
"""


def DROP_EVENT_MV_SQL() -> str:
    return f"DROP TABLE IF EXISTS `{DATASTORE_DATABASE}`.`{EVENT_MV}`"


def EVENT_BACKFILL_SQL() -> str:
    # INSERT ... SELECT binds by position, so the column list is explicit.
    names = ", ".join(name for name, _ in EVENT_COLUMNS(historical=True))
    return f"""
INSERT INTO `{DATASTORE_DATABASE}`.`{WRITABLE_EVENTS_DATA_TABLE()}` ({names})
{EVENT_SELECT_SQL(historical=True)}
"""
