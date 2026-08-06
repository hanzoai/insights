"""Metric definition validation — the single choke point for serializers and internal writers.

Every write of a ``definition`` goes through :func:`validate_metric_definition`, which returns the
upgrade-canonical definition (so schema migrations never read as drift later) plus the tables it
directly references (cached on the row for the catalog's denied-table filter).
"""

from typing import NoReturn, Optional

from pydantic import BaseModel
from rest_framework.exceptions import ValidationError

from insights.schema import ActionsNode, DataWarehouseNode, EventsNode, FunnelsQuery, InsightsQLQuery, TrendsQuery

from insights.insightsql import ast
from insights.insightsql.context import InsightsQLContext
from insights.insightsql.errors import ExposedInsightsQLError, ResolutionError
from insights.insightsql.parser import parse_select
from insights.insightsql.printer import prepare_ast_for_printing
from insights.insightsql.visitor import TraversingVisitor

from insights.exceptions_capture import capture_exception
from insights.models import Team, User
from insights.schema_migrations.upgrade import upgrade

from ..facade.enums import INSIGHTSQL_DEFINITION_KIND, MARKDOWN_DEFINITION_KIND

# Query kinds a metric definition may take (the facade enums are the public split). Node kinds are
# the RFC's "event with filters" single series; insight kinds are the classic viz shapes. Kept
# small on purpose.
_NODE_MODELS: dict[str, type[BaseModel]] = {
    "EventsNode": EventsNode,
    "ActionsNode": ActionsNode,
    "DataWarehouseNode": DataWarehouseNode,
}
_INSIGHT_MODELS: dict[str, type[BaseModel]] = {"TrendsQuery": TrendsQuery, "FunnelsQuery": FunnelsQuery}
_SUPPORTED_KINDS = {INSIGHTSQL_DEFINITION_KIND, *_NODE_MODELS, *_INSIGHT_MODELS}

# A markdown definition is a bounded blob; keep it small so it stays a definition, not a document.
MAX_MARKDOWN_DEFINITION_LENGTH = 20_000

# InsightsQLQuery carries fields that would let a caller bypass team query controls (a raw Datastore
# passthrough, an arbitrary DB connection). A metric definition may only set these.
_INSIGHTSQL_ALLOWED_KEYS = {"kind", "query", "values"}


class _TableReferenceCollector(TraversingVisitor):
    """Collects the identifiers used directly as FROM/JOIN targets in a parsed InsightsQL query."""

    def __init__(self) -> None:
        self.tables: set[str] = set()

    def visit_join_expr(self, node: ast.JoinExpr) -> None:
        if isinstance(node.table, ast.Field):
            self.tables.add(".".join(str(part) for part in node.table.chain))
        super().visit_join_expr(node)


def _fail(error: str, hint: str) -> NoReturn:
    # Keyed by the offending field with a single string message: the exceptions_hog handler
    # renders that as attr="definition" + the full text; any richer dict shape strips the
    # message (or 500s) on its way through the HTTP envelope.
    raise ValidationError({"definition": f"{error} {hint}"})


def validate_metric_definition(definition: dict, team: Team, user: Optional[User] = None) -> tuple[dict, list[str]]:
    """Validate a metric definition and return ``(canonical_definition, referenced_table_names)``.

    Raises :class:`ValidationError` keyed by the ``definition`` field on any problem.
    """
    if not isinstance(definition, dict) or not definition.get("kind"):
        _fail("A definition must be a query object with a 'kind'.", "Provide a InsightsQLQuery, TrendsQuery, or event node.")

    kind = definition["kind"]
    if kind == MARKDOWN_DEFINITION_KIND:
        # Agent-calculated definition: prose steps, not a query. Never upgrade()/schema-validate it.
        return _validate_markdown(definition)

    if kind == "InsightVizNode":
        source = definition.get("source")
        if not isinstance(source, dict):
            _fail("InsightVizNode has no source query.", "Use the insight's inner query as the definition.")
        return validate_metric_definition(source, team, user)

    # Reject unsupported kinds before upgrade() — upgrade runs kind-specific migrations that assume a
    # well-formed query of that kind and would crash on anything else.
    if kind not in _SUPPORTED_KINDS:
        supported = ", ".join(sorted(_SUPPORTED_KINDS))
        _fail(f"Unsupported definition kind '{kind}'.", f"Supported kinds: {supported}.")

    try:
        canonical = upgrade(definition)
    except Exception as e:
        _fail(f"Malformed {kind} definition: {e}", "Check the query shape against its schema.")

    kind = canonical.get("kind", kind)
    if kind == "InsightsQLQuery":
        return _validate_insightsql(canonical, team, user)
    if kind in _NODE_MODELS:
        return _validate_schema_model(canonical, _NODE_MODELS[kind])
    return _validate_schema_model(canonical, _INSIGHT_MODELS[kind])


def _validate_markdown(definition: dict) -> tuple[dict, list[str]]:
    extra_keys = set(definition.keys()) - {"kind", "markdown"}
    if extra_keys:
        _fail(
            f"A markdown definition may only set 'markdown': unexpected {sorted(extra_keys)}.",
            "Put the calculation steps in 'markdown' and remove the other keys.",
        )
    markdown = definition.get("markdown")
    if not isinstance(markdown, str) or not markdown.strip():
        _fail(
            "A markdown definition needs non-empty 'markdown' text.",
            "Describe the steps an agent should follow to calculate the metric.",
        )
    if len(markdown) > MAX_MARKDOWN_DEFINITION_LENGTH:
        _fail(
            "Markdown definition is too long.",
            f"Keep it under {MAX_MARKDOWN_DEFINITION_LENGTH} characters.",
        )
    return definition, []


def _validate_insightsql(definition: dict, team: Team, user: Optional[User]) -> tuple[dict, list[str]]:
    extra_keys = set(definition.keys()) - _INSIGHTSQL_ALLOWED_KEYS
    if extra_keys:
        _fail(
            f"InsightsQLQuery fields not allowed in a metric definition: {sorted(extra_keys)}.",
            "A metric definition may only set 'query' (and 'values'). Fields like connectionId or "
            "sendRawQuery are rejected.",
        )

    _ensure_valid_schema(definition, InsightsQLQuery)

    try:
        ast_node = parse_select(definition["query"])
    except ExposedInsightsQLError as e:
        _fail(f"Invalid InsightsQL query: {e}", "Fix the SQL syntax.")
    except ResolutionError as e:
        capture_exception(e)
        _fail("Could not resolve a table or field in the query.", "Check table and column names.")
    except Exception as e:
        capture_exception(e)
        _fail("Could not parse the query.", "Check the SQL syntax.")

    context = InsightsQLContext(team_id=team.pk, user=user, enable_select_queries=True)
    try:
        prepare_ast_for_printing(node=ast_node, context=context, dialect="datastore")
    except ExposedInsightsQLError as e:
        _fail(f"Invalid InsightsQL query: {e}", "Check that every referenced table and column exists and is accessible.")
    except Exception as e:
        capture_exception(e)
        _fail("Unexpected error resolving the query.", "Simplify the query and try again.")

    collector = _TableReferenceCollector()
    collector.visit(ast_node)
    return definition, sorted(collector.tables)


def _validate_schema_model(definition: dict, model_class: type[BaseModel]) -> tuple[dict, list[str]]:
    _ensure_valid_schema(definition, model_class)
    return definition, _extract_warehouse_tables(definition)


def _ensure_valid_schema(definition: dict, model_class: type[BaseModel]) -> None:
    try:
        model_class.model_validate(definition)
    except Exception as e:
        _fail(f"Definition does not match {model_class.__name__}: {e}", "Fix the query shape.")


def _extract_warehouse_tables(definition: dict) -> list[str]:
    """Walk a node/insight query dict for DataWarehouseNode table references (direct references only)."""
    tables: set[str] = set()

    def walk(value: object) -> None:
        if isinstance(value, dict):
            if value.get("kind") == "DataWarehouseNode" and value.get("table_name"):
                tables.add(str(value["table_name"]))
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)

    walk(definition)
    return sorted(tables)
