from insights.settings.utils import get_from_env, str_to_bool

PERSONFN_ADDR = get_from_env("PERSONFN_ADDR", "")
PERSONFN_TIMEOUT_MS = get_from_env("PERSONFN_TIMEOUT_MS", 5000, type_cast=int)

# gRPC channel options
PERSONFN_KEEPALIVE_TIME_MS = get_from_env("PERSONFN_KEEPALIVE_TIME_MS", 30_000, type_cast=int)
PERSONFN_KEEPALIVE_TIMEOUT_MS = get_from_env("PERSONFN_KEEPALIVE_TIMEOUT_MS", 5_000, type_cast=int)
PERSONFN_KEEPALIVE_WITHOUT_CALLS = get_from_env("PERSONFN_KEEPALIVE_WITHOUT_CALLS", True, type_cast=str_to_bool)
PERSONFN_MAX_RECONNECT_BACKOFF_MS = get_from_env("PERSONFN_MAX_RECONNECT_BACKOFF_MS", 5_000, type_cast=int)
PERSONFN_INITIAL_RECONNECT_BACKOFF_MS = get_from_env("PERSONFN_INITIAL_RECONNECT_BACKOFF_MS", 1_000, type_cast=int)
PERSONFN_MAX_SEND_MESSAGE_LENGTH = get_from_env("PERSONFN_MAX_SEND_MESSAGE_LENGTH", 4 * 1024 * 1024, type_cast=int)
PERSONFN_MAX_RECV_MESSAGE_LENGTH = get_from_env("PERSONFN_MAX_RECV_MESSAGE_LENGTH", 128 * 1024 * 1024, type_cast=int)
PERSONFN_CLIENT_IDLE_TIMEOUT_MS = get_from_env("PERSONFN_CLIENT_IDLE_TIMEOUT_MS", 0, type_cast=int)

# Retry settings for transient gRPC errors
PERSONFN_MAX_RETRIES = get_from_env("PERSONFN_MAX_RETRIES", 2, type_cast=int)
PERSONFN_INITIAL_BACKOFF_MS = get_from_env("PERSONFN_INITIAL_BACKOFF_MS", 50, type_cast=int)
PERSONFN_MAX_BACKOFF_MS = get_from_env("PERSONFN_MAX_BACKOFF_MS", 1000, type_cast=int)

# Server enforces a hard limit of 250 IDs per batch lookup request for person records.
_PERSONFN_MAX_BATCH_SIZE = 250
PERSONFN_BATCH_SIZE: int = max(
    1, min(get_from_env("PERSONFN_BATCH_SIZE", _PERSONFN_MAX_BATCH_SIZE, type_cast=int), _PERSONFN_MAX_BATCH_SIZE)
)
