from insights.test.base import BaseTest

from insights.insightsql.database.schema.logs import LOG_TABLE, LogAttributesTable, LogsKafkaMetricsTable, LogsTable

from insights.datastore.property_groups import property_groups


class TestLogsReadThePlane(BaseTest):
    def test_every_log_table_reads_the_plane(self):
        for table in (LogsTable(), LogAttributesTable(), LogsKafkaMetricsTable()):
            ref = table.to_printed_datastore_table_ref(None)
            self.assertTrue(ref.startswith("("), f"{table.to_printed_insightsql()} must read a projection")
            self.assertTrue(ref.endswith(f") AS {table.to_printed_datastore(None)}"))

        # The two that carry log rows read `event.log`; the checkpoint is a constant.
        for table in (LogsTable(), LogAttributesTable()):
            self.assertIn(LOG_TABLE, table.to_printed_datastore_table_ref(None))

    def test_printed_name_stays_the_property_group_key(self):
        # Attribute filters are routed to `attributes_map_*` by a registry keyed on
        # this exact string. A rename here does not fail — it matches no rows for
        # `equals` and every row for `is not` — so it is asserted rather than trusted.
        name = LogsTable().to_printed_datastore(None)
        self.assertEqual(name, "logs")
        routed = list(property_groups.get_property_group_columns(name, "attributes", "anything__str"))
        self.assertEqual(routed, ["attributes_map_str"])
        # ...and the projection has to carry whatever the registry routes filters into.
        ref = LogsTable().to_printed_datastore_table_ref(None)
        for column in routed:
            self.assertIn(f"AS {column}", ref)

    def test_tenancy_is_projected_and_derived(self):
        # The printer injects `team_id = <n>` after resolution, naming the column
        # literally, so it has to be a real column of the projection.
        ref = LogsTable().to_printed_datastore_table_ref(None)
        self.assertIn("AS team_id", ref)
        # ...and it has to be DERIVED from the org routing table, never a literal,
        # so an unrouted org reads as project 0 rather than as somebody else's.
        self.assertIn("org_team", ref)
        self.assertNotIn("AS team_id,\n    1", ref)

    def test_the_columns_the_product_selects_all_resolve(self):
        ref = LogsTable().to_printed_datastore_table_ref(None)
        for column in (
            "uuid",
            "trace_id",
            "span_id",
            "body",
            "attributes",
            "timestamp",
            "observed_timestamp",
            "severity_text",
            "severity_number",
            "level",
            "resource_attributes",
            "resource_fingerprint",
            "instrumentation_scope",
            "event_name",
            "service_name",
            "time_bucket",
        ):
            self.assertIn(f"AS {column}", ref)

    def test_attribute_index_carries_what_the_logs_side_splices_in(self):
        # `LogsFilterBuilder.where()` splices logs-shaped predicates into this
        # subquery, so these columns have to exist on both sides.
        ref = LogAttributesTable().to_printed_datastore_table_ref(None)
        for column in ("team_id", "time_bucket", "service_name", "resource_fingerprint", "attribute_key"):
            self.assertIn(f"AS {column}", ref)
