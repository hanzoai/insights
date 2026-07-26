from insights.insightsql.database.models import (
    DateTimeDatabaseField,
    FieldOrTable,
    IntegerDatabaseField,
    StringDatabaseField,
    Table,
    UUIDDatabaseField,
)


class CohortMembershipTable(Table):
    """Table tracking realtime cohort membership changes."""

    fields: dict[str, FieldOrTable] = {
        "team_id": IntegerDatabaseField(name="team_id", nullable=False),
        "cohort_id": IntegerDatabaseField(name="cohort_id", nullable=False),
        "person_id": UUIDDatabaseField(name="person_id", nullable=False),
        "status": StringDatabaseField(name="status", nullable=False),
        "last_updated": DateTimeDatabaseField(name="last_updated", nullable=False),
    }

    def to_printed_datastore(self, context):
        return "cohort_membership"

    def to_printed_insightsql(self):
        return "cohort_membership"
