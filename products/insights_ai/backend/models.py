from typing import TYPE_CHECKING

from django.db import models

import tiktoken

from insights.models.utils import UUIDModel

if TYPE_CHECKING:
    from kafka.producer.kafka import FutureRecordMetadata

EMBEDDING_MODEL_TOKEN_LIMIT = 8192


class AgentMemory(UUIDModel):
    team = models.ForeignKey(
        "insights.Team",
        on_delete=models.CASCADE,
        related_name="agent_memories",
    )
    user = models.ForeignKey(
        "insights.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="agent_memories",
    )
    contents = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["team", "id"]),
        ]

    def embed(self, model_name: str) -> "FutureRecordMetadata":
        enc = tiktoken.get_encoding("cl100k_base")
        token_count = len(enc.encode(self.contents))
        if token_count > EMBEDDING_MODEL_TOKEN_LIMIT:
            raise ValueError(
                f"Memory content exceeds {EMBEDDING_MODEL_TOKEN_LIMIT} token limit for embedding model (got {token_count} tokens)"
            )

        from insights.api.embedding_worker import emit_embedding_request

        embedding_metadata = {**self.metadata}
        if self.user_id is not None:
            embedding_metadata["user_id"] = str(self.user_id)

        return emit_embedding_request(
            content=self.contents,
            team_id=self.team_id,
            product="insights-ai",
            document_type="memory",
            rendering="plaintext",
            document_id=str(self.id),
            models=[model_name],
            timestamp=self.created_at,
            metadata=embedding_metadata,
        )


class Conversation(UUIDModel):
    """One assistant thread, owned by the user who opened it.

    Scoped by BOTH team and user. The team is the tenant boundary the rest of the
    API enforces; the user is the second half, because a thread is private to its
    author rather than shared across a project the way a dashboard is. Reading
    either one off the row means a query can never widen past both.
    """

    class Status(models.TextChoices):
        IDLE = "idle"
        IN_PROGRESS = "in_progress"
        CANCELING = "canceling"

    class Type(models.TextChoices):
        ASSISTANT = "assistant"

    team = models.ForeignKey("insights.Team", on_delete=models.CASCADE, related_name="assistant_conversations")
    user = models.ForeignKey("insights.User", on_delete=models.CASCADE, related_name="assistant_conversations")
    title = models.CharField(max_length=200, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IDLE)
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.ASSISTANT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [models.Index(fields=["team", "user", "-updated_at"])]


class ConversationMessage(UUIDModel):
    """A single turn, stored in the shape the client already reads.

    `type` holds the wire value ("human", "ai", "ai/failure") rather than a private
    enum that would need translating on the way out. One representation, so a
    replayed thread and a streamed one cannot drift.
    """

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    type = models.CharField(max_length=20)
    content = models.TextField(blank=True, default="")
    # Correlates a turn with the client's provisional bubble, so a reconnect
    # replaces that bubble instead of appending a duplicate.
    trace_id = models.CharField(max_length=64, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [models.Index(fields=["conversation", "created_at"])]
