from typing import Optional

from insights.insightsql.database.models import (
    DANGEROUS_NoTeamIdCheckTable,
    FieldOrTable,
    FunctionCallTable,
    IntegerDatabaseField,
)

NUMBERS_TABLE_FIELDS: dict[str, FieldOrTable] = {
    "number": IntegerDatabaseField(name="number", nullable=False),
}


class NumbersTable(FunctionCallTable, DANGEROUS_NoTeamIdCheckTable):
    fields: dict[str, FieldOrTable] = NUMBERS_TABLE_FIELDS

    name: str = "numbers"
    min_args: Optional[int] = 1
    max_args: Optional[int] = 2

    def to_printed_datastore(self, context):
        return "numbers"

    def to_printed_insightsql(self):
        return "numbers"
