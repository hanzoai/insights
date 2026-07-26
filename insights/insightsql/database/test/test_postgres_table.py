from typing import Literal

from insights.test.base import BaseTest

from insights.insightsql.context import InsightsQLContext
from insights.insightsql.database.database import Database
from insights.insightsql.database.models import IntegerDatabaseField, StringDatabaseField, TableNode
from insights.insightsql.database.postgres_table import PostgresTable
from insights.insightsql.parser import parse_select
from insights.insightsql.printer import prepare_and_print_ast
from insights.insightsql.query import create_default_modifiers_for_team


class TestPostgresTable(BaseTest):
    def _init_database(self):
        self.database = Database.create_for(team=self.team)

        self.database.tables.add_child(
            TableNode(
                name="postgres_table",
                table=PostgresTable(
                    name="postgres_table",
                    postgres_table_name="some_table_on_postgres",
                    fields={
                        "id": IntegerDatabaseField(name="id"),
                        "team_id": IntegerDatabaseField(name="team_id"),
                        "name": StringDatabaseField(name="name"),
                    },
                ),
            )
        )

        self.context = InsightsQLContext(
            team_id=self.team.pk,
            enable_select_queries=True,
            database=self.database,
            modifiers=create_default_modifiers_for_team(self.team),
        )

    def _select(self, query: str, dialect: Literal["insightsql", "datastore"] = "datastore") -> str:
        return prepare_and_print_ast(parse_select(query), self.context, dialect=dialect)[0]

    def test_postgres_table_select(self):
        self._init_database()

        insightsql = self._select(query="SELECT * FROM postgres_table LIMIT 10", dialect="insightsql")
        self.assertEqual(
            insightsql,
            "SELECT id, team_id, name FROM postgres_table LIMIT 10",
        )

        datastore = self._select(query="SELECT * FROM postgres_table LIMIT 10", dialect="datastore")

        self.assertEqual(
            datastore,
            f"SELECT postgres_table.id AS id, postgres_table.team_id AS team_id, postgres_table.name AS name FROM postgresql(%(insightsql_val_1_sensitive)s, %(insightsql_val_2_sensitive)s, %(insightsql_val_0_sensitive)s, %(insightsql_val_3_sensitive)s, %(insightsql_val_4_sensitive)s) AS postgres_table WHERE equals(postgres_table.team_id, {self.team.id}) LIMIT 10",
        )
