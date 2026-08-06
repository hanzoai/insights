from pydantic import Field

from insights.insightsql.constants import InsightsQLQuerySettings
from insights.insightsql.database.models import (
    DatabaseField,
    DateTimeDatabaseField,
    FieldOrTable,
    IntegerDatabaseField,
    StringArrayDatabaseField,
    StringDatabaseField,
    Table,
)

from insights.datastore.preaggregation.sql import DISTRIBUTED_PREAGGREGATION_RESULTS_TABLE


class PreaggregationResultsTable(Table):
    """
    InsightsQL schema for the sharded_preaggregation_results table.
    Used for on-demand preaggregation of queries like uniqExact(person_id) GROUP BY day.
    """

    description: str = (
        "Internal table holding on-demand preaggregated query results (e.g. uniqExact(person_id) grouped by day), "
        "stored as aggregate-function state for cheap re-querying."
    )
    top_level_settings: InsightsQLQuerySettings | None = Field(
        default_factory=lambda: InsightsQLQuerySettings(load_balancing="in_order")
    )

    fields: dict[str, FieldOrTable] = {
        "team_id": IntegerDatabaseField(name="team_id"),
        "job_id": StringDatabaseField(
            name="job_id", description="Identifier of the preaggregation job that produced this row."
        ),
        "time_window_start": DateTimeDatabaseField(
            name="time_window_start", description="Start of the time bucket this aggregate covers (UTC)."
        ),
        "breakdown_value": StringArrayDatabaseField(
            name="breakdown_value", description="Breakdown dimension values for this aggregated bucket."
        ),
        # Aggregate state column - using generic DatabaseField since it's an AggregateFunction type
        "uniq_exact_state": DatabaseField(
            name="uniq_exact_state",
            description="AggregateFunction state for uniqExact; finalize with uniqExactMerge() to get the exact distinct count.",
        ),
    }

    def to_printed_datastore(self, context):
        return DISTRIBUTED_PREAGGREGATION_RESULTS_TABLE()

    def to_printed_insightsql(self):
        return "preaggregation_results"
