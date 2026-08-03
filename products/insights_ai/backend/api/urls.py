"""Assistant routes, served at `/v1/` — not under `/api/`.

The client normalizes a URL by appending a trailing slash, so every pattern here
accepts one optionally, the way the DRF router does for `/api/`.

`parent_lookup_team_id` is not decoration: it is the kwarg name
`TeamAndOrgViewSetMixin` reads to learn which project was asked for, and then
authorizes. A path segment names a resource; it never asserts tenancy.
"""

from django.urls import re_path

from .conversations import ConversationViewSet

_CONVERSATIONS = r"^projects/(?P<parent_lookup_team_id>[0-9]+)/assistant/conversations"
_UUID = r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"

urlpatterns = [
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
