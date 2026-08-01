from __future__ import annotations

from products.cdp.backend.models.insights_functions.insights_function import InsightsFunctionType


def humanize_insights_function_type(hog_type: str | None) -> str:
    """Return a human friendly label for a Script function type."""

    if not hog_type:
        return "script function"

    if hog_type == InsightsFunctionType.SOURCE_WEBHOOK:
        return "source"

    return hog_type.replace("_", " ")
