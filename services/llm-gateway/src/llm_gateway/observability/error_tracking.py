from typing import Any

import hanzo_insights
import structlog

from llm_gateway.config import get_settings

logger = structlog.get_logger(__name__)

_initialized = False


def _ensure_initialized() -> bool:
    global _initialized
    if _initialized:
        return True

    settings = get_settings()
    if not settings.insights_project_token:
        return False

    hanzo_insights.api_key = settings.insights_project_token  # ty: ignore[invalid-assignment]
    _initialized = True
    return True


def capture_exception(
    error: Exception | None = None,
    additional_properties: dict[str, Any] | None = None,
) -> None:
    properties = additional_properties or {}

    if not _ensure_initialized():
        return

    try:
        hanzo_insights.capture_exception(
            error,
            distinct_id="llm-gateway-service",
            properties=properties if properties else None,
        )
    except Exception as capture_error:
        logger.warning("failed_to_capture_exception", insights_error=str(capture_error))
