"""What the assistant may look at, and how far it may look.

Two tools, both read-only: `schema` says which tables and columns exist, `query`
runs an InsightsQL SELECT and returns rows. Both go through
`insights.api.services.query.process_query_dict`, the same seam the query API
uses, so there is one way to reach the datastore and not a second one here.

TENANCY. `team` is a keyword argument, supplied by the caller from the
authenticated request. It appears in no tool's parameter schema, and nothing here
reads a team, project or organization out of the model's arguments, so there is
nothing the model can say that changes which project is read. `process_query_dict`
resolves every table against that team's database and stamps its id into the
generated SQL.

READ-ONLY. `parse_select` is the gate. The InsightsQL grammar for a select
statement admits nothing that writes, and it refuses a second statement after a
semicolon, so a mutation is a parse error before the datastore is opened.
"""

from __future__ import annotations

import json
from dataclasses import dataclass

from django.conf import settings

import structlog
from pydantic import BaseModel

from insights.insightsql.constants import LimitContext
from insights.insightsql.errors import ExposedInsightsQLError
from insights.insightsql.parser import parse_select

from insights.api.services.query import process_query_dict
from insights.errors import ExposedCHQueryError

logger = structlog.get_logger(__name__)

# The longest query the model may send, and the most rows worth reading back. The
# engine caps the query itself at MAX_SELECT_INSIGHTS_AI_LIMIT (500) under the
# INSIGHTS_AI limit context; this is the smaller cap on what enters the window.
MAX_QUERY_CHARS = 4000
MAX_ROWS = 50


@dataclass(frozen=True)
class Result:
    """One tool call's outcome. `failed` is what the loop counts, so a failure has
    to be a value the model can read rather than an exception it cannot."""

    content: str
    failed: bool = False


DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "schema",
            "description": (
                "List the tables in this project, or, given a table, its columns and their types. "
                "Call this before writing a query rather than guessing a name."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "table": {
                        "type": "string",
                        "description": "A table name to describe. Omit to list the tables.",
                    }
                },
                "required": [],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query",
            "description": (
                "Run a read-only InsightsQL SELECT against this project's data and return the rows. "
                "InsightsQL is SQL with Datastore functions: use count() not count(*), "
                "properties.$browser for event properties, person.properties.x for person properties, "
                "and always bound the events table by timestamp. Aggregate in SQL; only the first rows "
                "are returned. Only SELECT parses."
            ),
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string", "description": "The InsightsQL SELECT to run."}},
                "required": ["query"],
                "additionalProperties": False,
            },
        },
    },
]


def _render(payload: dict, *, trim: str) -> str:
    """Payload as JSON, halving `payload[trim]` until it fits the character budget.

    The list is halved rather than the text being cut, because a truncated JSON
    document reads as a complete one and the model would draw a conclusion from
    half a row. What was dropped is always stated, so a total is never inferred
    from a trimmed result.
    """
    budget = settings.INSIGHTS_AI_MAX_TOOL_RESULT_CHARS
    while True:
        text = json.dumps(payload, default=str)
        items = payload[trim]
        if len(text) <= budget or not items:
            return text
        kept = items[: len(items) // 2]
        payload = {**payload, trim: kept, "returned": len(kept), "truncated": True}


def _query(arguments: dict, *, team) -> Result:
    query = arguments.get("query")
    if not isinstance(query, str) or not query.strip():
        return Result("`query` must be a non-empty InsightsQL SELECT.", failed=True)
    if len(query) > MAX_QUERY_CHARS:
        return Result(f"`query` must be at most {MAX_QUERY_CHARS} characters.", failed=True)

    try:
        parse_select(query)
    except ExposedInsightsQLError as error:
        return Result(f"Not a runnable InsightsQL SELECT: {error}", failed=True)

    response = process_query_dict(
        team,
        {"kind": "InsightsQLQuery", "query": query},
        limit_context=LimitContext.INSIGHTS_AI,
    )
    if isinstance(response, BaseModel):
        response = response.model_dump()

    if response.get("error"):
        return Result(f"The query failed: {response['error']}", failed=True)

    rows = list(response.get("results") or [])
    payload = {
        "columns": response.get("columns") or [],
        "rows": rows[:MAX_ROWS],
        "returned": min(len(rows), MAX_ROWS),
    }
    # Either this cut the rows, or the engine's own limit did. Both mean the same
    # thing to a reader: this is not everything, so do not total it.
    if len(rows) > MAX_ROWS or response.get("hasMore"):
        payload["truncated"] = True
    return Result(_render(payload, trim="rows"))


def _schema(arguments: dict, *, team) -> Result:
    response = process_query_dict(team, {"kind": "DatabaseSchemaQuery"})
    if isinstance(response, BaseModel):
        response = response.model_dump()
    tables = response.get("tables") or {}

    wanted = arguments.get("table")
    if not wanted:
        names = sorted(tables)
        return Result(_render({"tables": names, "returned": len(names)}, trim="tables"))

    table = tables.get(wanted)
    if table is None:
        return Result(f"There is no table called {wanted!r}. Call schema with no table to list them.", failed=True)

    columns = [f"{name}: {field.get('type')}" for name, field in (table.get("fields") or {}).items()]
    return Result(_render({"table": wanted, "columns": columns, "returned": len(columns)}, trim="columns"))


_TOOLS = {"schema": _schema, "query": _query}


def run(name: str, arguments: str, *, team) -> Result:
    """Run one tool call against `team`'s data.

    Never raises: the loop that calls this is mid-stream, and a failure the model
    can read is worth more than an exception the user sees as a dead reply. Only
    errors the query API already exposes to callers are quoted back; anything
    else is logged, because an internal error can repeat what was sent to it.
    """
    tool = _TOOLS.get(name)
    if tool is None:
        return Result(f"There is no tool called {name!r}. There is {' and '.join(sorted(_TOOLS))}.", failed=True)

    try:
        arguments_json = json.loads(arguments or "{}")
    except ValueError:
        return Result("Arguments were not valid JSON.", failed=True)
    if not isinstance(arguments_json, dict):
        return Result("Arguments must be a JSON object.", failed=True)

    try:
        return tool(arguments_json, team=team)
    except (ExposedInsightsQLError, ExposedCHQueryError) as error:
        return Result(f"The query failed: {error}", failed=True)
    except Exception:
        logger.exception("insights_ai.tool_failed", tool=name)
        return Result("The tool failed for an internal reason. Do not run it again.", failed=True)
