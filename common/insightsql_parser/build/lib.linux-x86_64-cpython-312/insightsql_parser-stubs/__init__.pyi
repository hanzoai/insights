from insights.insightsql.ast import Program, SelectQuery, SelectSetQuery
from insights.insightsql.base import AST

def parse_expr(expr: str, /, *, is_internal: bool = False) -> AST:
    """Parse the InsightsQL expression string into an AST.

    If the expr `is_internal`, spans and notices won't be included in the AST.
    """
    ...

def parse_order_expr(expr: str, /, *, is_internal: bool = False) -> AST:
    """Parse the ORDER BY clause string into an AST.

    If the expr `is_internal`, spans and notices won't be included in the AST.
    """
    ...

def parse_select(expr: str, /, *, is_internal: bool = False) -> SelectQuery | SelectSetQuery:
    """Parse the InsightsQL SELECT statement string into an AST.

    If the expr `is_internal`, spans and notices won't be included in the AST.
    """
    ...

def parse_full_template_string(expr: str, /, *, is_internal: bool = False) -> AST:
    """Parse an IQL template string into an AST.

    If the expr `is_internal`, spans and notices won't be included in the AST.
    """
    ...

def parse_string_literal_text(value: str, /) -> str:
    """Unquote the string (an identifier or a string literal).

    If the expr is `internal`, spans and notices won't be included in the AST.
    """
    ...

def parse_program(source: str, /, *, is_internal: bool = False) -> Program:
    """Parse an IQL program.

    If the expr `is_internal`, spans and notices won't be included in the AST.
    """
    ...

def parse_expr_json(expr: str, /, *, is_internal: bool = False) -> str:
    """Parse the InsightsQL expression string into a JSON AST.

    If the expr `is_internal`, spans and notices won't be included in the AST.
    """
    ...

def parse_order_expr_json(expr: str, /, *, is_internal: bool = False) -> str:
    """Parse the ORDER BY clause string into a JSON AST.

    If the expr `is_internal`, spans and notices won't be included in the AST.
    """
    ...

def parse_select_json(expr: str, /, *, is_internal: bool = False) -> str:
    """Parse the InsightsQL SELECT statement string into a JSON AST.

    If the expr `is_internal`, spans and notices won't be included in the AST.
    """
    ...

def parse_full_template_string_json(expr: str, /, *, is_internal: bool = False) -> str:
    """Parse an IQL template string into a JSON AST.

    If the expr `is_internal`, spans and notices won't be included in the AST.
    """
    ...

def parse_program_json(source: str, /, *, is_internal: bool = False) -> str:
    """Parse an IQL program into a JSON AST.

    If the expr `is_internal`, spans and notices won't be included in the AST.
    """
    ...
