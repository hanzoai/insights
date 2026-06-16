from typing import cast

from insights.test.base import BaseTest

from parameterized import parameterized

from insights.schema import InsightsQLQueryModifiers, PersonsOnEventsMode

from insights.insightsql import ast
from insights.insightsql.insightsql import InsightsQLContext
from insights.insightsql.parser import parse_select
from insights.insightsql.printer import prepare_ast_for_printing

from insights.batch_exports.http import BatchExportSerializer


def prepare_query(query: str, team_id: int) -> ast.SelectQuery:
    """Parse and resolve a InsightsQL query string into a prepared AST."""
    parsed = parse_select(query)
    return cast(
        ast.SelectQuery,
        prepare_ast_for_printing(
            parsed,
            context=InsightsQLContext(
                team_id=team_id,
                enable_select_queries=True,
                modifiers=InsightsQLQueryModifiers(
                    personsOnEventsMode=PersonsOnEventsMode.PERSON_ID_NO_OVERRIDE_PROPERTIES_ON_EVENTS
                ),
            ),
            dialect="clickhouse",
        ),
    )


class TestSerializeInsightsQLQueryToBatchExportSchema(BaseTest):
    def _make_serializer(self) -> BatchExportSerializer:
        return BatchExportSerializer(context={"team_id": self.team.pk})

    @parameterized.expand(
        [
            (
                "simple_fields_use_original_name_as_alias",
                "SELECT event, person_id FROM events",
                [
                    {"expression": "events.event", "alias": "event"},
                    {"expression": "events.person_id", "alias": "person_id"},
                ],
                {},
            ),
            (
                "aliased_fields",
                "SELECT event AS my_event, team_id AS my_team FROM events",
                [
                    {"expression": "events.event", "alias": "my_event"},
                    {"expression": "events.team_id", "alias": "my_team"},
                ],
                {},
            ),
            (
                "property_access_populates_values",
                "SELECT properties.$browser AS browser FROM events",
                [
                    {
                        "expression": "replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.properties, %(insightsql_val_0)s), ''), 'null'), '^\"|\"$', '')",
                        "alias": "browser",
                    },
                ],
                {"insightsql_val_0": "$browser"},
            ),
            (
                "mixed_simple_and_property_fields",
                "SELECT event, properties.$browser AS browser, properties.custom AS custom, person_id FROM events",
                [
                    {"expression": "events.event", "alias": "event"},
                    {
                        "expression": "replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.properties, %(insightsql_val_0)s), ''), 'null'), '^\"|\"$', '')",
                        "alias": "browser",
                    },
                    {
                        "expression": "replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.properties, %(insightsql_val_1)s), ''), 'null'), '^\"|\"$', '')",
                        "alias": "custom",
                    },
                    {"expression": "events.person_id", "alias": "person_id"},
                ],
                {"insightsql_val_0": "$browser", "insightsql_val_1": "custom"},
            ),
        ],
    )
    def test_serialize_insightsql_query(self, _name, query, expected_fields, expected_values):
        prepared = prepare_query(query, self.team.pk)
        serializer = self._make_serializer()

        result = serializer.serialize_insightsql_query_to_batch_export_schema(prepared)

        assert result["fields"] == expected_fields
        assert result["values"] == expected_values
        assert "insightsql_query" in result

    @parameterized.expand(
        [
            ("integer", "SELECT 1 FROM events", "1", "`1`"),
            ("string", "SELECT 'hello' FROM events", "%(insightsql_val_0)s", "hello"),
            ("float", "SELECT 3.14 FROM events", "3.14", "`3.14`"),
            ("null", "SELECT null FROM events", "NULL", "NULL"),
            ("boolean", "SELECT true FROM events", "1", "`1`"),
        ],
    )
    def test_serialize_insightsql_query_with_bare_constant(self, _name, query, expected_expression, expected_alias):
        prepared = prepare_query(query, self.team.pk)
        serializer = self._make_serializer()

        result = serializer.serialize_insightsql_query_to_batch_export_schema(prepared)

        assert len(result["fields"]) == 1
        field = result["fields"][0]
        assert field["expression"] == expected_expression
        assert field["alias"] == expected_alias

    def test_serialize_insightsql_query_escapes_injected_alias(self):
        """An alias containing SQL injection attempts is escaped with backticks."""
        query = "SELECT uuid AS `x, (SELECT query FROM another_table LIMIT 100) AS leaked` FROM events"
        prepared = prepare_query(query, self.team.pk)
        serializer = self._make_serializer()

        result = serializer.serialize_insightsql_query_to_batch_export_schema(prepared)

        assert len(result["fields"]) == 1
        field = result["fields"][0]
        # The alias must be wrapped in backticks, keeping the malicious string as a single identifier
        assert field["alias"] == "`x, (SELECT query FROM another_table LIMIT 100) AS leaked`"
        assert field["expression"] == "events.uuid"
