"""The assistant's reply, streamed from the Hanzo AI gateway.

The gateway (`HANZO_API_URL`) speaks the OpenAI chat-completions dialect, so this
uses the `openai` client already in the dependency set rather than hand-rolling
SSE parsing. Nothing here knows about HTTP requests or Django models: it takes
turns and yields text, which is what makes it testable without a database.

AUTHENTICATION. The bearer is minted by `insights.iam` — this deployment's own
IAM identity, the same one the recording API presents. There is no key in
settings, none in the image, and none reachable from the browser: the user's own
token never leaves insights-web, and the gateway only ever sees the deployment.
"""

from collections.abc import Iterator

from django.conf import settings

import structlog
from openai import OpenAI

from insights import iam

logger = structlog.get_logger(__name__)

# The client refuses anything longer, and says so in those words.
MAX_CONTENT_LENGTH = 40000

# A reply that has not started after this long is a failure, not a slow thought.
_TIMEOUT_SECONDS = 120

# Bounds on what one request may carry. A thread grows without limit, so replay
# the recent past rather than all of it, and cap the attached context: both feed
# straight into a priced context window.
_MAX_REPLAYED_TURNS = 40
_MAX_CONTEXT_CHARS = 8000

_SYSTEM_PROMPT = """You are Max, the AI assistant inside Hanzo Insights, a product analytics tool.

You are talking to a member of the {organization} organization, working in the project "{project}".

What you can do: explain product analytics concepts, help someone reason about what \
to measure, describe how to build an insight, funnel, retention or trends query in \
Insights, interpret numbers a user pastes or describes, and help word a hypothesis.

What you cannot do: you have no access to this project's data. You cannot run a query, \
read an event, open a dashboard, or look up a number. If you are asked for a figure, say \
plainly that you cannot read the data and describe where in Insights the user can find it. \
Never invent a metric, a count, or a trend, and never describe a number as though you had \
looked it up.

Be concise and concrete. Prefer a short answer to a long one. Use Markdown."""


def system_prompt(team) -> str:
    """The assistant's standing instructions, including which project it is in."""
    return _SYSTEM_PROMPT.format(
        organization=team.organization.name,
        project=team.name,
    )


def render_context(ui_context) -> str:
    """A bounded, plain-text rendering of what the user has on screen.

    The client sends whatever the current scene exposes. It is user-controlled
    data, so it is fed in as a user turn rather than as instructions, and it is
    truncated: an unbounded paste would otherwise set the size of a priced
    request.
    """
    if not ui_context:
        return ""
    text = str(ui_context)
    if len(text) > _MAX_CONTEXT_CHARS:
        text = text[:_MAX_CONTEXT_CHARS] + "… (truncated)"
    return text


def build_messages(turns: list[dict], *, team, ui_context=None) -> list[dict]:
    """Turns plus standing instructions, in the gateway's wire shape.

    `turns` is the thread oldest-first, each `{"role": ..., "content": ...}`.
    """
    messages: list[dict] = [{"role": "system", "content": system_prompt(team)}]

    context = render_context(ui_context)
    if context:
        messages.append(
            {
                "role": "user",
                "content": f"For reference, this is what I have open in Insights right now:\n{context}",
            }
        )

    messages.extend(turns[-_MAX_REPLAYED_TURNS:])
    return messages


def stream_reply(messages: list[dict]) -> Iterator[str]:
    """Yield the reply as it arrives, one delta at a time.

    Raises rather than yielding an apology, so the caller decides what a failed
    generation looks like on the wire.
    """
    client = OpenAI(
        base_url=f"{settings.HANZO_API_URL}/v1",
        # Raises IamUnavailable rather than sending an unauthenticated request.
        api_key=iam.service_token(),
        timeout=_TIMEOUT_SECONDS,
        max_retries=1,
    )

    stream = client.chat.completions.create(
        model=settings.INSIGHTS_AI_MODEL,
        messages=messages,  # type: ignore[arg-type]
        stream=True,
    )

    for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content
