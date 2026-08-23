"""Where model calls go, and what they authenticate with.

Upstream declared these in `ee/settings.py`. That tree is not part of this fork, so the
declarations left with it while the code reading them stayed — and a missing setting is not a
missing import, so nothing caught it until a request reached the reader and raised
`AttributeError` as a 500. They live here now, with the concern they belong to.

Every credential defaults empty: a provider is off until something supplies its key, and the
callers already fail closed on that. Only the endpoints carry a default, and the default is
ours rather than a vendor's.
"""

from insights.settings.utils import get_from_env

# The OpenAI protocol is a wire format, not a destination. `insights/llm/completions.py` builds an
# OpenAI client against this URL, so pointing it at api.hanzo.ai keeps the protocol and changes
# the vendor.
OPENAI_BASE_URL: str = get_from_env("OPENAI_BASE_URL", "https://api.hanzo.ai/v1")
OPENAI_API_KEY: str = get_from_env("OPENAI_API_KEY", "")

ANTHROPIC_API_KEY: str = get_from_env("ANTHROPIC_API_KEY", "")
GEMINI_API_KEY: str = get_from_env("GEMINI_API_KEY", "")
INKEEP_API_KEY: str = get_from_env("INKEEP_API_KEY", "")

# Read by products/replay_vision; separate from GEMINI_API_KEY so replay vision can be pointed at
# its own quota without moving every other Gemini caller with it.
REPLAY_VISION_GEMINI_API_KEY: str = get_from_env("REPLAY_VISION_GEMINI_API_KEY", "")
