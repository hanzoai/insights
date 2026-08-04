"""Standing questions, and what came back from asking them.

TENANCY. One key, read off the request rather than the body: the project comes
from the URL and is authorized by `TeamAndOrgViewSetMixin`. Unlike a conversation
a question is not private to its author — it is a project's standing question,
delivered to everyone who can see the project — so it is scoped by team alone and
`created_by` is provenance rather than a second half of the key.

Runs are read through their question, never looked up on their own, so the team
filter cannot be walked around by holding a run id.
"""

from django.conf import settings

from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response

from insights.api.routing import TeamAndOrgViewSetMixin
from insights.api.shared import UserBasicSerializer

from products.insights_ai.backend import assistant
from products.insights_ai.backend.models import Question, Run

# How many runs one read returns. The history is unbounded and grows on a timer,
# so the endpoint is what has to bound it.
RUNS_LIMIT = 50


class RunSerializer(serializers.ModelSerializer):
    class Meta:
        model = Run
        fields = ["id", "status", "started_at", "finished_at", "answer", "error"]
        read_only_fields = fields


class QuestionSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer(read_only=True)
    due_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Question
        fields = [
            "id",
            "name",
            "prompt",
            "enabled",
            "interval",
            "last_run_at",
            "due_at",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "last_run_at", "due_at", "created_by", "created_at", "updated_at"]

    def validate_prompt(self, value: str) -> str:
        # The same bound the conversation API puts on a turn: this one is asked
        # on a timer, so an oversized prompt is an oversized priced request for
        # as long as the question exists.
        if len(value) > assistant.MAX_CONTENT_LENGTH:
            raise ValidationError(f"Must be at most {assistant.MAX_CONTENT_LENGTH} characters.")
        if not value.strip():
            raise ValidationError("Must not be empty.")
        return value


class QuestionViewSet(TeamAndOrgViewSetMixin, viewsets.ModelViewSet):
    # INTERNAL means APIScopePermission does not gate on a scope string of its
    # own; team membership is still checked. Same posture as the conversations.
    scope_object = "INTERNAL"
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

    def safely_get_queryset(self, queryset):
        return queryset.select_related("created_by")

    def perform_create(self, serializer) -> None:
        kept = Question.objects.filter(team=self.team).count()
        if kept >= settings.INSIGHTS_AI_MAX_QUESTIONS:
            raise ValidationError(
                {
                    "question": (
                        f"This project has reached {settings.INSIGHTS_AI_MAX_QUESTIONS} standing questions. "
                        "Delete one to add another."
                    )
                }
            )
        serializer.save(team=self.team, created_by=self.request.user)

    @action(detail=True, methods=["GET"])
    def runs(self, request: Request, *args, **kwargs) -> Response:
        """What this question has been answered with, newest first."""
        question = self.get_object()
        runs = question.runs.all()[:RUNS_LIMIT]
        return Response({"results": RunSerializer(runs, many=True).data})
