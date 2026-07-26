"""Projection of the unified Hanzo event stream onto the Insights event schema.

Hanzo Cloud writes every product's events into ONE table on the ONE warehouse:
`hanzo.events` on the Hanzo Datastore (POST /v1/event, /v1/analytics,
/v1/insights/e, /v1/ingest all land there). It is a plain MergeTree, so a
materialized view over it fires on every insert — the unified stream reaches
Insights with no second capture tier, no queue and no extra process.

`cloud_events_mv` writes through `writable_events`, the same Distributed
write-side table the fork's own event views target (`events_json_mv`,
`events_recent_json_mv`), so rows are sharded by `sipHash64(distinct_id)`
exactly like natively captured events.

Prerequisite: `hanzo.events` must exist. Cloud owns that table; this module
only reads it, and deliberately does not declare it.
"""

from insights.datastore.table_engines import ReplacingMergeTree, ReplicationScheme
from insights.settings.data_stores import DATASTORE_DATABASE

from .sql import WRITABLE_EVENTS_DATA_TABLE

CLOUD_EVENTS_TABLE = "hanzo.events"
CLOUD_EVENTS_MV = "cloud_events_mv"

# tenant -> team. Every tenant on the unified stream that is not listed here
# lands in ROOT_TEAM, so no event is ever dropped. Routing a tenant to another
# team is an INSERT into this table, never an edit to this file.
TENANT_TEAM_TABLE = "tenant_team"
ROOT_TEAM = 1
TENANT_TEAM = [("hanzo", 1), ("maxpower", 1), ("admin", 1)]

EMPTY_JSON = "'{}'"

# Flat columns of the unified stream, keyed by the property the Insights UI
# reads. The `$` keys are what populate the URL / SCREEN and LIBRARY columns of
# the event explorer.
PROPERTY_TEXT = {
    "$current_url": "url",
    "$pathname": "path",
    "$referrer": "referrer",
    "$referring_domain": "referrer_domain",
    "$session_id": "session_id",
    "$lib": "library",
    "$lib_version": "library_version",
    "utm_source": "utm_source",
    "utm_medium": "utm_medium",
    "utm_campaign": "utm_campaign",
    "utm_term": "utm_term",
    "utm_content": "utm_content",
    "tenant": "tenant_id",
    "product": "product",
    "event_type": "event_type",
    "channel": "channel",
    "ref_code": "ref_code",
    "group_id": "group_id",
    "product_id": "product_id",
    "currency": "currency",
    "signup_week": "signup_week",
}

PROPERTY_NUMBER = {
    "quantity": "toFloat64(quantity)",
    "revenue": "revenue",
}


def literal(properties: dict[str, str]) -> str:
    return "map(" + ", ".join(f"'{key}', {column}" for key, column in properties.items()) + ")"


# The stream's own `properties` is the SDK payload and wins; the flat columns
# fill the keys it does not carry. `toJSONString` escapes, so quotes and
# backslashes in a URL cannot break the document, and `isValidJSON` keeps a
# malformed payload from throwing — an exception here would fail Cloud's INSERT.
PROPERTIES_SQL = (
    "JSONMergePatch("
    f"toJSONString(mapFilter((k, v) -> v != 0, {literal(PROPERTY_NUMBER)})), "
    f"toJSONString(mapFilter((k, v) -> v != '', {literal(PROPERTY_TEXT)})), "
    f"if(isValidJSON(properties), properties, {EMPTY_JSON}))"
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
TENANT_TEAM_SQL = f"SELECT tenant, team FROM `{DATASTORE_DATABASE}`.`{TENANT_TEAM_TABLE}` FINAL ORDER BY tenant"
TEAM_SQL = (
    "transform(tenant_id"
    f", (SELECT groupArray(tenant) FROM ({TENANT_TEAM_SQL}))"
    f", (SELECT groupArray(team) FROM ({TENANT_TEAM_SQL}))"
    f", toInt64({ROOT_TEAM}))"
)


def CLOUD_EVENTS_COLUMNS(historical: bool) -> list[tuple[str, str]]:
    return [
        ("uuid", UUID_SQL),
        ("event", "event"),
        ("properties", PROPERTIES_SQL),
        ("timestamp", "toDateTime64(timestamp, 6, 'UTC')"),
        ("team_id", TEAM_SQL),
        ("distinct_id", DISTINCT_SQL),
        ("elements_chain", "''"),
        ("created_at", "toDateTime64(ingested_at, 6, 'UTC')"),
        ("person_id", PERSON_SQL),
        # The stream carries no person profile, so person properties are read
        # from the person tables rather than off the event.
        ("person_mode", "'propertyless'"),
        ("historical_migration", "true" if historical else "false"),
    ]


def CLOUD_EVENTS_SELECT_SQL(historical: bool) -> str:
    projection = ",\n    ".join(f"{expression} AS {name}" for name, expression in CLOUD_EVENTS_COLUMNS(historical))
    return f"SELECT\n    {projection}\nFROM {CLOUD_EVENTS_TABLE}"


def TENANT_TEAM_TABLE_SQL() -> str:
    return f"""
CREATE TABLE IF NOT EXISTS `{DATASTORE_DATABASE}`.`{TENANT_TEAM_TABLE}` (
    tenant String,
    team Int64,
    version UInt32 DEFAULT toUnixTimestamp(now())
) ENGINE = {ReplacingMergeTree(TENANT_TEAM_TABLE, ver="version", replication_scheme=ReplicationScheme.REPLICATED)}
ORDER BY tenant
"""


def TENANT_TEAM_DATA_SQL(rows: list[tuple[str, int]] = TENANT_TEAM) -> str:
    values = ", ".join(f"('{tenant}', {team})" for tenant, team in rows)
    return f"INSERT INTO `{DATASTORE_DATABASE}`.`{TENANT_TEAM_TABLE}` (tenant, team) VALUES {values}"


def CLOUD_EVENTS_MV_SQL() -> str:
    return f"""
CREATE MATERIALIZED VIEW IF NOT EXISTS `{DATASTORE_DATABASE}`.`{CLOUD_EVENTS_MV}`
TO `{DATASTORE_DATABASE}`.`{WRITABLE_EVENTS_DATA_TABLE()}`
AS {CLOUD_EVENTS_SELECT_SQL(historical=False)}
"""


def DROP_CLOUD_EVENTS_MV_SQL() -> str:
    return f"DROP TABLE IF EXISTS `{DATASTORE_DATABASE}`.`{CLOUD_EVENTS_MV}`"


def CLOUD_EVENTS_BACKFILL_SQL() -> str:
    # INSERT ... SELECT binds by position, so the column list is explicit.
    names = ", ".join(name for name, _ in CLOUD_EVENTS_COLUMNS(historical=True))
    return f"""
INSERT INTO `{DATASTORE_DATABASE}`.`{WRITABLE_EVENTS_DATA_TABLE()}` ({names})
{CLOUD_EVENTS_SELECT_SQL(historical=True)}
"""
