"""Shared helpers used across Insights Slack App Temporal activities.

These helpers exist outside the activity modules so that any activity in
``slack_app.activities.*`` can use them without forcing a cross-module import
between activity files.
"""

from typing import Any

from slack_sdk.errors import SlackApiError


def block_if_team_over_quota(
    *,
    integration: Any,
    slack: Any,
    channel: str,
    thread_ts: str,
    slack_user_id: str,
    context: str,
) -> bool:
    """Whether a Slack-bot turn should be refused for being over its AI credits quota.

    Always False: AI credits were metered by billing, which this fork does not carry, so a turn is
    never denied for quota. Kept as the single seam the activity modules call so the refusal path
    stays in one place.
    """
    return False


# Reaction errors that should never abort a follow-up activity — the 👀/🔍 reaction is purely
# cosmetic UX feedback, so a deleted/unreachable message or a missing reaction is a no-op.
_BENIGN_REACTION_ERRORS = frozenset({"already_reacted", "message_not_found", "no_reaction", "cant_react"})


def safe_react(client: Any, channel: str, timestamp: str, name: str) -> None:
    try:
        client.reactions_add(channel=channel, timestamp=timestamp, name=name)
    except SlackApiError as e:
        if e.response.get("error") in _BENIGN_REACTION_ERRORS:
            pass
        else:
            raise


def swap_reaction(client: Any, channel: str, timestamp: str, remove: str, add: str) -> None:
    """Replace one reaction with another; a missing old reaction is a no-op."""
    try:
        client.reactions_remove(channel=channel, timestamp=timestamp, name=remove)
    except Exception:
        pass
    safe_react(client, channel, timestamp, add)
