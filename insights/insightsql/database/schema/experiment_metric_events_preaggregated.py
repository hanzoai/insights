from pydantic import Field

from insights.insightsql.constants import InsightsQLQuerySettings
from insights.insightsql.database.models import (
    DateTimeDatabaseField,
    FieldOrTable,
    FloatDatabaseField,
    IntegerDatabaseField,
    StringDatabaseField,
    Table,
)

from insights.datastore.preaggregation.experiment_metric_events_sql import DISTRIBUTED_EXPERIMENT_METRIC_EVENTS_TABLE


class ExperimentMetricEventsPreaggregatedTable(Table):
    description: str = (
        "Internal preaggregated table of experiment metric events, one row per metric-contributing event recording "
        "its numeric value and (for funnel metrics) the steps completed. Powers experiment results computation."
    )
    top_level_settings: InsightsQLQuerySettings | None = Field(
        default_factory=lambda: InsightsQLQuerySettings(load_balancing="in_order")
    )

    fields: dict[str, FieldOrTable] = {
        "team_id": IntegerDatabaseField(name="team_id"),
        "job_id": StringDatabaseField(
            name="job_id", description="Identifier of the preaggregation job that produced this row."
        ),
        "entity_id": StringDatabaseField(
            name="entity_id", description="Identifier of the entity (person or group) the metric event belongs to."
        ),
        "timestamp": DateTimeDatabaseField(name="timestamp", description="When the metric event occurred (UTC)."),
        "event_uuid": StringDatabaseField(
            name="event_uuid", description="UUID of the source event; join to `events.uuid`."
        ),
        "session_id": StringDatabaseField(
            name="session_id", description="Session in which the metric event occurred; join to `sessions`."
        ),
        "numeric_value": FloatDatabaseField(
            name="numeric_value", description="Numeric value the event contributes to the experiment metric."
        ),
        # steps is Array(UInt8) in Datastore but InsightsQL doesn't have a typed array field;
        # queries will use arrayElement() to access individual step indicators
        "steps": StringDatabaseField(
            name="steps",
            description="Per-step funnel completion indicators (Datastore Array(UInt8)); access individual steps with arrayElement().",
        ),
    }

    def to_printed_datastore(self, context):
        return DISTRIBUTED_EXPERIMENT_METRIC_EVENTS_TABLE()

    def to_printed_insightsql(self):
        return "experiment_metric_events_preaggregated"
