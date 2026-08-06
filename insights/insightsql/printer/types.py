from dataclasses import dataclass

from insights.insightsql import ast


@dataclass
class JoinExprResponse:
    printed_sql: str
    where: ast.Expr | None = None
