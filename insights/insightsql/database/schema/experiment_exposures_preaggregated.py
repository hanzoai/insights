from pydantic import Field

from insights.insightsql.constants import InsightsQLQuerySettings
from insights.insightsql.database.models import (
    DateTimeDatabaseField,
    FieldOrTable,
    IntegerDatabaseField,
    StringArrayDatabaseField,
    StringDatabaseField,
    Table,
)

from insights.clickhouse.preaggregation.experiment_exposures_sql import DISTRIBUTED_EXPERIMENT_EXPOSURES_TABLE


class ExperimentExposuresPreaggregatedTable(Table):
    top_level_settings: InsightsQLQuerySettings | None = Field(
        default_factory=lambda: InsightsQLQuerySettings(load_balancing="in_order")
    )

    fields: dict[str, FieldOrTable] = {
        "team_id": IntegerDatabaseField(name="team_id"),
        "job_id": StringDatabaseField(name="job_id"),
        "entity_id": StringDatabaseField(name="entity_id"),
        "variant": StringDatabaseField(name="variant"),
        "first_exposure_time": DateTimeDatabaseField(name="first_exposure_time"),
        "last_exposure_time": DateTimeDatabaseField(name="last_exposure_time"),
        "exposure_event_uuid": StringDatabaseField(name="exposure_event_uuid"),
        "exposure_session_id": StringDatabaseField(name="exposure_session_id"),
        "breakdown_value": StringArrayDatabaseField(name="breakdown_value"),
    }

    def to_printed_clickhouse(self, context):
        return DISTRIBUTED_EXPERIMENT_EXPOSURES_TABLE()

    def to_printed_insightsql(self):
        return "experiment_exposures_preaggregated"
