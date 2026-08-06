from typing import Optional, Union

from insights.test.base import APIBaseTest, DatastoreTestMixin

from insights.schema import PersonsArgMaxVersion, PersonsOnEventsMode

from insights.insightsql import ast
from insights.insightsql.context import InsightsQLContext
from insights.insightsql.modifiers import create_default_modifiers_for_team
from insights.insightsql.parser import parse_expr, parse_select
from insights.insightsql.printer import prepare_and_print_ast, prepare_ast_for_printing
from insights.insightsql.visitor import CloningVisitor, clone_expr

from insights.models import PropertyDefinition


def _expr(s: Union[str, ast.Expr, None], placeholders: Optional[dict[str, ast.Expr]] = None) -> Union[ast.Expr, None]:
    if s is None:
        return None
    if isinstance(s, str):
        expr = parse_expr(s, placeholders=placeholders)
    else:
        expr = s
    return clone_expr(expr, clear_types=True, clear_locations=True)


def _select(
    s: str,
    placeholders: Optional[dict[str, ast.Expr]] = None,
) -> ast.SelectQuery | ast.SelectSetQuery:
    parsed = parse_select(s, placeholders=placeholders)
    return parsed


def prop_read(blob: str, *keys: Union[str, int]) -> ast.PropertyAccess:
    """The lowered form of a `blob.key...` property read: `prop_read("properties", "email")` matches `properties.email`
    after lowering. Build expected clauses with it via placeholders, e.g. `_expr("{e} = 'x'", {"e": prop_read(...)})`."""
    return ast.PropertyAccess(expr=ast.Field(chain=[blob]), keys=list(keys))


class RemoveHiddenAliases(CloningVisitor):
    def visit_alias(self, node):
        if node.hidden:
            return self.visit(node.expr)
        return super().visit_alias(node)


class TestPersonWhereClauseExtractor(DatastoreTestMixin, APIBaseTest):
    def prep_context(self):
        team = self.team
        modifiers = create_default_modifiers_for_team(team)
        modifiers.optimizeJoinedFilters = True
        modifiers.personsOnEventsMode = PersonsOnEventsMode.DISABLED
        modifiers.personsArgMaxVersion = PersonsArgMaxVersion.V1
        return InsightsQLContext(
            team_id=team.pk,
            team=team,
            enable_select_queries=True,
            modifiers=modifiers,
        )

    def get_clause(self, query: str):
        context = self.prep_context()
        select = _select(query)
        new_select = prepare_ast_for_printing(select, context, "datastore")

        assert isinstance(new_select, ast.SelectQuery)
        assert isinstance(new_select.select_from, ast.JoinExpr)

        pdi_join = new_select.select_from.next_join
        while pdi_join is not None and pdi_join.alias != "events__pdi":
            pdi_join = pdi_join.next_join
        assert pdi_join is not None, "events__pdi join not found"

        person_join = pdi_join.next_join
        while person_join is not None and person_join.alias != "events__pdi__person":
            person_join = person_join.next_join
        assert person_join is not None, "events__pdi__person join not found"
        assert isinstance(person_join.table, ast.SelectQuery)

        where = person_join.table.where
        if where is None:
            return None

        where = RemoveHiddenAliases().visit(where)
        assert isinstance(where, ast.Expr)
        return clone_expr(where, clear_types=True, clear_locations=True)

    def print_query(self, query: str):
        context = self.prep_context()
        return prepare_and_print_ast(node=_select(query), context=context, dialect="datastore", pretty=False)[0]

    def test_person_properties(self):
        actual = self.get_clause("SELECT * FROM events WHERE person.properties.email = 'jimmy@hanzo.ai'")
        expected = _expr("{e} = 'jimmy@hanzo.ai'", {"e": prop_read("properties", "email")})
        assert actual == expected

    def test_person_properties_andor_1(self):
        actual = self.get_clause("SELECT * FROM events WHERE person.properties.email = 'jimmy@hanzo.ai' or false")
        expected = _expr("{e} = 'jimmy@hanzo.ai'", {"e": prop_read("properties", "email")})
        assert actual == expected

    def test_person_properties_andor_2(self):
        actual = self.get_clause("SELECT * FROM events WHERE person.properties.email = 'jimmy@hanzo.ai' and false")
        assert actual is None

    def test_person_properties_andor_3(self):
        actual = self.get_clause(
            "SELECT * FROM events WHERE person.properties.email = 'jimmy@hanzo.ai' and person.properties.email = 'timmy@hanzo.ai'"
        )
        expected = _expr(
            "{e1} = 'jimmy@hanzo.ai' and {e2} = 'timmy@hanzo.ai'",
            {"e1": prop_read("properties", "email"), "e2": prop_read("properties", "email")},
        )
        assert actual == expected

    def test_person_properties_andor_4(self):
        actual = self.get_clause(
            "SELECT * FROM events WHERE person.properties.email = 'jimmy@hanzo.ai' or person.properties.email = 'timmy@hanzo.ai'"
        )
        expected = _expr(
            "{e1} = 'jimmy@hanzo.ai' or {e2} = 'timmy@hanzo.ai'",
            {"e1": prop_read("properties", "email"), "e2": prop_read("properties", "email")},
        )
        assert actual == expected

    def test_person_properties_andor_5(self):
        actual = self.get_clause(
            "SELECT * FROM events WHERE person.properties.email = 'jimmy@hanzo.ai' or (1 and person.properties.email = 'timmy@hanzo.ai')"
        )
        expected = _expr(
            "{e1} = 'jimmy@hanzo.ai' or {e2} = 'timmy@hanzo.ai'",
            {"e1": prop_read("properties", "email"), "e2": prop_read("properties", "email")},
        )
        assert actual == expected

    def test_person_properties_andor_6(self):
        actual = self.get_clause(
            "SELECT * FROM events WHERE person.properties.email = 'jimmy@hanzo.ai' or (0 or person.properties.email = 'timmy@hanzo.ai')"
        )
        expected = _expr(
            "{e1} = 'jimmy@hanzo.ai' or {e2} = 'timmy@hanzo.ai'",
            {"e1": prop_read("properties", "email"), "e2": prop_read("properties", "email")},
        )
        assert actual == expected

    def test_person_properties_andor_7(self):
        actual = self.get_clause(
            "SELECT * FROM events WHERE person.properties.email = 'jimmy@hanzo.ai' or (1 or person.properties.email = 'timmy@hanzo.ai')"
        )
        assert actual is None

    def test_person_properties_andor_8(self):
        actual = self.get_clause(
            "SELECT * FROM events WHERE event == '$pageview' and person.properties.email = 'jimmy@hanzo.ai'"
        )
        expected = _expr("{e} = 'jimmy@hanzo.ai'", {"e": prop_read("properties", "email")})
        assert actual == expected

    def test_person_properties_andor_9(self):
        actual = self.get_clause(
            "SELECT * FROM events WHERE event == '$pageview' or person.properties.email = 'jimmy@hanzo.ai'"
        )
        assert actual is None

    def test_person_properties_andor_10(self):
        actual = self.get_clause(
            "SELECT * FROM events WHERE properties.email = 'bla@hanzo.ai' or person.properties.email = 'jimmy@hanzo.ai'"
        )
        assert actual is None

    def test_person_properties_andor_11(self):
        actual = self.get_clause(
            "SELECT * FROM events WHERE properties.email = 'bla@hanzo.ai' and person.properties.email = 'jimmy@hanzo.ai'"
        )
        expected = _expr("{e} = 'jimmy@hanzo.ai'", {"e": prop_read("properties", "email")})
        assert actual == expected

    def test_person_array(self):
        actual = self.get_clause("SELECT * FROM events WHERE person.properties.email IN ['jimmy@hanzo.ai']")
        expected = _expr("{e} IN ['jimmy@hanzo.ai']", {"e": prop_read("properties", "email")})
        assert actual == expected

    def test_person_properties_function_calls(self):
        actual = self.get_clause(
            "SELECT * FROM events WHERE properties.email = 'bla@hanzo.ai' and toString(person.properties.email) = 'jimmy@hanzo.ai'"
        )
        expected = _expr("toString({e}) = 'jimmy@hanzo.ai'", {"e": prop_read("properties", "email")})
        assert actual == expected

    def test_person_properties_function_call_args(self):
        actual = self.get_clause(
            "SELECT * FROM events WHERE properties.email = 'bla@hanzo.ai' and substring(person.properties.email, 10) = 'jimmy@hanzo.ai'"
        )
        expected = _expr("substring({e}, 10) = 'jimmy@hanzo.ai'", {"e": prop_read("properties", "email")})
        assert actual == expected

    def test_person_properties_function_call_args_complex(self):
        actual = self.get_clause(
            "SELECT * FROM events WHERE properties.email = 'bla@hanzo.ai' and substring(person.properties.email, event = 'bla') = 'jimmy@hanzo.ai'"
        )
        assert actual is None

    def test_left_join_with_negation(self):
        actual = self.get_clause("SELECT * FROM events WHERE person.properties.email != 'jimmy@hanzo.ai'")
        assert actual is None

    def test_subquery(self):
        actual = self.print_query(
            "SELECT * FROM events WHERE person.id IN (select person_id from person_distinct_ids where distinct_id = '1')"
        )
        assert "in(id, (SELECT person_distinct_ids.person_id" in actual

    def test_boolean(self):
        PropertyDefinition.objects.get_or_create(
            team=self.team,
            name="person_boolean",
            defaults={"property_type": "Boolean"},
            type=PropertyDefinition.Type.PERSON,
        )
        actual = self.print_query("SELECT * FROM events WHERE person.properties.person_boolean = false")
        assert (
            f"ifNull(equals(accurateCastOrNull(transform(toString(replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(person.properties"
            in actual
        )
