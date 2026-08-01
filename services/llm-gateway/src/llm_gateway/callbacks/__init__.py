import litellm
from litellm.integrations.custom_logger import CustomLogger

from llm_gateway.callbacks.insights import InsightsCallback
from llm_gateway.callbacks.prometheus import PrometheusCallback
from llm_gateway.callbacks.rate_limiting import RateLimitCallback
from llm_gateway.config import get_settings


def init_callbacks() -> None:
    settings = get_settings()
    callbacks: list[CustomLogger] = []

    if settings.insights_project_token:
        callbacks.append(
            InsightsCallback(
                api_key=settings.insights_project_token,
                host=settings.insights_host,
                # Reuses the plan-resolver URL — same per-region value.
                region_url=settings.insights_api_base_url,
                secondary_api_key=settings.insights_secondary_project_token,
                secondary_host=settings.insights_secondary_host,
            )
        )

    callbacks.append(RateLimitCallback())
    callbacks.append(PrometheusCallback())

    litellm.callbacks = callbacks
