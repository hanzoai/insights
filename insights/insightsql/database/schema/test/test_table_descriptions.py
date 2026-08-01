from insights.test.base import APIBaseTest

from parameterized import parameterized

from insights.schema import InsightsQLQueryModifiers

from insights.insightsql.database.models import StringDatabaseField, Table
from insights.insightsql.database.schema.table_descriptions import TableDescriptions

from insights.models import Team
from insights.models.scoping import team_scope

from products.data_modeling.backend.facade.models import (
    DataWarehouseSavedQuery,
    DataWarehouseSavedQueryColumnAnnotation,
)
from products.warehouse_sources.backend.facade.models import (
    DataWarehouseCredential,
    DataWarehouseTable,
    ExternalDataSchema,
    ExternalDataSource,
    WarehouseColumnAnnotation,
)
from products.warehouse_sources.backend.facade.types import ExternalDataSourceType


class TestTableDescriptions(APIBaseTest):
    def _warehouse_table(
        self, *, name: str = "orders", team: Team | None = None, columns: tuple[str, ...] = ("id",)
    ) -> DataWarehouseTable:
        team = team or self.team
        credential = DataWarehouseCredential.objects.create(access_key="x", access_secret="x", team=team)
        return DataWarehouseTable.objects.create(
            name=name,
            format="Parquet",
            team=team,
            credential=credential,
            url_pattern="https://bucket.s3/data/*",
            columns={
                c: {"insightsql": "StringDatabaseField", "datastore": "Nullable(String)", "valid": True} for c in columns
            },
        )

    def _view(self, *, name: str = "orders_view", team: Team | None = None) -> DataWarehouseSavedQuery:
        team = team or self.team
        return DataWarehouseSavedQuery.objects.create(
            team=team,
            name=name,
            query={"query": "SELECT 1 AS amount"},
            columns={"amount": {"insightsql": "IntegerDatabaseField", "datastore": "Int64", "valid": True}},
        )

    def test_resolves_warehouse_descriptions_by_table_id(self):
        # A synced table's catalog name differs from its model name, so annotations must resolve by table
        # UUID, not name — keying by name silently dropped every annotation in production. The e2e catalog
        # tests use a table whose name matches, so they wouldn't catch a name-keyed regression; this does.
        table = self._warehouse_table()
        with team_scope(self.team.id, canonical=True):
            WarehouseColumnAnnotation.objects.create(
                team=self.team,
                table=table,
                column_name="",
                description="All orders placed by customers.",
                description_source=WarehouseColumnAnnotation.DescriptionSource.CANONICAL,
            )
            WarehouseColumnAnnotation.objects.create(
                team=self.team,
                table=table,
                column_name="id",
                description="Unique order identifier.",
                description_source=WarehouseColumnAnnotation.DescriptionSource.USER_EDITED,
            )
        insightsql_table = table.insightsql_definition()
        resolver = TableDescriptions.load(self.team.id)
        assert resolver.for_table(insightsql_table) == "All orders placed by customers."
        assert resolver.for_column(insightsql_table, "id", insightsql_table.fields["id"]) == "Unique order identifier."

    def test_resolves_view_descriptions_by_saved_query_id(self):
        view = self._view()
        with team_scope(self.team.id, canonical=True):
            DataWarehouseSavedQueryColumnAnnotation.objects.create(
                team=self.team,
                saved_query=view,
                column_name="",
                description="Revenue per order.",
                description_source=DataWarehouseSavedQueryColumnAnnotation.DescriptionSource.USER_EDITED,
            )
            DataWarehouseSavedQueryColumnAnnotation.objects.create(
                team=self.team,
                saved_query=view,
                column_name="amount",
                description="Order revenue in cents.",
                description_source=DataWarehouseSavedQueryColumnAnnotation.DescriptionSource.USER_EDITED,
            )
        insightsql_view = view.insightsql_definition()
        resolver = TableDescriptions.load(self.team.id)
        assert resolver.for_table(insightsql_view) == "Revenue per order."
        assert resolver.for_column(insightsql_view, "amount", insightsql_view.fields["amount"]) == "Order revenue in cents."

    def test_resolves_materialized_view_descriptions_via_backing_table(self):
        # A materialized view queried in materialized mode resolves to its single backing (output)
        # table, so `insightsql_definition` returns a warehouse table keyed by the backing table's id, not
        # the SavedQuery. The view's own annotations must still resolve via the backing->view mapping.
        backing = self._warehouse_table(name="revenue_view_backing", columns=("amount",))
        view = DataWarehouseSavedQuery.objects.create(
            team=self.team,
            name="revenue_view",
            query={"query": "SELECT 1 AS amount"},
            columns={"amount": {"insightsql": "StringDatabaseField", "datastore": "Nullable(String)", "valid": True}},
            table=backing,
            is_materialized=True,
        )
        with team_scope(self.team.id, canonical=True):
            DataWarehouseSavedQueryColumnAnnotation.objects.create(
                team=self.team,
                saved_query=view,
                column_name="amount",
                description="Order revenue in cents.",
                description_source=DataWarehouseSavedQueryColumnAnnotation.DescriptionSource.USER_EDITED,
            )
        # Materialized mode swaps the view for its backing warehouse table object.
        backing_insightsql = view.insightsql_definition(InsightsQLQueryModifiers(useMaterializedViews=True))
        resolver = TableDescriptions.load(self.team.id)
        assert resolver.for_column(backing_insightsql, "amount", backing_insightsql.fields["amount"]) == "Order revenue in cents."

    def test_resolves_static_field_description_for_native_tables(self):
        # Native tables carry their descriptions on the field objects, not in an annotation model.
        # Both consumers (information_schema and read_data) rely on the resolver surfacing them.
        resolver = TableDescriptions({}, {}, {}, {})
        field = StringDatabaseField(name="ts", description="When the event occurred.")
        table = Table(fields={"ts": field}, name="events", description="Every analytics event.")

        assert resolver.for_table(table) == "Every analytics event."
        assert resolver.for_column(table, "ts", field) == "When the event occurred."

    @parameterized.expand(["warehouse", "view"])
    def test_load_does_not_leak_other_teams_descriptions(self, kind: str):
        # Annotations are team-scoped via TeamScopedManager; lock that in so a future switch to
        # `.unscoped()` can't leak another team's descriptions into a resolver loaded for this team.
        other = Team.objects.create(organization=self.organization, name="other")
        insightsql_table: Table
        if kind == "warehouse":
            table = self._warehouse_table(team=other)
            with team_scope(other.id, canonical=True):
                WarehouseColumnAnnotation.objects.create(
                    team=other,
                    table=table,
                    column_name="",
                    description="Other team's private table.",
                    description_source=WarehouseColumnAnnotation.DescriptionSource.USER_EDITED,
                )
            insightsql_table = table.insightsql_definition()
        else:
            view = self._view(team=other)
            with team_scope(other.id, canonical=True):
                DataWarehouseSavedQueryColumnAnnotation.objects.create(
                    team=other,
                    saved_query=view,
                    column_name="",
                    description="Other team's private view.",
                    description_source=DataWarehouseSavedQueryColumnAnnotation.DescriptionSource.USER_EDITED,
                )
            insightsql_table = view.insightsql_definition()

        resolver = TableDescriptions.load(self.team.id)
        assert resolver.for_table(insightsql_table) is None

    def _source_schema(
        self, table: DataWarehouseTable, *, description: str | None, team: Team | None = None
    ) -> ExternalDataSchema:
        team = team or self.team
        source = ExternalDataSource.objects.create(team=team, source_type=ExternalDataSourceType.POSTGRES)
        return ExternalDataSchema.objects.create(
            team=team, source=source, name=table.name, table=table, description=description
        )

    def test_resolves_source_native_table_description_when_no_annotation(self):
        table = self._warehouse_table()
        self._source_schema(table, description="Orders imported from the billing Postgres.")
        resolver = TableDescriptions.load(self.team.id)
        assert resolver.for_table(table.insightsql_definition()) == "Orders imported from the billing Postgres."

    def test_annotation_wins_over_source_native_table_description(self):
        table = self._warehouse_table()
        self._source_schema(table, description="Source-native text.")
        with team_scope(self.team.id, canonical=True):
            WarehouseColumnAnnotation.objects.create(
                team=self.team,
                table=table,
                column_name="",
                description="Curated table description.",
                description_source=WarehouseColumnAnnotation.DescriptionSource.USER_EDITED,
            )
        resolver = TableDescriptions.load(self.team.id)
        assert resolver.for_table(table.insightsql_definition()) == "Curated table description."

    def test_source_native_description_does_not_leak_onto_materialized_view(self):
        backing = self._warehouse_table(name="revenue_view_backing", columns=("amount",))
        self._source_schema(backing, description="Backing table source text.")
        view = DataWarehouseSavedQuery.objects.create(
            team=self.team,
            name="revenue_view",
            query={"query": "SELECT 1 AS amount"},
            columns={"amount": {"insightsql": "StringDatabaseField", "datastore": "Nullable(String)", "valid": True}},
            table=backing,
            is_materialized=True,
        )
        backing_insightsql = view.insightsql_definition(InsightsQLQueryModifiers(useMaterializedViews=True))
        resolver = TableDescriptions.load(self.team.id)
        assert resolver.for_table(backing_insightsql) is None

    @parameterized.expand([("empty", ""), ("null", None)])
    def test_blank_source_native_description_ignored(self, _name: str, description: str | None):
        table = self._warehouse_table()
        self._source_schema(table, description=description)
        resolver = TableDescriptions.load(self.team.id)
        assert resolver.for_table(table.insightsql_definition()) is None
