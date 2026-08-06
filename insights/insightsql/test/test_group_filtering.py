"""
Tests for created_at filtering of group fields based on GroupTypeMapping creation time.
"""

from datetime import UTC, datetime

from insights.test.base import APIBaseTest

from django.conf import settings

from parameterized import parameterized

from insights.insightsql.context import InsightsQLContext
from insights.insightsql.database.database import Database
from insights.insightsql.parser import parse_select
from insights.insightsql.printer import prepare_and_print_ast

from insights.models.group_type_mapping import invalidate_group_types_cache
from insights.test.persons import create_group_type_mapping


class TestGroupKeyFiltering(APIBaseTest):
    """Test that $group_N fields are filtered based on GroupTypeMapping.created_at"""

    def setUp(self):
        super().setUp()
        self.database = Database.create_for(team=self.team)
        self.context = InsightsQLContext(team=self.team, database=self.database, enable_select_queries=True)

    def _events_from_sql(self) -> str:
        return "events_json AS events" if settings.DATASTORE_INSIGHTSQL_USE_NEW_EVENTS_SCHEMA else "events"

    def _create_mapping_and_rebuild(self, **kwargs):
        """Create a GroupTypeMapping, invalidate cache, and rebuild database."""
        create_group_type_mapping(**kwargs)

    def _rebuild_database(self):
        invalidate_group_types_cache(self.team.project_id)
        self.database = Database.create_for(team=self.team)
        self.context = InsightsQLContext(team=self.team, database=self.database, enable_select_queries=True)

    # The created_at cutoff must be printed as a timezone-aware constant: a naive string literal is
    # parsed by Datastore in the project's timezone, shifting the cutoff by the project's UTC offset.
    @parameterized.expand(
        [
            ("UTC", "toDateTime64('2023-01-15 12:00:00.000000', 6, 'UTC')"),
            ("America/Mexico_City", "toDateTime64('2023-01-15 06:00:00.000000', 6, 'America/Mexico_City')"),
        ]
    )
    def test_group_field_with_mapping_and_created_at(self, timezone: str, expected_cutoff: str):
        self._create_mapping_and_rebuild(
            team=self.team,
            project=self.team.project,
            group_type="company",
            group_type_index=0,
            created_at=datetime(2023, 1, 15, 12, 0, 0, tzinfo=UTC),
        )
        self.team.timezone = timezone
        self.team.save()
        self._rebuild_database()

        query = "SELECT $group_0 FROM events"
        parsed = parse_select(query)

        sql, _ = prepare_and_print_ast(parsed, context=self.context, dialect="datastore")

        self.assertIn(
            f"SELECT if(less(toTimeZone(events.timestamp, %(insightsql_val_0)s), {expected_cutoff}), %(insightsql_val_1)s, events.`$group_0`) AS `$group_0` FROM {self._events_from_sql()} WHERE equals(events.team_id,",
            sql,
        )

    def test_group_field_without_mapping(self):
        """Test that $group_0 falls back when no GroupTypeMapping exists"""
        self._rebuild_database()

        query = "SELECT $group_0 FROM events"
        parsed = parse_select(query)

        sql, _ = prepare_and_print_ast(parsed, context=self.context, dialect="datastore")

        # Should return an empty string constant (parameterized)
        self.assertIn(f"SELECT events.`$group_0` AS `$group_0` FROM {self._events_from_sql()}", sql)

    def test_multiple_group_fields(self):
        """Test filtering with multiple group type mappings"""
        # Create mappings for groups 0 and 1
        self._create_mapping_and_rebuild(
            team=self.team,
            project=self.team.project,
            group_type="company",
            group_type_index=0,
            created_at=datetime(2023, 1, 15, 12, 0, 0, tzinfo=UTC),
        )
        self._create_mapping_and_rebuild(
            team=self.team,
            project=self.team.project,
            group_type="team",
            group_type_index=1,
            created_at=datetime(2023, 2, 1, 10, 0, 0, tzinfo=UTC),
        )
        self._rebuild_database()

        # Parse a query that references multiple group fields
        query = "SELECT $group_0, $group_1, $group_2 FROM events"
        parsed = parse_select(query)

        sql, _ = prepare_and_print_ast(parsed, context=self.context, dialect="datastore")

        # Should have conditional logic for groups 0 and 1, empty string for group 2
        self.assertIn("if(less(toTimeZone(events.timestamp,", sql)
        self.assertIn("events.`$group_0`) AS `$group_0`", sql)
        self.assertIn("events.`$group_1`) AS `$group_1`", sql)
        self.assertIn("events.`$group_2` AS `$group_2`", sql)

    def test_group_field_in_where_clause(self):
        """Test that group filtering works in WHERE clauses"""
        self._create_mapping_and_rebuild(
            team=self.team,
            project=self.team.project,
            group_type="company",
            group_type_index=0,
            created_at=datetime(2023, 1, 15, 12, 0, 0, tzinfo=UTC),
        )
        self._rebuild_database()

        query = "SELECT event FROM events WHERE $group_0 = 'acme'"
        parsed = parse_select(query)

        sql, _ = prepare_and_print_ast(parsed, context=self.context, dialect="datastore")

        # Should use the conditional logic in WHERE clause
        self.assertIn("equals(if(less(toTimeZone(events.timestamp,", sql)
        self.assertIn("events.`$group_0`), %(insightsql_val_", sql)

    def test_group_join_with_filtering(self):
        """Test that group_1.properties access includes filtering for $group_1"""
        self._create_mapping_and_rebuild(
            team=self.team,
            project=self.team.project,
            group_type="team",
            group_type_index=1,
            created_at=datetime(2023, 2, 1, 10, 0, 0, tzinfo=UTC),
        )
        self._rebuild_database()

        query = "SELECT group_1.properties FROM events"
        parsed = parse_select(query)

        sql, _ = prepare_and_print_ast(parsed, context=self.context, dialect="datastore")

        self.assertIn("ON equals(if(less(toTimeZone(events.timestamp,", sql)
        self.assertIn("events.`$group_1`), events__group_1.key)", sql)

    def test_multiple_group_joins_with_mixed_mappings(self):
        """Test joins to multiple groups with some having filtering and others not"""
        # Create mapping only for group_0
        self._create_mapping_and_rebuild(
            team=self.team,
            project=self.team.project,
            group_type="company",
            group_type_index=0,
            created_at=datetime(2023, 1, 15, 12, 0, 0, tzinfo=UTC),
        )
        # No mapping for group_1
        self._rebuild_database()

        query = "SELECT group_0.properties, group_1.properties FROM events"
        parsed = parse_select(query)

        sql, _ = prepare_and_print_ast(parsed, context=self.context, dialect="datastore")

        self.assertIn("ON equals(if(less(toTimeZone(events.timestamp,", sql)
        self.assertIn("events.`$group_0`), events__group_0.key)", sql)
        self.assertIn("ON equals(events.`$group_1`, events__group_1.key)", sql)

    def test_non_datastore_dialect_no_filtering(self):
        """Test that non-Datastore dialects don't get filtering"""
        self._create_mapping_and_rebuild(
            team=self.team,
            project=self.team.project,
            group_type="company",
            group_type_index=0,
            created_at=datetime(2023, 1, 15, 12, 0, 0, tzinfo=UTC),
        )
        self._rebuild_database()

        query = "SELECT $group_0 FROM events"
        parsed = parse_select(query)

        sql, _ = prepare_and_print_ast(parsed, context=self.context, dialect="insightsql")

        self.assertIn("SELECT $group_0 FROM", sql)

    def test_group_alias_with_filtering(self):
        """Test that group aliases (e.g., 'company' for $group_0) work with filtering"""
        self._create_mapping_and_rebuild(
            team=self.team,
            project=self.team.project,
            group_type="company",
            group_type_index=0,
            created_at=datetime(2023, 1, 15, 12, 0, 0, tzinfo=UTC),
        )
        self._rebuild_database()

        query = "SELECT company.properties.name FROM events"
        parsed = parse_select(query)

        sql, _ = prepare_and_print_ast(parsed, context=self.context, dialect="datastore")

        self.assertIn(
            "ON equals(if(less(toTimeZone(events.timestamp, %(insightsql_val_2)s), toDateTime64('2023-01-15 12:00:00.000000', 6, 'UTC')), %(insightsql_val_3)s, events.`$group_0`), events__group_0.key)",
            sql,
        )

    def test_group_alias_in_where_clause(self):
        """Test that group aliases work with filtering in WHERE clauses"""
        self._create_mapping_and_rebuild(
            team=self.team,
            project=self.team.project,
            group_type="company",
            group_type_index=0,
            created_at=datetime(2023, 1, 15, 12, 0, 0, tzinfo=UTC),
        )
        self._rebuild_database()

        query = "SELECT event FROM events WHERE company.properties.name = 'acme'"
        parsed = parse_select(query)

        sql, _ = prepare_and_print_ast(parsed, context=self.context, dialect="datastore")

        self.assertIn("ON equals(if(less(toTimeZone(events.timestamp,", sql)
        self.assertIn(
            "toDateTime64('2023-01-15 12:00:00.000000', 6, 'UTC')), %(insightsql_val_3)s, events.`$group_0`), events__group_0.key)",
            sql,
        )
