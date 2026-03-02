from __future__ import annotations

from posthog.models.custom_functions.custom_function import CustomFunctionType


def humanize_custom_function_type(script_type: str | None) -> str:
    """Return a human friendly label for a Custom function type."""

    if not hog_type:
        return "custom function"

    if hog_type == CustomFunctionType.SOURCE_WEBHOOK:
        return "source"

    return hog_type.replace("_", " ")
