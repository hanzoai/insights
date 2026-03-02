"""Constants for session summaries (migrated from ee/)."""

# Redis TTL for session summary DB data (24 hours)
SESSION_SUMMARIES_DB_DATA_REDIS_TTL = 60 * 60 * 24

# Default model for sync session summaries
SESSION_SUMMARIES_SYNC_MODEL = "gpt-4o-mini"

# Default model for streaming session summaries
SESSION_SUMMARIES_STREAMING_MODEL = "gpt-4o-mini"

# Default model for video understanding
DEFAULT_VIDEO_UNDERSTANDING_MODEL = "gemini-2.0-flash"

# Polling interval for group summaries workflow (ms)
SESSION_GROUP_SUMMARIES_WORKFLOW_POLLING_INTERVAL_MS = 5000

# Min ratio of failed session summaries before aborting group
FAILED_SESSION_SUMMARIES_MIN_RATIO = 0.5

# Min ratio of failed pattern extraction chunks before aborting
FAILED_PATTERNS_EXTRACTION_MIN_RATIO = 0.5

# Min ratio of failed pattern assignments before aborting
FAILED_PATTERNS_ASSIGNMENT_MIN_RATIO = 0.5

# Video export format for full session recordings
FULL_VIDEO_EXPORT_FORMAT = "webm"

# Video export format for moment clips
MOMENT_VIDEO_EXPORT_FORMAT = "webm"

# Min session duration for video summary (seconds)
MIN_SESSION_DURATION_FOR_VIDEO_SUMMARY_S = 5

# Min session duration for summary (milliseconds)
MIN_SESSION_DURATION_FOR_SUMMARY_MS = 3000

# How many days before video exports expire
EXPIRES_AFTER_DAYS = 7

# Max tokens for patterns extraction prompt
PATTERNS_EXTRACTION_MAX_TOKENS = 100000

# Max tokens for a single entity (when oversized session gets its own chunk)
SINGLE_ENTITY_MAX_TOKENS = 200000

# Number of sessions per chunk for pattern assignment
PATTERNS_ASSIGNMENT_CHUNK_SIZE = 10
