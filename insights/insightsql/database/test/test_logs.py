from django.test import SimpleTestCase

from parameterized import parameterized

from insights.insightsql.database.models import DatabaseField
from insights.insightsql.database.schema.logs import LOG_TABLE, LogAttributesTable, LogsKafkaMetricsTable, LogsTable

from insights.datastore.property_groups import property_groups

LOG_TABLES = [
    ("logs", LogsTable(), LOG_TABLE),
    ("log_attributes", LogAttributesTable(), LOG_TABLE),
    # The live-tail watermark is a constant, not a read of the plane.
    ("logs_kafka_metrics", LogsKafkaMetricsTable(), None),
]


class TestLogsReadThePlane(SimpleTestCase):
    @parameterized.expand([(name, table, source) for name, table, source in LOG_TABLES])
    def test_every_declared_field_is_projected(self, name, table, source):
        # These tables named `logs` / `log_attributes` / `logs_kafka_metrics`, which
        # nothing ever created, so every read failed with `Unknown table`. They read a
        # projection of the plane now, and a field the projection forgets is an
        # `Unknown identifier` the moment a query selects it.
        ref = table.to_printed_datastore_table_ref(None)
        self.assertTrue(ref.startswith("(") and ref.endswith(f") AS {table.to_printed_datastore(None)}"))
        if source is not None:
            self.assertIn(source, ref)

        for field in table.fields.values():
            if isinstance(field, DatabaseField):
                self.assertIn(f" AS {field.name}", ref, f"{name}.{field.name} is declared but not projected")

    def test_printed_name_stays_the_property_group_key(self):
        # Attribute filters are routed to `attributes_map_*` by a registry keyed on
        # this exact string. Renaming it does not fail — it matches no rows for
        # `equals` and every row for `is not` — so it is asserted rather than trusted,
        # and whatever it routes into has to be a column the projection carries.
        name = LogsTable().to_printed_datastore(None)
        ref = LogsTable().to_printed_datastore_table_ref(None)
        for key, expected in (("k__str", "attributes_map_str"), ("k__float", "attributes_map_float")):
            routed = list(property_groups.get_property_group_columns(name, "attributes", key))
            self.assertEqual(routed, [expected])
            self.assertIn(f" AS {expected}", ref)

    def test_tenancy_is_derived_from_the_org_routing(self):
        # The printer injects `team_id = <n>` after resolution, naming the column
        # literally, so it has to be a real column of the projection — and it has to
        # be DERIVED from the routing table rather than written here, so an org nobody
        # routed reads as project 0 instead of as somebody else's.
        for _, table, _ in LOG_TABLES[:2]:
            ref = table.to_printed_datastore_table_ref(None)
            self.assertIn(" AS team_id", ref)
            self.assertIn("org_team", ref)
