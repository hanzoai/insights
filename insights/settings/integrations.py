from insights.settings.utils import get_from_env, str_to_bool

HUBSPOT_APP_CLIENT_ID = get_from_env("HUBSPOT_APP_CLIENT_ID", "")
HUBSPOT_APP_CLIENT_SECRET = get_from_env("HUBSPOT_APP_CLIENT_SECRET", "")

SNAPCHAT_APP_CLIENT_ID = get_from_env("SNAPCHAT_APP_CLIENT_ID", "")
SNAPCHAT_APP_CLIENT_SECRET = get_from_env("SNAPCHAT_APP_CLIENT_SECRET", "")

INTERCOM_APP_CLIENT_ID = get_from_env("INTERCOM_APP_CLIENT_ID", "")
INTERCOM_APP_CLIENT_SECRET = get_from_env("INTERCOM_APP_CLIENT_SECRET", "")

SALESFORCE_CONSUMER_KEY = get_from_env("SALESFORCE_CONSUMER_KEY", "")
SALESFORCE_CONSUMER_SECRET = get_from_env("SALESFORCE_CONSUMER_SECRET", "")

LINKEDIN_APP_CLIENT_ID = get_from_env("LINKEDIN_APP_CLIENT_ID", "")
LINKEDIN_APP_CLIENT_SECRET = get_from_env("LINKEDIN_APP_CLIENT_SECRET", "")

GOOGLE_ADS_APP_CLIENT_ID = get_from_env("GOOGLE_ADS_APP_CLIENT_ID", "")
GOOGLE_ADS_APP_CLIENT_SECRET = get_from_env("GOOGLE_ADS_APP_CLIENT_SECRET", "")
GOOGLE_ADS_DEVELOPER_TOKEN = get_from_env("GOOGLE_ADS_DEVELOPER_TOKEN", "")

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = get_from_env("SOCIAL_AUTH_GOOGLE_OAUTH2_KEY", "")
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = get_from_env("SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET", "")

LINEAR_APP_CLIENT_ID = get_from_env("LINEAR_APP_CLIENT_ID", "")
LINEAR_APP_CLIENT_SECRET = get_from_env("LINEAR_APP_CLIENT_SECRET", "")

GITHUB_APP_CLIENT_ID = get_from_env("GITHUB_APP_CLIENT_ID", "")
GITHUB_APP_PRIVATE_KEY = get_from_env("GITHUB_APP_PRIVATE_KEY", "")

ZENDESK_ADMIN_EMAIL = get_from_env("ZENDESK_ADMIN_EMAIL", "")
ZENDESK_API_TOKEN = get_from_env("ZENDESK_API_TOKEN", "")
ZENDESK_SUBDOMAIN = get_from_env("ZENDESK_SUBDOMAIN", "insightshelp")

META_ADS_APP_CLIENT_ID = get_from_env("META_ADS_APP_CLIENT_ID", "")
META_ADS_APP_CLIENT_SECRET = get_from_env("META_ADS_APP_CLIENT_SECRET", "")

BING_ADS_CLIENT_ID = get_from_env("BING_ADS_CLIENT_ID", "")
BING_ADS_CLIENT_SECRET = get_from_env("BING_ADS_CLIENT_SECRET", "")
BING_ADS_DEVELOPER_TOKEN = get_from_env("BING_ADS_DEVELOPER_TOKEN", "")

REDDIT_ADS_CLIENT_ID = get_from_env("REDDIT_ADS_CLIENT_ID", "")
REDDIT_ADS_CLIENT_SECRET = get_from_env("REDDIT_ADS_CLIENT_SECRET", "")

TIKTOK_ADS_CLIENT_ID = get_from_env("TIKTOK_ADS_CLIENT_ID", "")
TIKTOK_ADS_CLIENT_SECRET = get_from_env("TIKTOK_ADS_CLIENT_SECRET", "")

CLICKUP_APP_CLIENT_ID = get_from_env("CLICKUP_APP_CLIENT_ID", "")
CLICKUP_APP_CLIENT_SECRET = get_from_env("CLICKUP_APP_CLIENT_SECRET", "")

ATLASSIAN_APP_CLIENT_ID = get_from_env("ATLASSIAN_APP_CLIENT_ID", "")
ATLASSIAN_APP_CLIENT_SECRET = get_from_env("ATLASSIAN_APP_CLIENT_SECRET", "")

# WorkOS Radar (bot/fraud detection for auth flows)
WORKOS_RADAR_API_KEY = get_from_env("WORKOS_RADAR_API_KEY", "")
WORKOS_RADAR_ENABLED = get_from_env("WORKOS_RADAR_ENABLED", False, type_cast=str_to_bool)

# Recall.ai (for desktop recordings product)
RECALL_AI_API_KEY = get_from_env("RECALL_AI_API_KEY", "")
RECALL_AI_API_URL = get_from_env("RECALL_AI_API_URL", "https://us-west-2.recall.ai")

# Hanzo AI gateway (backs the Insights assistant). No key here: the deployment
# presents its own IAM identity via `insights.iam`, so there is nothing to rotate
# in this file and nothing that could be baked into a frontend bundle.
HANZO_API_URL = get_from_env("HANZO_API_URL", "https://api.hanzo.ai").rstrip("/")
# A gateway catalogue entry, not a provider model name. Configurable because the
# catalogue moves; the default is checked against it in the assistant's tests.
INSIGHTS_AI_MODEL = get_from_env("INSIGHTS_AI_MODEL", "claude-haiku-4.5")

# A streamed reply is two scarce things at once: money at the gateway, and a
# request-serving worker held for the duration. Both are bounded here.
#
# None of this can be left to the global throttle. InsightsQLQueryThrottle and its
# siblings return True for any authenticated request that carries no personal API
# key (rate_limit.py, allow_request), so a browser session — which is how every
# assistant request arrives — is never throttled by them.
INSIGHTS_AI_MAX_OUTPUT_TOKENS = get_from_env("INSIGHTS_AI_MAX_OUTPUT_TOKENS", 2048, type_cast=int)
# Wall clock for one generation. Also the longest a worker can be held.
INSIGHTS_AI_REPLY_TIMEOUT_SECONDS = get_from_env("INSIGHTS_AI_REPLY_TIMEOUT_SECONDS", 60, type_cast=int)
# Concurrent replies per process. Unit runs this app with one thread per process
# unless NGINX_UNIT_APP_THREADS says otherwise, so a stream that is not capped
# takes the worker that also serves login and the SPA shell.
INSIGHTS_AI_MAX_CONCURRENT_REPLIES = get_from_env("INSIGHTS_AI_MAX_CONCURRENT_REPLIES", 2, type_cast=int)
INSIGHTS_AI_RATE_BURST = get_from_env("INSIGHTS_AI_RATE_BURST", "20/minute")
INSIGHTS_AI_RATE_DAILY = get_from_env("INSIGHTS_AI_RATE_DAILY", "300/day")
# Turns are replayed into every request, so the thread is what sets the size of a
# priced call. Cap the thread itself, and the slice of it that is replayed.
INSIGHTS_AI_MAX_MESSAGES = get_from_env("INSIGHTS_AI_MAX_MESSAGES", 200, type_cast=int)
INSIGHTS_AI_MAX_REPLAYED_CHARS = get_from_env("INSIGHTS_AI_MAX_REPLAYED_CHARS", 24000, type_cast=int)
# The assistant reads the project's data through tools. Every round it spends
# reading is another priced request carrying everything it has read so far, so the
# rounds bound the requests and the characters bound what one result adds.
INSIGHTS_AI_MAX_TOOL_ROUNDS = get_from_env("INSIGHTS_AI_MAX_TOOL_ROUNDS", 6, type_cast=int)
INSIGHTS_AI_MAX_TOOL_RESULT_CHARS = get_from_env("INSIGHTS_AI_MAX_TOOL_RESULT_CHARS", 6000, type_cast=int)

# Standing questions: the assistant asking on a timer, with nobody watching.
#
# Every bound above assumes a person is waiting for the answer and will stop
# asking when it costs too much or takes too long. Nobody is waiting here, so
# these are the only things standing between a scheduler tick and an unbounded
# bill at a metered gateway. Both are caps, not targets.
#
# Wall clock for one asking. Also how long a run may sit unfinished before it is
# taken to be dead: a worker that is killed mid-run leaves a row claiming to be
# in progress, and without an expiry that row would block its question forever.
INSIGHTS_AI_QUESTION_TIMEOUT_SECONDS = get_from_env("INSIGHTS_AI_QUESTION_TIMEOUT_SECONDS", 120, type_cast=int)
# Askings per team per rolling day, across all of that team's questions. Counted
# on the runs themselves, so retries and manual runs are spend like any other.
INSIGHTS_AI_QUESTION_RUNS_PER_DAY = get_from_env("INSIGHTS_AI_QUESTION_RUNS_PER_DAY", 50, type_cast=int)
# Questions one team may keep. Each is a standing claim on the schedule, so the
# per-day cap alone would let one team's questions crowd out its own.
INSIGHTS_AI_MAX_QUESTIONS = get_from_env("INSIGHTS_AI_MAX_QUESTIONS", 20, type_cast=int)
