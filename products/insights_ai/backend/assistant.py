"""The assistant's reply, streamed from the Hanzo AI gateway.

The gateway (`HANZO_API_URL`) speaks the OpenAI chat-completions dialect, so this
uses the `openai` client already in the dependency set rather than hand-rolling
SSE parsing. Nothing here knows about HTTP requests: it takes turns and yields
text, which is what makes it testable without a database.

AUTHENTICATION. The bearer is minted by `insights.iam` — this deployment's own
IAM identity, the same one the recording API presents. There is no key in
settings, none in the image, and none reachable from the browser: the user's own
token never leaves insights-web, and the gateway only ever sees the deployment.

TOOLS. The model can read the project's data, through the two read-only tools in
`tools.py`. `team` is threaded through as a keyword argument from the
authenticated request and handed to every tool call; it is never a tool argument,
so no reply the model writes can move the read to another project. The loop is
bounded in three directions — rounds, calls per round, and characters per result
— because each round is another priced request and each query is work in the
datastore.
"""

from collections.abc import Iterator

from django.conf import settings

import structlog
from openai import OpenAI, omit

from insights import iam

from products.insights_ai.backend import tools

logger = structlog.get_logger(__name__)

# The client refuses anything longer, and says so in those words.
MAX_CONTENT_LENGTH = 40000

# Bounds on what one request may carry. A thread grows without limit, so replay
# the recent past rather than all of it, and cap the attached context: both feed
# straight into a priced context window. The turn count alone is not a bound —
# forty turns of forty thousand characters is a very large request — so the
# characters are what actually caps it.
_MAX_REPLAYED_TURNS = 40
_MAX_CONTEXT_CHARS = 8000

# Tool calls the model may ask for in one round. Rounds are capped in settings;
# without this a single round could still fan out into arbitrarily many queries.
_MAX_CALLS_PER_ROUND = 4

# How many failed tool results are worth feeding back. One is a typo the model
# can fix; a second is a loop, so the next round is offered no tools and has to
# answer in words.
_MAX_CORRECTIONS = 1

_SYSTEM_PROMPT = """You are Max, the AI assistant inside Hanzo Insights, a product analytics tool.

You are talking to a member of the {organization} organization, working in the project "{project}".

You can read this project's data, and only this project's data. `schema` lists the \
tables, or the columns of one table. `query` runs a read-only InsightsQL SELECT and \
returns rows. Look the schema up before you write a query — never guess a table or a \
column name — and if a question is about the product's data, go and read it rather than \
describing how the user could.

Every figure you state must come from a tool result in this conversation. Never invent a \
metric, a count, or a trend, never carry a number over from what you know of other \
products, and never present an example query's output as a real one. If a query fails, or \
returns nothing, or returns fewer rows than it looked at, say so plainly instead of \
filling the gap.

Writing queries: InsightsQL is SQL with Datastore functions. Use count() rather than \
count(*), reach event properties as properties.$browser and person properties as \
person.properties.x, and always bound the events table by timestamp. Aggregate in SQL — \
only the first rows come back, so counting them yourself gives the wrong answer.

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


def recent_turns(turns: list[dict]) -> list[dict]:
    """The tail of the thread that fits the replay budget, oldest-first.

    Walks backwards from the newest turn and stops at the character budget, so
    the size of a request is bounded by the budget rather than by how much the
    caller has written. The newest turn is always included even if it alone
    exceeds the budget — a request that dropped the thing just said would be
    incoherent, and its length is capped separately at MAX_CONTENT_LENGTH.
    """
    kept: list[dict] = []
    spent = 0
    for turn in reversed(turns[-_MAX_REPLAYED_TURNS:]):
        cost = len(turn.get("content") or "")
        if kept and spent + cost > settings.INSIGHTS_AI_MAX_REPLAYED_CHARS:
            break
        kept.append(turn)
        spent += cost
    kept.reverse()
    return kept


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

    messages.extend(recent_turns(turns))
    return messages


class _Turn:
    """One model turn as it streams: the text it writes, and the calls it asks for.

    A tool call arrives in fragments — the id in one chunk, the name in another,
    the arguments a few characters at a time — identified only by their index in
    the turn, so they are reassembled here rather than read off any one chunk.
    """

    def __init__(self) -> None:
        self.text = ""
        self.calls: dict[int, dict] = {}

    def read(self, stream) -> Iterator[str]:
        """Yield text as it arrives, keeping the calls for the caller to run."""
        for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if not delta:
                continue
            if delta.content:
                self.text += delta.content
                yield delta.content
            for part in delta.tool_calls or ():
                call = self.calls.setdefault(part.index, {"id": "", "name": "", "arguments": ""})
                if part.id:
                    call["id"] = part.id
                if part.function and part.function.name:
                    call["name"] = part.function.name
                if part.function and part.function.arguments:
                    call["arguments"] += part.function.arguments

    def ordered(self) -> list[dict]:
        """The calls in the order the model asked for them."""
        return [self.calls[index] for index in sorted(self.calls)]


def _assistant_turn(turn: _Turn) -> dict:
    """The model's own turn, replayed so its tool results have something to attach to."""
    message: dict = {
        "role": "assistant",
        "tool_calls": [
            {"id": call["id"], "type": "function", "function": {"name": call["name"], "arguments": call["arguments"]}}
            for call in turn.ordered()
        ],
    }
    if turn.text:
        message["content"] = turn.text
    return message


def _run(call: dict, position: int, *, team) -> tools.Result:
    """One call, or a refusal if the model asked for more in a round than it may have.

    Every call is answered either way: a turn whose tool calls are not all
    answered is rejected by the gateway, so a refusal has to be a result rather
    than a silence.
    """
    if position >= _MAX_CALLS_PER_ROUND:
        return tools.Result(
            f"Not run: at most {_MAX_CALLS_PER_ROUND} tool calls per turn. Ask for this one again.",
            failed=True,
        )
    return tools.run(call["name"], call["arguments"], team=team)


def _client() -> OpenAI:
    return OpenAI(
        base_url=f"{settings.HANZO_API_URL}/v1",
        # Raises IamUnavailable rather than sending an unauthenticated request.
        api_key=iam.service_token(),
        timeout=settings.INSIGHTS_AI_REPLY_TIMEOUT_SECONDS,
        max_retries=1,
    )


def stream_reply(messages: list[dict], *, team) -> Iterator[str]:
    """Yield the reply as it arrives, running for `team` whatever tools it asks for.

    Text is yielded the moment it arrives in every round, so a reply that stops to
    read the data still streams. Raises rather than yielding an apology, so the
    caller decides what a failed generation looks like on the wire.

    The loop ends when a round asks for no tools. It is bounded by the round cap,
    and by the corrections budget: the first failed result goes back so the model
    can fix it, and after that the next round is offered no tools at all, so two
    bad queries end in an explanation rather than in a retry loop.
    """
    client = _client()
    thread = list(messages)
    corrections = 0

    for index in range(settings.INSIGHTS_AI_MAX_TOOL_ROUNDS + 1):
        # A round with no tools has to answer in words: it is how the loop is made
        # to terminate at the cap, and after the corrections are spent.
        with_tools = index < settings.INSIGHTS_AI_MAX_TOOL_ROUNDS and corrections <= _MAX_CORRECTIONS

        turn = _Turn()
        yield from turn.read(
            client.chat.completions.create(
                model=settings.INSIGHTS_AI_MODEL,
                messages=thread,  # type: ignore[arg-type]
                stream=True,
                # An unbounded reply is unbounded spend and an unbounded worker hold.
                max_tokens=settings.INSIGHTS_AI_MAX_OUTPUT_TOKENS,
                # `omit` is the client's own absent-parameter sentinel: it is dropped
                # before the body is built, so a round with no tools sends none.
                tools=tools.DEFINITIONS if with_tools else omit,  # type: ignore[arg-type]
            )
        )

        calls = turn.ordered()
        if not calls:
            return

        results = [_run(call, position, team=team) for position, call in enumerate(calls)]
        thread.append(_assistant_turn(turn))
        thread.extend(
            {"role": "tool", "tool_call_id": call["id"], "content": result.content}
            for call, result in zip(calls, results)
        )
        if any(result.failed for result in results):
            corrections += 1


def answer(prompt: str, *, team) -> str:
    """The whole reply as one string, for a caller with nobody to stream to.

    The same tool loop: an unattended run reads the project's data exactly as a
    person's question does, and is bounded exactly as tightly.
    """
    return "".join(stream_reply(build_messages([{"role": "user", "content": prompt}], team=team), team=team))
