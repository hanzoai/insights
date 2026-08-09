"""Assistant routes, served at `/v1/` — not under `/v1/`.

The client normalizes a URL by appending a trailing slash, so every pattern here
accepts one optionally, the way the DRF router does for `/v1/`.

`parent_lookup_team_id` is not decoration: it is the kwarg name
`TeamAndOrgViewSetMixin` reads to learn which project was asked for, and then
authorizes. A path segment names a resource; it never asserts tenancy.
"""

from django.urls import re_path

from .conversations import ConversationViewSet
from .questions import QuestionViewSet

_CONVERSATIONS = r"^projects/(?P<parent_lookup_team_id>[0-9]+)/assistant/conversations"
_QUESTIONS = r"^projects/(?P<parent_lookup_team_id>[0-9]+)/assistant/questions"
_UUID = r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"

urlpatterns = [
    re_path(
        rf"{_QUESTIONS}/(?P<pk>{_UUID})/runs/?$",
        QuestionViewSet.as_view({"get": "runs"}),
        name="assistant-question-runs",
    ),
    re_path(
        rf"{_QUESTIONS}/(?P<pk>{_UUID})/?$",
        QuestionViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="assistant-question",
    ),
    re_path(
        rf"{_QUESTIONS}/?$",
        QuestionViewSet.as_view({"get": "list", "post": "create"}),
        name="assistant-questions",
    ),
    re_path(
        rf"{_CONVERSATIONS}/(?P<pk>{_UUID})/cancel/?$",
        ConversationViewSet.as_view({"patch": "cancel"}),
        name="assistant-conversation-cancel",
    ),
    re_path(
        rf"{_CONVERSATIONS}/(?P<pk>{_UUID})/messages/?$",
        ConversationViewSet.as_view({"post": "append_message"}),
        name="assistant-conversation-messages",
    ),
    re_path(
        rf"{_CONVERSATIONS}/(?P<pk>{_UUID})/?$",
        ConversationViewSet.as_view({"get": "retrieve"}),
        name="assistant-conversation",
    ),
    re_path(
        rf"{_CONVERSATIONS}/?$",
        ConversationViewSet.as_view({"get": "list", "post": "create"}),
        name="assistant-conversations",
    ),
]
