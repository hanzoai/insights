from __future__ import annotations

from insights.models.insights_functions.insights_function import InsightsFunctionType


def humanize_insights_function_type(script_type: str | None) -> str:
    """Return a human friendly label for a Custom function type."""

    if not hog_type:
        return "custom function"

    if hog_type == InsightsFunctionType.SOURCE_WEBHOOK:
        return "source"

    return hog_type.replace("_", " ")
