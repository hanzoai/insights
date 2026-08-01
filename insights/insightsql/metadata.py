from typing import Literal, Optional, Union, cast

from django.conf import settings

from pydantic import BaseModel

from insights.schema import HogLanguage, InsightsQLMetadata, InsightsQLMetadataResponse, InsightsQLNotice, InsightsQLQuery

from insights.insightsql import ast
from insights.insightsql.base import AST
from insights.insightsql.compiler.bytecode import create_bytecode
from insights.insightsql.constants import InsightsQLDialect
from insights.insightsql.context import InsightsQLContext
from insights.insightsql.database.database import Database
from insights.insightsql.direct_connection import INVALID_CONNECTION_ID_ERROR, get_direct_connection_source
from insights.insightsql.direct_sql import get_adapter
from insights.insightsql.errors import ExposedInsightsQLError
from insights.insightsql.filters import replace_filters
from insights.insightsql.metadata_heuristics import run_metadata_heuristics
from insights.insightsql.modifiers import create_default_modifiers_for_team
from insights.insightsql.parser import parse_expr, parse_program, parse_select, parse_string_template
from insights.insightsql.placeholders import find_placeholders, replace_placeholders
from insights.insightsql.printer import prepare_and_print_ast
from insights.insightsql.taxonomy_validation import validate_taxonomy_references
from insights.insightsql.variables import replace_variables
from insights.insightsql.visitor import TraversingVisitor, clone_expr

from insights.insightsql_queries.query_runner import get_query_runner
from insights.models import Team
from insights.models.user import User


def get_insightsql_metadata(
    query: InsightsQLMetadata,
    team: Team,
    user: Optional[User] = None,
    insightsql_ast: Optional[Union[ast.SelectQuery, ast.SelectSetQuery]] = None,
    prepared_ast: Optional[ast.AST] = None,  # precached
    printed_sql: Optional[str] = None,  # precached
) -> InsightsQLMetadataResponse:
    response = InsightsQLMetadataResponse(
        isValid=True,
        query=query.query,
        errors=[],
        warnings=[],
        notices=[],
        table_names=[],
    )

    query_modifiers = create_default_modifiers_for_team(team, query.modifiers)
    source = get_direct_connection_source(team, query.connectionId, user=user)
    if query.connectionId and source is None:
        response.isValid = False
        response.errors = [InsightsQLNotice(message=INVALID_CONNECTION_ID_ERROR)]
        return response

    database = None
    if source:
        database = Database.create_for(
            team=team,
            user=user,
            modifiers=query_modifiers,
            connection_id=str(source.id),
        )

    heuristic_warnings: list[InsightsQLNotice] = []
    context: Optional[InsightsQLContext] = None

    try:
        context = InsightsQLContext(
            team_id=team.pk,
            user=user,
            database=database,
            modifiers=query_modifiers,
            enable_select_queries=True,
            # A resolved direct-connection source prints with its engine dialect (below), so the
            # context must be marked direct — otherwise the Datastore printer's direct-table guard
            # fires and metadata/autocomplete reports a false "can only be queried through its direct
            # connection" error for a query that actually runs fine.
            is_direct_query=source is not None,
            debug=query.debug or False,
            globals=query.globals,
        )
        if query.language == HogLanguage.HOG:
            program = parse_program(query.query)
            create_bytecode(program, supported_functions={"fetch", "insightsCapture"}, args=[], context=context)
        elif query.language == HogLanguage.FN_TEMPLATE:
            string = parse_string_template(query.query)
            create_bytecode(string, supported_functions={"fetch", "insightsCapture"}, args=[], context=context)
        elif query.language == HogLanguage.FN_QL_EXPR:
            node = parse_expr(query.query)
            if query.sourceQuery is not None:
                source_query = get_query_runner(query=query.sourceQuery, team=team).to_query()
                process_expr_on_table(node, context=context, source_query=source_query)
            else:
                process_expr_on_table(node, context=context)
        elif query.language == HogLanguage.FN_QL:
            if not insightsql_ast:
                insightsql_ast = parse_select(query.query)
                finder = find_placeholders(insightsql_ast)
                if finder.has_filters:
                    insightsql_ast = replace_filters(insightsql_ast, query.filters, team, database=database)
                if query.variables or finder.placeholder_fields or finder.placeholder_expressions:
                    insightsql_ast = replace_variables(
                        insightsql_ast, list(query.variables.values()) if query.variables else [], team
                    )
                    insightsql_ast = cast(ast.SelectQuery, replace_placeholders(insightsql_ast, query.globals))

            heuristic_warnings.extend(run_metadata_heuristics(insightsql_ast))
            insightsql_table_names = get_table_names(insightsql_ast)
            heuristic_warnings.extend(validate_taxonomy_references(insightsql_ast, team, insightsql_table_names))
            response.table_names = insightsql_table_names

            if not printed_sql or not prepared_ast:
                direct_adapter = get_adapter(source.direct_engine) if source else None
                direct_dialect: InsightsQLDialect = (
                    direct_adapter.dialect if direct_adapter and direct_adapter.dialect else "postgres"
                )
                printed_sql, prepared_ast = prepare_and_print_ast(
                    clone_expr(insightsql_ast),
                    context=context,
                    dialect=direct_dialect if source else "datastore",
                )

            if prepared_ast:
                response.ch_table_names = get_table_names(prepared_ast)
        else:
            raise ValueError(f"Unsupported language: {query.language}")
    except Exception as e:
        response.isValid = False
        if isinstance(e, ExposedInsightsQLError):
            error = str(e)
            # cpp-json (ANTLR) and rust-py word EOF differently; collapse both into a single human-readable string.
            if "mismatched input '<EOF>' expecting" in error or "unexpected token in expression: Eof" in error:
                error = "Unexpected end of query"
            if e.end and e.start and e.end < e.start:
                response.errors.append(InsightsQLNotice(message=error, start=e.end, end=e.start))
            else:
                response.errors.append(InsightsQLNotice(message=error, start=e.start, end=e.end))
        elif (
            settings.DEBUG
        ):  # We don't want to accidentally expose too much data via errors, so expose only when debug is enabled
            response.errors.append(InsightsQLNotice(message=f"Unexpected {e.__class__.__name__}: {str(e)}"))
        else:
            response.errors.append(InsightsQLNotice(message=f"Unexpected {e.__class__.__name__}"))
    finally:
        if context is not None:
            response.warnings = [*context.warnings, *heuristic_warnings]
            response.notices = context.notices
            if response.errors:
                response.errors = [*context.errors, *response.errors]
            else:
                response.errors = context.errors
            response.isValid = len(response.errors) == 0

    # We add a magic "F'" start prefix to get Antlr into the right parsing mode, subtract it now
    if query.language == HogLanguage.FN_TEMPLATE:
        for err in response.errors:
            if err.start is not None and err.end is not None and err.start > 0:
                err.start -= 2
                err.end -= 2

    return response


def enrich_insightsql_validation_error(
    query: BaseModel | None,
    team: Team,
    user: Optional[User],
    original_detail: str,
) -> tuple[str, dict | None]:
    """When a InsightsQLQuery fails, run it through metadata resolution to collect
    structured error positions, table references, and any fix hints. Returns a
    (possibly enriched) detail string and a dict suitable for exceptions_hog's
    ``extra`` attribute — or ``(original_detail, None)`` when enrichment isn't
    applicable or fails.
    """
    if not isinstance(query, InsightsQLQuery) or not query.query:
        return original_detail, None

    try:
        metadata = get_insightsql_metadata(
            query=InsightsQLMetadata(
                kind="InsightsQLMetadata",
                language=HogLanguage.FN_QL,
                query=query.query,
                modifiers=query.modifiers,
                filters=query.filters,
                connectionId=query.connectionId,
            ),
            team=team,
            user=user,
        )
    except Exception:
        return original_detail, None

    lines: list[str] = [original_detail]

    for notice in [*metadata.errors, *metadata.warnings, *metadata.notices]:
        if notice.fix and notice.fix not in lines:
            lines.append(f"Hint: {notice.fix}")

    if metadata.table_names:
        lines.append(f"Tables referenced: {', '.join(metadata.table_names)}")

    extra = {"insightsql_metadata": metadata.model_dump(mode="json", exclude_none=True)}
    return "\n".join(lines), extra


def process_expr_on_table(
    node: ast.Expr,
    context: InsightsQLContext,
    source_query: Optional[ast.SelectQuery | ast.SelectSetQuery] = None,
):
    try:
        if source_query is not None:
            select_query = cast(ast.SelectQuery, clone_expr(source_query, clear_locations=True))
            select_query.select.append(node)
        else:
            select_query = ast.SelectQuery(select=[node], select_from=ast.JoinExpr(table=ast.Field(chain=["events"])))

        # Nothing to return, we just make sure it doesn't throw
        dialect: Literal["datastore", "postgres", "mysql"] = "datastore"
        if getattr(context.database, "_connection_id", None):
            connection_metadata = getattr(context.database, "_direct_connection_metadata", None)
            engine = connection_metadata.get("engine") if isinstance(connection_metadata, dict) else None
            dialect = "mysql" if engine == "mysql" else "postgres"
        prepare_and_print_ast(select_query, context, dialect)
    except (NotImplementedError, SyntaxError):
        raise


def get_table_names(select_query: AST) -> list[str]:
    # Don't need types, we're only interested in the table names as passed in
    collector = TableCollector()
    collector.visit(select_query)
    return list(collector.table_names - collector.ctes)


class TableCollector(TraversingVisitor):
    def __init__(self):
        self.table_names = set()
        self.ctes = set()

    def visit_cte(self, node: ast.CTE):
        self.ctes.add(node.name)
        super().visit(node.expr)

    def visit_join_expr(self, node: ast.JoinExpr):
        if isinstance(node.table, ast.Field):
            self.table_names.add(".".join([str(x) for x in node.table.chain]))
        else:
            self.visit(node.table)

        self.visit(node.next_join)
