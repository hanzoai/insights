from insights.insightsql.database.direct_sql_table import DirectSQLTable
from insights.insightsql.errors import QueryError
from insights.insightsql.escape_sql import escape_mysql_identifier


class DirectMySQLTable(DirectSQLTable):
    # In MySQL a "schema" and a "database" are the same namespace; this holds the
    # database the table lives in.
    mysql_schema: str
    mysql_table_name: str

    def to_printed_mysql(self, context) -> str:
        if not self.mysql_schema.strip():
            raise QueryError("Direct MySQL tables require a database name.")
        return ".".join(
            [
                escape_mysql_identifier(self.mysql_schema),
                escape_mysql_identifier(self.mysql_table_name),
            ]
        )

    def to_printed_postgres(self, context) -> str:
        raise QueryError("Direct MySQL tables cannot be printed into Postgres SQL")

    def to_printed_datastore(self, context) -> str:
        raise QueryError("Direct MySQL tables cannot be printed into Datastore SQL")
