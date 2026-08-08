from insights.settings.utils import get_from_env

BROWSERLESS_CDP_URL: str = get_from_env("BROWSERLESS_CDP_URL", "")
BROWSERLESS_TOKEN: str = get_from_env("BROWSERLESS_TOKEN", "")
BROWSERLESS_SESSION_TIMEOUT_MS: int = get_from_env("BROWSERLESS_SESSION_TIMEOUT_MS", 180000, type_cast=int)
BROWSERLESS_CONNECT_TIMEOUT_MS: int = get_from_env("BROWSERLESS_CONNECT_TIMEOUT_MS", 30000, type_cast=int)

# Read by products/exports subscriptions when fanning out asset generation. From `ee/settings.py`
# upstream.
PARALLEL_ASSET_GENERATION_MAX_TIMEOUT_MINUTES: float = get_from_env(
    "PARALLEL_ASSET_GENERATION_MAX_TIMEOUT_MINUTES", 10.0, type_cast=float
)
