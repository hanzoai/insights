from insights.insightsql.database.direct_sql_table import DirectSQLTable
from insights.insightsql.errors import QueryError
from insights.insightsql.escape_sql import escape_datastore_identifier


class DirectDatastoreTable(DirectSQLTable):
    # Datastore namespaces a table as database.table (there is no separate catalog level).
    datastore_database: str
    datastore_table_name: str

    def to_printed_datastore(self, context) -> str:
        # Unlike the other direct tables (which target a different SQL dialect and raise here),
        # Datastore IS the printer's native dialect — so this renders the external table reference
        # that the direct-query executor runs against the external Datastore connection.
        parts = []
        if self.datastore_database.strip():
            parts.append(escape_datastore_identifier(self.datastore_database))
        parts.append(escape_datastore_identifier(self.datastore_table_name))
        return ".".join(parts)

    def to_printed_postgres(self, context) -> str:
        raise QueryError("Direct Datastore tables cannot be printed into Postgres SQL")

    def to_printed_mysql(self, context) -> str:
        raise QueryError("Direct Datastore tables cannot be printed into MySQL SQL")
