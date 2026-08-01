import uuid
from typing import TypeVar

from django.conf import settings

import structlog
import hanzo_insights
from google.genai.types import ContentListUnion, GenerateContentConfig
from hanzo_insights.ai.gemini import genai
from pydantic import BaseModel
from rest_framework import exceptions

logger = structlog.get_logger(__name__)

T = TypeVar("T", bound=BaseModel)


def create_gemini_client():
    if settings.DEBUG and hanzo_insights.disabled:
        hanzo_insights.disabled = False
        if not hanzo_insights.host:
            hanzo_insights.host = settings.SITE_URL

    insights_client = hanzo_insights.default_client
    if not insights_client:
        logger.warning("Insights default_client not available, AI observability will not be tracked")

    return genai.Client(
        api_key=settings.GEMINI_API_KEY,
        insights_client=insights_client,
    )


def generate_structured_output(
    *,
    model: str,
    system_prompt: str,
    contents: ContentListUnion,
    response_schema: type[T],
    insights_properties: dict | None = None,
    team_id: int | None = None,
    distinct_id: str | None = None,
) -> tuple[T, str]:
    client = create_gemini_client()

    config = GenerateContentConfig(
        system_instruction=system_prompt,
        response_mime_type="application/json",
        response_json_schema=response_schema.model_json_schema(),
    )

    trace_id = str(uuid.uuid4())
    properties = insights_properties or {}

    try:
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=config,
            insights_distinct_id=distinct_id or "",
            insights_trace_id=trace_id,
            insights_properties=properties,
            insights_groups={"project": str(team_id)} if team_id else {},
        )

        if not response.text:
            raise exceptions.ValidationError("Gemini returned empty response")

        return response_schema.model_validate_json(response.text), trace_id

    except exceptions.ValidationError:
        raise
    except Exception:
        logger.exception("Gemini API call failed", model=model, properties=properties)
        raise exceptions.APIException("Failed to generate response")
