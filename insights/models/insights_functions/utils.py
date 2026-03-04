from __future__ import annotations

from insights.models.insights_functions.insights_function import InsightsFunctionType


def humanize_insights_function_type(script_type: str | None) -> str:
    """Return a human friendly label for a Custom function type."""

    if not iql_type:
        return "custom function"

    if iql_type == InsightsFunctionType.SOURCE_WEBHOOK:
        return "source"

    return iql_type.replace("_", " ")
