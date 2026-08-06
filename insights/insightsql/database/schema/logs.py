from insights.insightsql.database.models import (
    DANGEROUS_NoTeamIdCheckTable,
    DateTimeDatabaseField,
    FieldOrTable,
    IntegerDatabaseField,
    MapStringDatabaseField,
    StringDatabaseField,
    StringJSONDatabaseField,
    Table,
)

from insights.datastore.routing import PROJECT_SQL
from insights.datastore.workload import Workload

# 50GB - limit for user-provided InsightsQL queries on log tables to prevent expensive full scans
INSIGHTSQL_MAX_BYTES_TO_READ_FOR_LOGS_USER_QUERIES = 50_000_000_000

# ── the log plane ────────────────────────────────────────────────────────────
#
# WHERE THE LOGS ARE. `event.log` is the live log plane — the same envelope
# `event.fact` carries, written through the same door, kept in its own table
# rather than discriminated by a `signal` column. It is where every log line
# actually lands.
#
# The fork's own `logs` table was never created here. `products/logs/backend/
# schema.sql` opens with `-- TODO: proper schema management and migrations` — it
# is a loose DDL file, not a migration, so nothing ever ran it and no `logs`,
# `log_attributes` or `logs_kafka_metrics` exists on the warehouse. Every read
# therefore failed with `Unknown table`, and the product's has-any-logs probe
# swallows that error and returns False, which is why a Logs product that is
# broken renders as the "you haven't sent any logs yet" onboarding screen rather
# than as an error.
#
# So the tables below bind the reader to the plane instead of standing a second
# copy of it up. There is deliberately no `insights.logs` table and no
# materialized view copying `event.log` into one: a projection is one home for
# the fact, and a copy that drifts is not a thing that can happen to it.
LOG_TABLE = "event.log"

# The fork's physical names, unchanged. They are not decoration:
# `to_printed_datastore()` is the key the property-group registry is looked up
# under (`insights/datastore/property_groups.py`, keyed on the literal
# `logs_distributed`), and it is also what qualifies every column the printer
# emits. Renaming them would silently unroute every attribute filter — matching
# no rows for `equals` and every row for `is not` — rather than failing loudly.
# So the names stay and only what they point AT changes.
LOG_ALIAS = "logs_distributed"
LOG_ATTRIBUTE_ALIAS = "log_attributes_distributed"
LOG_CHECKPOINT_ALIAS = "logs_kafka_metrics_distributed"

# The attribute maps the property-group registry rewrites filters into: a filter
# on `attributes['k']` is emitted as `attributes_map_str['k__str']`, so the
# suffix is part of the contract and the map has to carry it. Values on this
# plane are plain strings (the fork JSON-encoded them), so the numeric and date
# maps parse straight off the value and drop what does not parse, leaving a key
# absent rather than present-and-null.
LOG_ATTRIBUTE_MAP_SQL = {
    "attributes_map_str": "mapApply((k, v) -> (concat(k, '__str'), v), attributes)",
    "attributes_map_float": (
        "CAST(mapFilter((k, v) -> isNotNull(v),"
        " mapApply((k, v) -> (concat(k, '__float'), toFloat64OrNull(v)), attributes)),"
        " 'Map(String, Float64)')"
    ),
    "attributes_map_datetime": (
        "CAST(mapFilter((k, v) -> isNotNull(v),"
        " mapApply((k, v) -> (concat(k, '__datetime'), parseDateTimeBestEffortOrNull(v)), attributes)),"
        " 'Map(String, DateTime64)')"
    ),
}

# What the product reads, in the plane's own columns.
#
# `team_id` is the one that has to be a real column rather than a computed
# field: the printer injects the tenancy guard AFTER resolution, as a bare
# `team_id = <n>` naming the column literally, so an expression field would
# never be expanded there and the guard would look for a column that is not
# there. Projecting it here is what makes the mandatory guard both printable
# and true.
#
# It uses the SAME routing expression the event plane projects `team_id` with,
# so an org lands in one project across both planes by construction. An org
# nobody has routed transforms to project 0, which no team can be, so an
# unrouted tenant reads as empty rather than as somebody else's.
LOG_COLUMN = {
    "team_id": PROJECT_SQL,
    "uuid": "id",
    "timestamp": "time",
    "observed_timestamp": "ingested_at",
    # The plane's own half-hour bucket, already materialized on the row.
    "time_bucket": "toDateTime(ts_bucket_start)",
    "body": "body",
    # `message` aliases `body` in the schema above; `level` is read as its own
    # column, and on this plane it is what severity the line arrived with.
    "level": "severity_text",
    "attributes": "attributes",
    # ONE attributes map. The plane does not split resource attributes from log
    # attributes — a k8s namespace and a log's stream name sit in the same map —
    # so resource attributes read as empty here rather than being duplicated
    # under a second name they would then be free to disagree with.
    "resource_attributes": "CAST(map(), 'Map(LowCardinality(String), String)')",
    "resource_fingerprint": "resource",
    "service_name": "service",
    "severity_text": "severity_text",
    "severity_number": "severity_number",
    # The product decodes these as base64 (`hex(tryBase64Decode(trace_id))`) and
    # the plane stores them as hex, so the seam re-encodes rather than showing
    # every trace id in the UI as garbage. A value that is not valid hex encodes
    # to empty, which is what an absent trace should read as.
    "trace_id": "base64Encode(unhex(trace_id))",
    "span_id": "base64Encode(unhex(span_id))",
    "instrumentation_scope": "''",
    "event_name": "name",
    # The sparkline charts volume as `sum(_bytes_uncompressed)`. That is a
    # storage-level number the plane does not expose, so this is the log's own
    # payload size — the bytes the line actually carries — which is the quantity
    # the chart is asking about and reads only a column it already selects.
    "_bytes_uncompressed": "length(body)",
    # Declared on the table and read by nothing, but the SQL editor exposes this
    # table to users, so they resolve to what the plane actually has for them.
    "_part_starting_offset": "CAST(NULL, 'Nullable(UInt64)')",
    "_part_offset": "CAST(NULL, 'Nullable(UInt64)')",
    "mat_body_ipv4_matches": "CAST(NULL, 'Nullable(String)')",
    **LOG_ATTRIBUTE_MAP_SQL,
}

# The attribute index, counted off the plane instead of stored beside it.
#
# The fork fed this from a materialized view over its own logs table. Reading
# `event.log_attribute` instead is not open to us: it carries neither the counts
# nor the `service_name` / `resource_fingerprint` / `time_bucket` columns that
# `LogsFilterBuilder.where()` splices INTO this subquery from the logs side. And
# a view of our own writing would be the second copy this whole change exists to
# avoid. So it is derived on read, bounded by the 10-minute bucket every caller
# filters on.
LOG_ATTRIBUTE_COLUMN = {
    "team_id": PROJECT_SQL,
    "time_bucket": "toStartOfInterval(time, toIntervalMinute(10))",
    "service_name": "service",
    "severity_text": "severity_text",
    "resource_fingerprint": "resource",
    # One map means one kind. The plane carries no separate resource dimension,
    # so nothing here can honestly claim to be a resource attribute.
    "attribute_type": "'log'",
}

LOG_ATTRIBUTE_GROUP = [*LOG_ATTRIBUTE_COLUMN, "attribute_key", "attribute_value"]

# The live-tail watermark: how far the product can trust the tail to be complete.
#
# The fork read it off its Kafka consumer's per-partition lag. This plane has no
# staged ingest tier — a row is readable the moment the door writes it — so the
# watermark is simply now, and the one row here says exactly that. The shape
# (topic, partition, timestamp) is kept because the product groups by it.
LOG_CHECKPOINT_SELECT_SQL = "SELECT '' AS _topic, 0 AS _partition, now64(6) AS max_observed_timestamp"


def _projection(columns: dict[str, str]) -> str:
    return ",\n    ".join(f"{expression} AS {name}" for name, expression in columns.items())


def LOG_SELECT_SQL() -> str:
    return f"SELECT\n    {_projection(LOG_COLUMN)}\nFROM {LOG_TABLE}"


def LOG_ATTRIBUTE_SELECT_SQL() -> str:
    return (
        f"SELECT\n    {_projection(LOG_ATTRIBUTE_COLUMN)},\n"
        "    attribute.1 AS attribute_key,\n"
        "    attribute.2 AS attribute_value,\n"
        "    count() AS attribute_count\n"
        f"FROM {LOG_TABLE}\n"
        "ARRAY JOIN CAST(attributes, 'Array(Tuple(String, String))') AS attribute\n"
        f"GROUP BY {', '.join(LOG_ATTRIBUTE_GROUP)}"
    )


def _table_ref(select: str, alias: str, use_logical_alias: bool) -> str:
    """The plane, shaped like the table the product expects.

    Aliased to the name the printer qualifies columns with, and left bare when
    the caller is already aliasing it themselves.
    """
    return f"({select}) AS {alias}" if use_logical_alias else f"({select})"


class LogsTable(Table):
    description: str = "OpenTelemetry-style log records ingested into the logs product, one row per log line."
    workload: Workload | None = Workload.LOGS

    fields: dict[str, FieldOrTable] = {
        "uuid": StringDatabaseField(name="uuid", nullable=False, description="Unique identifier of this log record."),
        "team_id": IntegerDatabaseField(name="team_id", nullable=False),
        "trace_id": StringDatabaseField(
            name="trace_id",
            nullable=False,
            description="Trace this log belongs to; join to `trace_spans` on `trace_id`.",
        ),
        "span_id": StringDatabaseField(
            name="span_id", nullable=False, description="Span this log was emitted within; join to `trace_spans`."
        ),
        "message": StringDatabaseField(
            name="body", nullable=False, description="The log message text; alias of `body`."
        ),
        "body": StringDatabaseField(name="body", nullable=False, description="The raw log message text."),
        "attributes": MapStringDatabaseField(
            name="attributes", nullable=False, description="Per-record OpenTelemetry log attributes as a string map."
        ),
        "time_bucket": DateTimeDatabaseField(
            name="time_bucket", nullable=False, description="Coarse time bucket used for partitioning and filtering."
        ),
        "timestamp": DateTimeDatabaseField(
            name="timestamp", nullable=False, description="When the log event occurred (event timestamp)."
        ),
        "observed_timestamp": DateTimeDatabaseField(
            name="observed_timestamp",
            nullable=False,
            description="When the collector observed/ingested the log; differs from `timestamp`.",
        ),
        "severity_text": StringDatabaseField(
            name="severity_text", nullable=False, description="OpenTelemetry severity text, e.g. 'INFO', 'ERROR'."
        ),
        "severity_number": IntegerDatabaseField(
            name="severity_number",
            nullable=False,
            description="OpenTelemetry numeric severity (1-24, higher is more severe).",
        ),
        "level": StringDatabaseField(
            name="level", nullable=False, description="Normalized log level, e.g. 'info', 'warn', 'error'."
        ),
        "resource_attributes": MapStringDatabaseField(
            name="resource_attributes",
            nullable=False,
            description="OpenTelemetry resource attributes (the emitting service/host) as a string map.",
        ),
        "resource_fingerprint": IntegerDatabaseField(
            name="resource_fingerprint",
            nullable=False,
            description="Hash of the resource attributes, used to deduplicate/group resources.",
        ),
        "instrumentation_scope": StringDatabaseField(
            name="instrumentation_scope",
            nullable=False,
            description="OpenTelemetry instrumentation scope (library/module that emitted the log).",
        ),
        "event_name": StringDatabaseField(
            name="event_name", nullable=False, description="OpenTelemetry log event name, when set."
        ),
        "service_name": StringDatabaseField(
            name="service_name", nullable=False, description="Name of the service that emitted the log."
        ),
        # internal fields for query optimization
        # Physical type-suffixed backing map of `attributes`. A bare arrayElement() on it reads only
        # the serialization bucket holding the key; membership guards (has/mapContains) force reading
        # every key bucket, so internal hot paths grouping on one attribute use this directly.
        "attributes_map_str": MapStringDatabaseField(name="attributes_map_str", nullable=False, hidden=True),
        "_part_starting_offset": IntegerDatabaseField(name="_part_starting_offset", nullable=True, hidden=True),
        "_part_offset": IntegerDatabaseField(name="_part_offset", nullable=True, hidden=True),
        "_bytes_uncompressed": IntegerDatabaseField(name="_bytes_uncompressed", nullable=True, hidden=True),
        "mat_body_ipv4_matches": StringJSONDatabaseField(name="mat_body_ipv4_matches", nullable=True, hidden=True),
    }

    def to_printed_datastore(self, context):
        return LOG_ALIAS

    def to_printed_datastore_table_ref(self, context, use_logical_alias=True):
        return _table_ref(LOG_SELECT_SQL(), LOG_ALIAS, use_logical_alias)

    def to_printed_insightsql(self):
        return "logs"


class LogAttributesTable(Table):
    description: str = "Distinct log attribute key/value pairs with occurrence counts, used to power log attribute autocomplete and faceting."
    workload: Workload | None = Workload.LOGS
    fields: dict[str, FieldOrTable] = {
        "team_id": IntegerDatabaseField(name="team_id", nullable=False),
        "time_bucket": DateTimeDatabaseField(
            name="time_bucket",
            nullable=False,
            description="Coarse time bucket the attribute counts are aggregated over.",
        ),
        "attribute_key": StringDatabaseField(name="attribute_key", nullable=False, description="Log attribute name."),
        "attribute_value": StringDatabaseField(
            name="attribute_value", nullable=False, description="Observed value for the attribute key."
        ),
        "attribute_type": StringDatabaseField(
            name="attribute_type",
            nullable=False,
            description="Where the attribute came from (e.g. resource vs log attribute).",
        ),
        "attribute_count": IntegerDatabaseField(
            name="attribute_count", nullable=False, description="Number of logs with this key/value in the time bucket."
        ),
        "resource_fingerprint": IntegerDatabaseField(
            name="resource_fingerprint",
            nullable=False,
            description="Hash of the resource attributes the count is scoped to.",
        ),
        "service_name": StringDatabaseField(
            name="service_name", nullable=False, description="Service the attribute counts are scoped to."
        ),
        "severity_text": StringDatabaseField(
            name="severity_text",
            nullable=False,
            description="OpenTelemetry severity text the attribute counts are scoped to, e.g. 'INFO', 'ERROR'.",
        ),
    }

    def to_printed_datastore(self, context):
        return LOG_ATTRIBUTE_ALIAS

    def to_printed_datastore_table_ref(self, context, use_logical_alias=True):
        return _table_ref(LOG_ATTRIBUTE_SELECT_SQL(), LOG_ATTRIBUTE_ALIAS, use_logical_alias)

    def to_printed_insightsql(self):
        return "log_attributes"


class LogsKafkaMetricsTable(DANGEROUS_NoTeamIdCheckTable):
    """
    Table stores meta information about kafka consumption _not_ scoped to teams

    This is so we can find out the overall lag per partition and filter live logs accordingly
    """

    description: str = "Per-partition Kafka consumption metadata for the logs ingestion topic; not scoped to teams, used to track ingestion lag."
    workload: Workload | None = Workload.LOGS
    fields: dict[str, FieldOrTable] = {
        "_partition": IntegerDatabaseField(name="_partition", nullable=False),
        "_topic": StringDatabaseField(name="_topic", nullable=False),
        "max_observed_timestamp": DateTimeDatabaseField(
            name="max_observed_timestamp",
            nullable=False,
            description="Latest observed timestamp consumed from this partition; used to compute ingestion lag.",
        ),
    }

    def to_printed_datastore(self, context):
        return LOG_CHECKPOINT_ALIAS

    def to_printed_datastore_table_ref(self, context, use_logical_alias=True):
        return _table_ref(LOG_CHECKPOINT_SELECT_SQL, LOG_CHECKPOINT_ALIAS, use_logical_alias)

    def to_printed_insightsql(self):
        return "logs_kafka_metrics"
