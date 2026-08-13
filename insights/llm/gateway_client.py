import json
from typing import Literal
from urllib.parse import urlparse
from uuid import UUID, uuid5

from django.conf import settings

import httpx
import structlog

from anthropic import AsyncAnthropic
from openai import AsyncOpenAI, OpenAI

from insights import iam

logger = structlog.get_logger(__name__)

Product = Literal[
    "llm_gateway",
    "ci",
    "insights_code",
    "background_agents",
    "slack_app",
    "slack_app_routing",
    "wizard",
    "django",
    "growth",
    "llma_translation",
    "llma_summarization",
    "llma_eval_summary",
    "slack-twig",
    "customer_archetype_classification",
    "product_analytics",
    "subscriptions",
    "signals",
    "review",
    "custom_image_scans",
    "conversations",
    "warehouse_semantic_enrichment",
    "warehouse_custom_source_builder",
    "web_analytics",
    "stamp",
]  # The tag a generation is attributed to. The gateway takes it as a label, not as a route,
# so adding one here is the whole change.




class GatewayUnavailable(RuntimeError):
    """The gateway could not be addressed: unset, malformed, or IAM would not issue
    a token for the caller.

    Raised rather than silently answered by some other provider. A fallback to a
    credential in the environment would be one tenant's key doing every tenant's
    work, and an unbilled answer from outside the estate is worse than no answer.
    """


def _gateway_misconfig(url: str) -> str | None:
    """Return a reason string if the gateway URL is malformed, else None."""
    # The SDK appends /chat/completions, so base_url must already carry the /v1 path.
    if not urlparse(url).path.rstrip("/").endswith("/v1"):
        return "AI_GATEWAY_URL must include the OpenAI base path, e.g. https://<host>/v1"
    return None


def resolve_ai_gateway_config(user=None) -> tuple[str, str] | None:
    """The gateway URL and the bearer that proves WHO is asking, or None.

    There is no gateway API key, because a key in the environment is one tenant's
    credential doing every tenant's work: the org that pays is read off the
    bearer's IAM claim, so a static one would bill every customer's assistant to
    whoever the key belongs to. The bearer is an IAM token and nothing else.

    Which token depends on who is acting. A request made by a signed-in person
    carries THEIR token, so the call is authorized and billed as them. Work with
    no person behind it — a temporal workflow, an eval — carries this
    deployment's own IAM identity, which is the honest answer to "who asked" when
    nobody did.

    None when the gateway is not configured, and also when the URL is malformed or
    IAM will not issue a token: the caller then takes its normal path rather than
    failing the request outright.
    """
    url = settings.AI_GATEWAY_URL
    if not url:
        return None
    misconfig = _gateway_misconfig(url)
    if misconfig:
        logger.warning("ai_gateway_misconfigured_falling_back", reason=misconfig)
        return None
    try:
        bearer = iam.user_token(user) if user is not None else iam.service_token()
    except iam.IamUnavailable as e:
        logger.warning("ai_gateway_no_identity_falling_back", reason=str(e))
        return None
    return url, bearer


def _ai_property_headers(**labels: str | None) -> dict[str, str] | None:
    """Build the ``X-Insights-Properties`` header from caller labels, dropping unset ones.

    The gateway reads event labels only from this JSON blob, never from a
    ``x-insights-property-<key>`` per-header form. Don't use a ``$ai_`` prefix on a
    key: the gateway strips those as reserved. Returns None when no label is set so
    the client sends no properties header.
    """
    set_labels = {key: value for key, value in labels.items() if value}
    if not set_labels:
        return None
    return {"X-Insights-Properties": json.dumps(set_labels)}


def ai_product_headers(ai_product: str | None) -> dict[str, str] | None:
    """X-Insights-Properties header tagging the captured generation with its AIO product.

    The slugless Go gateway has no product route, so callers pass the product here to keep
    per-product attribution on the shared ``sk-`` token.
    """
    return _ai_property_headers(ai_product=ai_product)


# Fixed, because the id it derives is stored: change this and every team's existing
# generations stop grouping with the ones recorded after.
_TEAM_TRACE_ID_NAMESPACE = UUID("8d4f6b7e-6a3e-4f3a-9f3b-3b6f4d2e8a1a")


def team_trace_id(team_id: int | None) -> str | None:
    """Deterministic ``$ai_trace_id`` for a team, or None when unattributed.

    Absent an ``X-Insights-Trace-Id`` header the Go gateway stamps a fresh id per request, leaving
    every generation in its own trace. Grouping is per team, not per pipeline run.
    """
    if team_id is None:
        return None
    return str(uuid5(_TEAM_TRACE_ID_NAMESPACE, f"team-{team_id}"))


def _ai_trace_headers(team_id: int | None) -> dict[str, str]:
    """``X-Insights-Trace-Id`` header for a team; empty (not None) so callers can splat it."""
    trace_id = team_trace_id(team_id)
    return {"X-Insights-Trace-Id": trace_id} if trace_id else {}


def _anthropic_gateway_base_url(openai_base_url: str) -> str:
    """Drop the OpenAI ``/v1`` suffix so the Anthropic SDK, which appends ``/v1/messages``
    itself, hits the same gateway root the OpenAI route uses. ``resolve_ai_gateway_config``
    guarantees the ``/v1`` suffix, so this is the inverse of that validation.
    """
    trimmed = openai_base_url.rstrip("/")
    if trimmed.endswith("/v1"):
        trimmed = trimmed[: -len("/v1")]
    return trimmed




def _gateway(user=None) -> tuple[str, str]:
    """The gateway URL and the bearer, or raise.

    Every client in this module resolves here, so "which gateway, as whom" is
    answered in exactly one place.
    """
    resolved = resolve_ai_gateway_config(user)
    if resolved is None:
        raise GatewayUnavailable(
            "AI_GATEWAY_URL must name the Hanzo gateway and IAM must issue a token for the caller"
        )
    return resolved


def _labels(
    ai_product: str | None = None,
    ai_stage: str | None = None,
    team_id: int | None = None,
) -> dict[str, str] | None:
    """Every label header a generation carries, or None when it carries none.

    The gateway reads labels from the ``X-Insights-Properties`` JSON blob and the
    trace id from its own header, so both are built together rather than by each
    caller.
    """
    headers = {
        **(
            _ai_property_headers(
                ai_product=ai_product,
                ai_stage=ai_stage,
                team_id=str(team_id) if team_id is not None else None,
            )
            or {}
        ),
        **_ai_trace_headers(team_id),
    }
    return headers or None


def get_llm_client(
    product: Product = "django",
    team_id: int | None = None,
    api_key: str | None = None,
    user=None,
) -> OpenAI:
    """An OpenAI-shaped client on the Hanzo gateway.

    The gateway speaks Chat Completions and routes to whichever backend serves the
    requested model, so a caller passes a model id and nothing else changes.

    ``user`` is who the call is made as: a signed-in person's own IAM token, so the
    request is authorized and billed as them. Omit it for work with no person
    behind it — a scheduled job, an eval — and the call carries this deployment's
    own identity, which is the honest answer to "who asked" when nobody did.
    ``api_key`` overrides the bearer for a caller that already holds a narrower
    credential.

    ``team_id`` attributes the captured generation to a customer team; it does not
    change who is billed, which the gateway derives from the bearer.
    """
    url, bearer = _gateway(user)
    return OpenAI(
        api_key=api_key or bearer,
        base_url=url,
        default_headers=_labels(ai_product=product, team_id=team_id),
        http_client=httpx.Client(trust_env=False),
    )


def get_async_llm_client(
    product: Product = "django",
    team_id: int | None = None,
    api_key: str | None = None,
    user=None,
) -> AsyncOpenAI:
    """Async :func:`get_llm_client`."""
    url, bearer = _gateway(user)
    return AsyncOpenAI(
        api_key=api_key or bearer,
        base_url=url,
        default_headers=_labels(ai_product=product, team_id=team_id),
        http_client=httpx.AsyncClient(trust_env=False),
    )


def get_async_anthropic_gateway_client(
    product: Product = "django",
    team_id: int | None = None,
    api_key: str | None = None,
    user=None,
) -> AsyncAnthropic:
    """An Anthropic-shaped client on the same gateway.

    Prefer this over :func:`get_async_llm_client` for an Anthropic model when the
    request needs Anthropic-native features — assistant prefilling, extended
    thinking, a top-level ``system`` prompt — which the OpenAI shape cannot carry.

    Returns a plain ``anthropic.AsyncAnthropic``, NOT the instrumented
    ``hanzo_insights.ai.anthropic`` one: the gateway captures the generation
    itself, so a wrapped client would capture — and bill — it twice.

    The SDK appends ``/v1/messages``, so this gets the gateway root rather than the
    ``/v1`` base the OpenAI shape takes.
    """
    url, bearer = _gateway(user)
    return AsyncAnthropic(
        api_key=api_key or bearer,
        base_url=_anthropic_gateway_base_url(url),
        default_headers=_labels(ai_product=product, team_id=team_id),
        http_client=httpx.AsyncClient(trust_env=False),
    )


def build_openai_client(
    product: Product,
    ai_product: str | None = None,
    team_id: int | None = None,
    user=None,
) -> OpenAI:
    """:func:`get_llm_client` with the generation tagged ``ai_product`` rather than
    by the calling product."""
    url, bearer = _gateway(user)
    return OpenAI(
        api_key=bearer,
        base_url=url,
        default_headers=_labels(ai_product=ai_product or product, team_id=team_id),
        http_client=httpx.Client(trust_env=False),
    )


def build_async_openai_client(
    product: Product,
    ai_product: str | None = None,
    team_id: int | None = None,
    user=None,
) -> AsyncOpenAI:
    """Async :func:`build_openai_client`."""
    url, bearer = _gateway(user)
    return AsyncOpenAI(
        api_key=bearer,
        base_url=url,
        default_headers=_labels(ai_product=ai_product or product, team_id=team_id),
        http_client=httpx.AsyncClient(trust_env=False),
    )


def build_async_anthropic_client(
    product: Product,
    ai_product: str | None = None,
    ai_stage: str | None = None,
    team_id: int | None = None,
    user=None,
) -> AsyncAnthropic:
    """:func:`get_async_anthropic_gateway_client` with the generation tagged
    ``ai_product`` and ``ai_stage``.

    The gateway fails over between backends on its own, so there is no fallback
    flag for a caller to set.
    """
    url, bearer = _gateway(user)
    return AsyncAnthropic(
        api_key=bearer,
        base_url=_anthropic_gateway_base_url(url),
        default_headers=_labels(ai_product=ai_product or product, ai_stage=ai_stage, team_id=team_id),
        http_client=httpx.AsyncClient(trust_env=False),
    )
