"""The assistant's conversation API.

Four things the client needs: open a thread, say something and read the reply as
it is written, list past threads, and re-open one.

TENANCY. Two keys, both read off the request rather than the body: the project
comes from the URL and is authorized by `TeamAndOrgViewSetMixin` (which also
supplies authentication and team-membership permissions), and the user comes from
the authenticated session. A thread is private to its author, so every read is
filtered by both and a miss is a 404 — never an empty success. The boundary is
the pair of keys, not the secrecy of an id.

The client mints the conversation UUID so it can render a thread before the
server has seen it, so an id arriving here is untrusted input and is looked up
unscoped before anything is done with it. On the read paths a row belonging to
anyone else answers 404, identically to a row that does not exist. On `create`
the two are distinguishable — someone else's id is refused while an unused one
opens a thread — so a caller holding a UUID can learn that it is in use. That is
a property of get-or-create under a caller-chosen key, and the exposure is one
bit about a v4 UUID somebody would already have to possess.

COST AND OCCUPANCY. Each reply spends money at the gateway and holds a
request-serving worker for its whole duration, and neither is covered by the
global throttle — `rate_limit.py` returns early for any authenticated request
without a personal API key, which is every request the browser makes. Both are
therefore bounded here: see `get_throttles`, the reply slots, and the caps in
settings.
"""

import json
import time
import uuid
import threading
from collections.abc import Iterable, Iterator
from typing import Any

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import QuerySet
from django.http import HttpResponse, StreamingHttpResponse
from django.utils import timezone

import structlog
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import BaseThrottle, UserRateThrottle

from insights import iam
from insights.api.routing import TeamAndOrgViewSetMixin
from insights.api.shared import UserBasicSerializer
from insights.api.streaming import sse_streaming_response
from insights.iam import IamUnavailable
from insights.models.team import Team
from insights.renderers import SafeJSONRenderer, ServerSentEventRenderer

from products.insights_ai.backend import assistant
from products.insights_ai.backend.models import Conversation, ConversationMessage

logger = structlog.get_logger(__name__)

# How many past threads the history panel gets, and how much of each. It renders
# them all at once, so this response is the product of the two — bounded here
# because nothing else bounds it. The thread you actually open is fetched whole
# by `retrieve`, which is capped by INSIGHTS_AI_MAX_MESSAGES.
HISTORY_LIMIT = 30
HISTORY_MESSAGES_PER_CONVERSATION = 20

# Wire values, shared with the client's AssistantMessageType.
HUMAN = "human"
ASSISTANT = "ai"
FAILURE = "ai/failure"

# Named events, shared with the client's AssistantEventType.
EVENT_CONVERSATION = "conversation"
EVENT_MESSAGE = "message"
EVENT_STATUS = "status"

FAILURE_CONTENT = "Something went wrong while answering. Please try again."

# How often the generator asks whether it has been cancelled, in deltas. A read
# per delta would be a query per token; this is often enough that Stop feels
# immediate and rare enough to be free.
CANCEL_POLL_DELTAS = 24

# `trace_id` is stored in a 64-char column and is echoed back to the client. An
# unchecked value is a DataError raised after the response headers are on the
# wire, where it can no longer become a 400.
MAX_TRACE_ID_LENGTH = 64


def _sse(event: str, payload: dict) -> bytes:
    """One named Server-Sent Event. `json.dumps` escapes newlines, so the payload
    cannot break out of its `data:` line."""
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n".encode()


class _ReplySlots:
    """Permits for concurrent generations in this process.

    A streamed reply holds its worker until it finishes. Unit gives this app one
    thread per process unless told otherwise, and the same pool serves login, the
    SPA shell and every other API call, so an uncapped assistant can starve the
    product just by being used. Past the cap the answer is a 429 the client
    already knows how to show, which is a far better failure than a frozen app.

    Released through the response's resource closers, which Django calls when the
    response completes OR when the client disconnects, and again from the
    generator's own `finally`. Both are idempotent, and a permit that is taken
    but never streamed is still returned.
    """

    def __init__(self, limit: int) -> None:
        self._semaphore = threading.BoundedSemaphore(max(1, limit))

    def take(self) -> "_Permit | None":
        if not self._semaphore.acquire(blocking=False):
            return None
        return _Permit(self._semaphore)


class _Permit:
    def __init__(self, semaphore: threading.BoundedSemaphore) -> None:
        self._semaphore = semaphore
        self._returned = False
        self._lock = threading.Lock()

    def release(self) -> None:
        with self._lock:
            if self._returned:
                return
            self._returned = True
        self._semaphore.release()


_reply_slots = _ReplySlots(settings.INSIGHTS_AI_MAX_CONCURRENT_REPLIES)


class _AssistantThrottle(UserRateThrottle):
    """Per-user, and actually applied.

    The fork's own throttles exempt any authenticated request that carries no
    personal API key, which is every request a browser session makes, so they
    cannot bound this endpoint. This keys on the user id and reads its rate from
    settings rather than DEFAULT_THROTTLE_RATES, so enabling it needs no global
    configuration.
    """

    rate: str = ""

    def __init__(self) -> None:
        self.rate = self.get_configured_rate()
        super().__init__()

    def get_configured_rate(self) -> str:
        raise NotImplementedError


class AssistantBurstThrottle(_AssistantThrottle):
    scope = "insights_ai_burst"

    def get_configured_rate(self) -> str:
        return settings.INSIGHTS_AI_RATE_BURST


class AssistantDailyThrottle(_AssistantThrottle):
    scope = "insights_ai_daily"

    def get_configured_rate(self) -> str:
        return settings.INSIGHTS_AI_RATE_DAILY


class ConversationSerializer(serializers.ModelSerializer):
    """The thread's own state — the client's `Conversation`."""

    user = UserBasicSerializer(read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "user", "status", "title", "created_at", "updated_at", "type"]


class ConversationDetailSerializer(ConversationSerializer):
    """The thread and everything said in it — the client's `ConversationDetail`."""

    messages = serializers.SerializerMethodField()

    class Meta(ConversationSerializer.Meta):
        fields = [*ConversationSerializer.Meta.fields, "messages"]

    def get_messages(self, conversation: Conversation) -> list[dict]:
        messages = list(conversation.messages.all())
        limit = self.context.get("message_limit")
        if limit is not None:
            messages = messages[-limit:]
        return [render_message(message) for message in messages]


def replayable_turns(messages: Iterable[ConversationMessage]) -> list[dict]:
    """The stored thread as turns the model may be shown, oldest-first.

    Only what the model actually said is replayed as the model's words. A
    CLIENT-sourced assistant message is real — it is in the transcript and the
    user can see it — but replaying it would let a caller write the assistant's
    half of the conversation and have the model treat it as its own prior
    reasoning, and would charge them for re-reading it on every later turn.

    Failure notices are dropped too: they are the product apologising, not part
    of what was said.
    """
    turns: list[dict] = []
    for message in messages:
        if not message.content:
            continue
        if message.type == HUMAN:
            turns.append({"role": "user", "content": message.content})
        elif message.type == ASSISTANT and message.source == ConversationMessage.Source.MODEL:
            turns.append({"role": "assistant", "content": message.content})
    return turns


def render_message(message: ConversationMessage) -> dict:
    """A stored turn in the shape the client's RootAssistantMessage union expects."""
    rendered = {"id": str(message.id), "type": message.type, "content": message.content}
    if message.trace_id:
        rendered["trace_id"] = message.trace_id
    return rendered


class ConversationViewSet(TeamAndOrgViewSetMixin, viewsets.GenericViewSet):
    # No API scope of its own. INTERNAL means APIScopePermission does not gate on
    # a scope string, so this surface needs no new scope registered in three
    # places — it does NOT mean session-only: a legacy personal API key with no
    # scopes is allowed through by permissions.py, as it is for every other
    # INTERNAL endpoint. Team membership is still checked either way.
    scope_object = "INTERNAL"
    queryset = Conversation.objects.all()
    serializer_class = ConversationDetailSerializer
    renderer_classes = [SafeJSONRenderer, ServerSentEventRenderer]

    def get_throttles(self) -> list[BaseThrottle]:
        # Only the writes. Reads are cheap and the UI makes them on every mount,
        # so throttling them would break the product rather than protect it.
        if self.action in ("create", "append_message"):
            return [AssistantBurstThrottle(), AssistantDailyThrottle()]
        return []

    def safely_get_queryset(self, queryset: QuerySet[Conversation]) -> QuerySet[Conversation]:
        # The mixin filters by team; this adds the second half of the key. A
        # conversation belongs to one person, not to everyone on the project.
        return queryset.filter(user=self.request.user).prefetch_related("messages")

    def list(self, request: Request, *args, **kwargs) -> Response:
        conversations = self.get_queryset().select_related("user")[:HISTORY_LIMIT]
        data = ConversationDetailSerializer(
            conversations,
            many=True,
            context={"message_limit": HISTORY_MESSAGES_PER_CONVERSATION},
        ).data
        return Response({"results": data})

    def retrieve(self, request: Request, *args, **kwargs) -> Response:
        return Response(ConversationDetailSerializer(self.get_object()).data)

    @action(detail=True, methods=["POST"])
    def append_message(self, request: Request, *args, **kwargs) -> Response:
        """Record a turn in the thread without generating a reply.

        The support-ticket prompt uses this to leave its confirmation in the
        transcript, so the note survives a reload like any other message. Stored
        as CLIENT-sourced: it is shown as the assistant speaking, but it is not
        replayed to the model as though the model had said it.
        """
        conversation = self.get_object()
        content = request.data.get("content")
        if not isinstance(content, str) or not content.strip():
            raise ValidationError({"content": "Must be a non-empty string."})
        if len(content) > assistant.MAX_CONTENT_LENGTH:
            raise ValidationError({"content": f"Must be at most {assistant.MAX_CONTENT_LENGTH} characters."})
        self._refuse_if_full(conversation)

        message = ConversationMessage.objects.create(
            conversation=conversation,
            type=ASSISTANT,
            source=ConversationMessage.Source.CLIENT,
            content=content,
        )
        return Response({"id": str(message.id)}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["PATCH"])
    def cancel(self, request: Request, *args, **kwargs) -> Response:
        """Ask a generation in flight to stop.

        Marks the thread CANCELING; the generator notices between deltas, keeps
        what it has and settles. This is what actually ends the upstream call —
        the client aborting its fetch does not, because the generator only learns
        of that when a write fails, which on a quiet stream may be never. It
        reaches a generation on another replica too, which a process-local flag
        would not.
        """
        conversation = self.get_object()
        if conversation.status == Conversation.Status.IN_PROGRESS:
            Conversation.objects.filter(pk=conversation.pk, status=Conversation.Status.IN_PROGRESS).update(
                status=Conversation.Status.CANCELING, updated_at=timezone.now()
            )
        else:
            # Nothing is running: settle rather than leave it marked CANCELING,
            # which nothing would then clear.
            self._settle(conversation)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def create(self, request: Request, *args, **kwargs) -> Response | StreamingHttpResponse | HttpResponse:
        """Say something, and stream the reply.

        POST rather than GET because it appends to the thread; the response is an
        event stream because the client renders the answer as it is written.
        """
        content = request.data.get("content")
        trace_id = request.data.get("trace_id") or None
        ui_context = request.data.get("ui_context")

        if content is not None:
            if not isinstance(content, str):
                raise ValidationError({"content": "Must be a string."})
            if len(content) > assistant.MAX_CONTENT_LENGTH:
                raise ValidationError({"content": f"Must be at most {assistant.MAX_CONTENT_LENGTH} characters."})
        if trace_id is not None:
            if not isinstance(trace_id, str) or len(trace_id) > MAX_TRACE_ID_LENGTH:
                raise ValidationError({"trace_id": f"Must be a string of at most {MAX_TRACE_ID_LENGTH} characters."})

        conversation, is_new = self._get_or_open(request.data.get("conversation"))

        # A null message means "pick up the generation already running". Generation
        # only ever runs inside the request that started it, so there is never one
        # to pick up: a thread still marked in-progress is the residue of a request
        # that died. Settle it and close, rather than leaving the UI spinning.
        if content is None:
            if conversation.status != Conversation.Status.IDLE:
                conversation = self._settle(conversation)
            return self._stream([_sse(EVENT_CONVERSATION, self._meta(conversation))])

        self._refuse_if_full(conversation)

        try:
            # Fail before a single byte of stream is committed, so an identity
            # problem is an HTTP error the client can retry rather than an
            # apology rendered as the assistant's own words.
            iam.service_token()
        except IamUnavailable:
            logger.exception("insights_ai.iam_unavailable")
            return Response(
                {"detail": "The assistant is unavailable because this deployment could not authenticate."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        permit = _reply_slots.take()
        if permit is None:
            response = Response(
                {"detail": "The assistant is busy. Please try again in a moment."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
            response["Retry-After"] = "5"
            return response

        stream = self._stream(self._generate(conversation, self.team, content, trace_id, ui_context, is_new, permit))
        # Django runs these when the response finishes or the client disconnects,
        # so a permit taken for a stream that is never consumed still comes back.
        stream._resource_closers.append(permit.release)
        return stream

    # Internals

    def _refuse_if_full(self, conversation: Conversation) -> None:
        """A thread has a maximum length.

        Every turn is replayed into later requests and returned by the read
        endpoints, so an unbounded thread is unbounded cost in both directions.
        """
        if conversation.messages.count() >= settings.INSIGHTS_AI_MAX_MESSAGES:
            raise ValidationError(
                {
                    "conversation": (
                        f"This conversation has reached {settings.INSIGHTS_AI_MAX_MESSAGES} messages. "
                        "Start a new one to continue."
                    )
                }
            )

    def _get_or_open(self, raw_id: Any) -> tuple[Conversation, bool]:
        """Resolve the client-minted id, or open a thread under it.

        Fails closed on the read side: a well-formed id belonging to another user
        or another project answers 404. Opening under an unused id succeeds, so
        `create` does distinguish an id in use from a free one — see the module
        docstring for why that is acceptable here.
        """
        if not raw_id:
            return (
                Conversation.objects.create(team=self.team, user=self.request.user),
                True,
            )

        try:
            conversation_id = uuid.UUID(str(raw_id))
        except (ValueError, AttributeError, TypeError):
            raise ValidationError({"conversation": "Must be a UUID."})

        existing = self._owned_or_refused(conversation_id)
        if existing is not None:
            return existing, False

        try:
            with transaction.atomic():
                return (
                    Conversation.objects.create(id=conversation_id, team=self.team, user=self.request.user),
                    True,
                )
        except IntegrityError:
            # Two requests raced to open the same client-minted id — the client
            # sends it on every message, so a double-submit is enough. The row
            # now exists; re-resolve it under the same ownership check rather
            # than turning a race into a 500.
            settled = self._owned_or_refused(conversation_id)
            if settled is None:
                raise NotFound("Conversation not found.")
            return settled, False

    def _owned_or_refused(self, conversation_id: uuid.UUID) -> "Conversation | None":
        """The thread under this id if it is the caller's, None if there is none.

        Looked up unscoped on purpose: a scoped miss would fall through to a
        create and collide on the primary key. Someone else's row is refused
        here, so nothing downstream ever holds one.
        """
        existing = Conversation.objects.filter(pk=conversation_id).first()
        if existing is None:
            return None
        if existing.team_id != self.team.id or existing.user_id != self.request.user.pk:
            raise NotFound("Conversation not found.")
        return existing

    def _meta(self, conversation: Conversation) -> dict:
        """The thread's own state, for the client's conversation cache. Deliberately
        the message-free serializer: the turns are already on the wire as their own
        events, and asking for them here would be a query whose result is thrown away."""
        return ConversationSerializer(conversation).data

    def _settle(self, conversation: Conversation) -> Conversation:
        """Return the thread to rest, and say when that happened.

        `updated_at` is `auto_now`, which only fires on `save()`. These writes are
        `update()` — they must not clobber a field the streaming body is not
        holding — so the timestamp is set explicitly, or the history list would
        order threads by when they were opened rather than last used.
        """
        Conversation.objects.filter(pk=conversation.pk).update(
            status=Conversation.Status.IDLE, updated_at=timezone.now()
        )
        conversation.refresh_from_db()
        return conversation

    def _stream(self, chunks: Iterable[bytes]) -> StreamingHttpResponse | HttpResponse:
        """The reply as an event stream, or 503 once this process is at its cap.

        The wrapper releases the request thread's database connections before the
        first chunk. Insights runs CONN_MAX_AGE = 0, so a connection still open
        when the stream opens stays pinned to a pgbouncer slot until the stream
        ends — and an assistant reply runs for minutes, so at any real number of
        concurrent chats that is the pool. It also sets the no-buffering headers
        this used to set by hand, and counts the stream on the SSE metrics every
        other stream here is already counted on.
        """
        return sse_streaming_response(chunks, endpoint="ai_conversation")

    def _cancelled(self, conversation: Conversation) -> bool:
        return Conversation.objects.filter(pk=conversation.pk, status=Conversation.Status.CANCELING).exists()

    def _generate(
        self,
        conversation: Conversation,
        team: Team,
        content: str,
        trace_id: str | None,
        ui_context: Any,
        is_new: bool,
        permit: _Permit,
    ) -> Iterator[bytes]:
        """Persist the turn, then stream the reply.

        Ordering matters: the human turn and the thread's own metadata are stored
        and emitted before the model is called, so a generation that fails still
        leaves a thread that reloads correctly.

        `team` is passed in rather than read back off `conversation`, because this
        body runs after the view has returned — while the response is being
        streamed — and there is no reason to make it depend on a lazy foreign key
        at that point.

        The loop ends on any of three things: the model finishing, the deadline,
        or the thread being marked CANCELING. Whatever has arrived by then is
        kept, because a partial answer is worth more than a discarded one.
        """
        try:
            turns = replayable_turns(conversation.messages.all())

            with transaction.atomic():
                human = ConversationMessage.objects.create(
                    conversation=conversation,
                    type=HUMAN,
                    source=ConversationMessage.Source.CLIENT,
                    content=content,
                    trace_id=trace_id,
                )
                # Heterogeneous by construction: a status, a timestamp, and
                # sometimes a title, splatted into one update().
                fields: dict[str, Any] = {"status": Conversation.Status.IN_PROGRESS, "updated_at": timezone.now()}
                if not conversation.title:
                    fields["title"] = content.strip()[:200] or "New chat"
                Conversation.objects.filter(pk=conversation.pk).update(**fields)
                conversation.refresh_from_db()

            turns.append({"role": "user", "content": content})

            if is_new:
                yield _sse(EVENT_CONVERSATION, self._meta(conversation))
            yield _sse(EVENT_STATUS, {"type": "ack"})
            # Replaces the provisional bubble the client drew on send, matched by trace_id.
            yield _sse(EVENT_MESSAGE, render_message(human))

            # A temp- id marks a message as still being written; the client replaces it
            # in place until the final one arrives under a real id.
            streaming_id = f"temp-{uuid.uuid4()}"
            parts: list[str] = []
            deadline = time.monotonic() + settings.INSIGHTS_AI_REPLY_TIMEOUT_SECONDS

            try:
                messages = assistant.build_messages(turns, team=team, ui_context=ui_context)
                # The same team the mixin authorized for this request, and the only
                # project the reply's tool calls can read.
                for index, delta in enumerate(assistant.stream_reply(messages, team=team)):
                    parts.append(delta)
                    yield _sse(EVENT_MESSAGE, {"id": streaming_id, "type": ASSISTANT, "content": "".join(parts)})
                    if time.monotonic() > deadline:
                        logger.warning("insights_ai.generation_deadline", conversation_id=str(conversation.pk))
                        break
                    if index % CANCEL_POLL_DELTAS == 0 and self._cancelled(conversation):
                        break
            except Exception:
                # The reason belongs in the log, not in the stream: an upstream error
                # can quote back what was sent to it.
                logger.exception("insights_ai.generation_failed", conversation_id=str(conversation.pk))
                failure = ConversationMessage.objects.create(
                    conversation=conversation, type=FAILURE, content=FAILURE_CONTENT
                )
                yield _sse(EVENT_MESSAGE, render_message(failure))
                yield _sse(EVENT_STATUS, {"type": "generation_error"})
                yield _sse(EVENT_CONVERSATION, self._meta(self._settle(conversation)))
                return

            reply = ConversationMessage.objects.create(
                conversation=conversation,
                type=ASSISTANT,
                source=ConversationMessage.Source.MODEL,
                content="".join(parts),
            )
            yield _sse(EVENT_MESSAGE, render_message(reply))
            # Close with the thread's settled state. Without this the client keeps the
            # in-progress copy it was handed at the start, and the next mount tries to
            # reconnect to a generation that finished.
            yield _sse(EVENT_CONVERSATION, self._meta(self._settle(conversation)))
        finally:
            # Also released by the response's resource closer; both are one-shot.
            permit.release()
