from rest_framework.exceptions import ValidationError

from insights.insightsql.database.database import Database
from insights.insightsql.database.models import DatabaseField, Table

from insights.insightsql_queries.insights.query_context import QueryContextProtocol


class DataWarehouseSchemaMixin(QueryContextProtocol):
    _insightsql_database: Database | None = None

    @property
    def insightsql_database(self) -> Database:
        if self._insightsql_database is None:
            # Lazily create once
            self._insightsql_database = Database.create_for(
                team=self.context.team,
                user=self.context.user,
                modifiers=self.context.modifiers,
            )
        return self._insightsql_database

    def get_warehouse_field(self, table_name: str, field_name: str) -> DatabaseField:
        table = self.insightsql_database.get_table(table_name)
        field = table.fields.get(field_name)
        if field is None:
            raise ValidationError(detail=f"Unknown field {table_name}.{field_name}")
        if isinstance(field, Table):
            raise ValidationError(detail=f"{table_name}.{field_name} points to a table, not a field")
        assert isinstance(field, DatabaseField)
        return field
