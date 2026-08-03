"""The assistant's conversation API.

Four things the client needs: open a thread, say something and read the reply as
it is written, list past threads, and re-open one.

TENANCY. Two keys, both read off the request rather than the body: the project
comes from the URL and is authorized by `TeamAndOrgViewSetMixin` (which also
supplies authentication and team-membership permissions), and the user comes from
the authenticated session. A thread is private to its author, so every read is
filtered by both and a miss is a 404 — never an empty success.

The client mints the conversation UUID so it can render a thread before the
server has seen it. That means an id arriving here is untrusted input: it is
looked up unscoped first, and a row belonging to anyone else answers exactly as a
row that does not exist.
"""

import json
import uuid
from collections.abc import Iterator

from django.db import transaction
from django.http import StreamingHttpResponse
from django.utils import timezone

import structlog
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response

from insights import iam
from insights.api.routing import TeamAndOrgViewSetMixin
from insights.api.shared import UserBasicSerializer
from insights.iam import IamUnavailable
from insights.renderers import SafeJSONRenderer, ServerSentEventRenderer

from products.insights_ai.backend import assistant
from products.insights_ai.backend.models import Conversation, ConversationMessage

logger = structlog.get_logger(__name__)

# How many past threads the history panel gets. It renders them all at once, and
# each carries its messages, so this is the bound on that response.
HISTORY_LIMIT = 50

# Wire values, shared with the client's AssistantMessageType.
HUMAN = "human"
ASSISTANT = "ai"
FAILURE = "ai/failure"

# Named events, shared with the client's AssistantEventType.
EVENT_CONVERSATION = "conversation"
EVENT_MESSAGE = "message"
EVENT_STATUS = "status"

FAILURE_CONTENT = "Something went wrong while answering. Please try again."


def _sse(event: str, payload: dict) -> bytes:
    """One named Server-Sent Event. `json.dumps` escapes newlines, so the payload
    cannot break out of its `data:` line."""
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n".encode()


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
        return [render_message(message) for message in conversation.messages.all()]


def render_message(message: ConversationMessage) -> dict:
    """A stored turn in the shape the client's RootAssistantMessage union expects."""
    rendered = {"id": str(message.id), "type": message.type, "content": message.content}
    if message.trace_id:
        rendered["trace_id"] = message.trace_id
    return rendered


class ConversationViewSet(TeamAndOrgViewSetMixin, viewsets.GenericViewSet):
    # Session/OIDC only. A personal API key has no business driving a chat UI, and
    # this way the surface needs no new scope string in three places.
    scope_object = "INTERNAL"
    queryset = Conversation.objects.all()
    serializer_class = ConversationDetailSerializer
    renderer_classes = [SafeJSONRenderer, ServerSentEventRenderer]

    def safely_get_queryset(self, queryset):
        # The mixin filters by team; this adds the second half of the key. A
        # conversation belongs to one person, not to everyone on the project.
        return queryset.filter(user=self.request.user).prefetch_related("messages")

    def list(self, request: Request, *args, **kwargs) -> Response:
        conversations = self.get_queryset().select_related("user")[:HISTORY_LIMIT]
        return Response({"results": ConversationDetailSerializer(conversations, many=True).data})

    def retrieve(self, request: Request, *args, **kwargs) -> Response:
        return Response(ConversationDetailSerializer(self.get_object()).data)

    @action(detail=True, methods=["POST"])
    def append_message(self, request: Request, *args, **kwargs) -> Response:
        """Record a turn in the thread without generating a reply.

        The support-ticket prompt uses this to leave its confirmation in the
        transcript, so the note survives a reload like any other message.
        """
        conversation = self.get_object()
        content = request.data.get("content")
        if not isinstance(content, str) or not content.strip():
            raise ValidationError({"content": "Must be a non-empty string."})
        if len(content) > assistant.MAX_CONTENT_LENGTH:
            raise ValidationError({"content": f"Must be at most {assistant.MAX_CONTENT_LENGTH} characters."})

        message = ConversationMessage.objects.create(conversation=conversation, type=ASSISTANT, content=content)
        return Response({"id": str(message.id)}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["PATCH"])
    def cancel(self, request: Request, *args, **kwargs) -> Response:
        # Generation runs inside the POST that started it, so the client aborting
        # that request is what actually stops the work. This settles the stored
        # status so the thread does not stay stuck as in-progress.
        self._settle(self.get_object())
        return Response(status=status.HTTP_204_NO_CONTENT)

    def create(self, request: Request, *args, **kwargs):
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

        conversation, is_new = self._get_or_open(request.data.get("conversation"))

        # A null message means "pick up the generation already running". Generation
        # only ever runs inside the request that started it, so there is never one
        # to pick up: a thread still marked in-progress is the residue of a request
        # that died. Settle it and close, rather than leaving the UI spinning.
        if content is None:
            if conversation.status != Conversation.Status.IDLE:
                conversation = self._settle(conversation)
            return self._stream([_sse(EVENT_CONVERSATION, self._meta(conversation))])

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

        return self._stream(self._generate(conversation, self.team, content, trace_id, ui_context, is_new))

    # Internals

    def _get_or_open(self, raw_id) -> tuple[Conversation, bool]:
        """Resolve the client-minted id, or open a thread under it.

        Fails closed: a well-formed id belonging to another user or another
        project answers 404, exactly as an id that was never used.
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

        existing = Conversation.objects.filter(pk=conversation_id).first()
        if existing is not None:
            if existing.team_id != self.team.id or existing.user_id != self.request.user.pk:
                raise NotFound("Conversation not found.")
            return existing, False

        return (
            Conversation.objects.create(id=conversation_id, team=self.team, user=self.request.user),
            True,
        )

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

    def _stream(self, chunks) -> StreamingHttpResponse:
        response = StreamingHttpResponse(streaming_content=chunks, content_type=ServerSentEventRenderer.media_type)
        response["Cache-Control"] = "no-cache"
        # Tell any buffering proxy to pass bytes through, or the whole point of
        # streaming is lost at the last hop.
        response["X-Accel-Buffering"] = "no"
        return response

    def _generate(self, conversation, team, content, trace_id, ui_context, is_new) -> Iterator[bytes]:
        """Persist the turn, then stream the reply.

        Ordering matters: the human turn and the thread's own metadata are stored
        and emitted before the model is called, so a generation that fails still
        leaves a thread that reloads correctly.

        `team` is passed in rather than read back off `conversation`, because this
        body runs after the view has returned — while the response is being
        streamed — and there is no reason to make it depend on a lazy foreign key
        at that point.
        """
        turns = [
            {"role": "user" if message.type == HUMAN else "assistant", "content": message.content}
            for message in conversation.messages.all()
            if message.type in (HUMAN, ASSISTANT) and message.content
        ]

        with transaction.atomic():
            human = ConversationMessage.objects.create(
                conversation=conversation, type=HUMAN, content=content, trace_id=trace_id
            )
            fields = {"status": Conversation.Status.IN_PROGRESS, "updated_at": timezone.now()}
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

        try:
            messages = assistant.build_messages(turns, team=team, ui_context=ui_context)
            for delta in assistant.stream_reply(messages):
                parts.append(delta)
                yield _sse(EVENT_MESSAGE, {"id": streaming_id, "type": ASSISTANT, "content": "".join(parts)})
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

        reply = ConversationMessage.objects.create(conversation=conversation, type=ASSISTANT, content="".join(parts))
        yield _sse(EVENT_MESSAGE, render_message(reply))
        # Close with the thread's settled state. Without this the client keeps the
        # in-progress copy it was handed at the start, and the next mount tries to
        # reconnect to a generation that finished.
        yield _sse(EVENT_CONVERSATION, self._meta(self._settle(conversation)))
