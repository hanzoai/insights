"""Customer product context for scanner prompts: the team's Max core memory.

It is customer-authored text rendered into the trusted preamble, so it is sanitized (control
chars stripped, backticks replaced, whitespace collapsed, length-capped) before it is stored.
"""

import re
from typing import Any

from insights.llm.semantic_enrichment import get_team_business_context
from insights.models import Team

# CoreMemory.text is model-capped at 10k chars; cap lower since the preamble is resent on every scan step.
_MAX_PRODUCT_CONTEXT_LEN = 4000

# \x0a (newline) is excluded so `keep_newlines` callers can preserve line structure.
_CONTROL_CHARS_RE = re.compile(r"[\x00-\x09\x0b-\x1f\x7f-\x9f]")


def _sanitize(text: str, max_len: int, *, keep_newlines: bool = False) -> str:
    # Backticks become apostrophes because the preamble fences these values as inline code.
    stripped = _CONTROL_CHARS_RE.sub(" ", text).replace("`", "'")
    if keep_newlines:
        lines = [" ".join(line.split()) for line in stripped.split("\n")]
        cleaned = "\n".join(line for line in lines if line)
    else:
        cleaned = " ".join(stripped.split())
    if len(cleaned) > max_len:
        cleaned = cleaned[:max_len] + "…"
    return cleaned


def fetch_product_context(team: Team) -> str:
    """The team's Max core memory, falling back to the project's (deprecated) product description; "" when neither exists."""
    text = get_team_business_context(team)
    if not text:
        text = (team.project.product_description or "").strip()
    # Core memory is one fact per line; keep the newlines so the model sees a list, not a wall of text.
    return _sanitize(text, _MAX_PRODUCT_CONTEXT_LEN, keep_newlines=True)


def fetch_event_descriptions(team: Team, columns: list[str], rows: list[list[Any]]) -> dict[str, str]:
    """Customer-written descriptions for this session's custom events, keyed by name. Always empty.

    A description was a field on the enterprise extension of the event definition, which this fork
    does not carry — the base `EventDefinition` (products/event_definitions/backend/models) has no
    such column, so there is nothing to read and every session's preamble carries no descriptions.
    """
    return {}
