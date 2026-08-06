from insights.settings.utils import get_from_env, get_list, str_to_bool

HUBSPOT_APP_CLIENT_ID = get_from_env("HUBSPOT_APP_CLIENT_ID", "")
HUBSPOT_APP_CLIENT_SECRET = get_from_env("HUBSPOT_APP_CLIENT_SECRET", "")

SNAPCHAT_APP_CLIENT_ID = get_from_env("SNAPCHAT_APP_CLIENT_ID", "")
SNAPCHAT_APP_CLIENT_SECRET = get_from_env("SNAPCHAT_APP_CLIENT_SECRET", "")

INTERCOM_APP_CLIENT_ID = get_from_env("INTERCOM_APP_CLIENT_ID", "")
INTERCOM_APP_CLIENT_SECRET = get_from_env("INTERCOM_APP_CLIENT_SECRET", "")

# Resend registers a confidential OAuth client (token_endpoint_auth_method=client_secret_post) via
# its dynamic client registration API (POST https://api.resend.com/oauth/register). Empty defaults
# keep the app importable and the OAuth auth method dormant until the client is provisioned.
RESEND_APP_CLIENT_ID = get_from_env("RESEND_APP_CLIENT_ID", "")
RESEND_APP_CLIENT_SECRET = get_from_env("RESEND_APP_CLIENT_SECRET", "")

SALESFORCE_CONSUMER_KEY = get_from_env("SALESFORCE_CONSUMER_KEY", "")
SALESFORCE_CONSUMER_SECRET = get_from_env("SALESFORCE_CONSUMER_SECRET", "")

LINKEDIN_APP_CLIENT_ID = get_from_env("LINKEDIN_APP_CLIENT_ID", "")
LINKEDIN_APP_CLIENT_SECRET = get_from_env("LINKEDIN_APP_CLIENT_SECRET", "")

GOOGLE_ADS_APP_CLIENT_ID = get_from_env("GOOGLE_ADS_APP_CLIENT_ID", "")
GOOGLE_ADS_APP_CLIENT_SECRET = get_from_env("GOOGLE_ADS_APP_CLIENT_SECRET", "")
GOOGLE_ADS_DEVELOPER_TOKEN = get_from_env("GOOGLE_ADS_DEVELOPER_TOKEN", "")

GOOGLE_SEARCH_CONSOLE_APP_CLIENT_ID = get_from_env("GOOGLE_SEARCH_CONSOLE_APP_CLIENT_ID", "")
GOOGLE_SEARCH_CONSOLE_APP_CLIENT_SECRET = get_from_env("GOOGLE_SEARCH_CONSOLE_APP_CLIENT_SECRET", "")

GOOGLE_ANALYTICS_APP_CLIENT_ID = get_from_env("GOOGLE_ANALYTICS_APP_CLIENT_ID", "")
GOOGLE_ANALYTICS_APP_CLIENT_SECRET = get_from_env("GOOGLE_ANALYTICS_APP_CLIENT_SECRET", "")

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = get_from_env("SOCIAL_AUTH_GOOGLE_OAUTH2_KEY", "")
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = get_from_env("SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET", "")

LINEAR_APP_CLIENT_ID = get_from_env("LINEAR_APP_CLIENT_ID", "")
LINEAR_APP_CLIENT_SECRET = get_from_env("LINEAR_APP_CLIENT_SECRET", "")

GITHUB_APP_CLIENT_ID = get_from_env("GITHUB_APP_CLIENT_ID", "")
GITHUB_APP_PRIVATE_KEY = get_from_env("GITHUB_APP_PRIVATE_KEY", "")
# OAuth *secret* for the same GitHub App as above - generated in the App's settings
# when "Request user authorization during installation" is enabled.
# Used with GITHUB_APP_CLIENT_ID to exchange an authorization code for a user access token,
# which is separate from the private key used for App-as-App JWT signing.
GITHUB_APP_CLIENT_SECRET = get_from_env("GITHUB_APP_CLIENT_SECRET", "")

# Stamphog runs as its own dedicated GitHub App (separate identity from the core
# GITHUB_APP_* above), so it carries its own App id, JWT-signing private key, and
# webhook secret. Empty defaults keep the app importable when Stamphog is unconfigured.
STAMPFN_GITHUB_APP_ID = get_from_env("STAMPFN_GITHUB_APP_ID", "")
STAMPFN_GITHUB_APP_PRIVATE_KEY = get_from_env("STAMPFN_GITHUB_APP_PRIVATE_KEY", "")
STAMPFN_GITHUB_APP_WEBHOOK_SECRET = get_from_env("STAMPFN_GITHUB_APP_WEBHOOK_SECRET", "")
# OAuth client id/secret for the Stamphog App's user-to-server authorization flow (enabled via
# "Request user authorization during installation"). Used to exchange the post-install `code` for a
# user access token and prove the caller actually owns the installation before its repos are bound to
# their team. Separate from the JWT-signing private key above. Empty until the App is provisioned, in
# which case installation binding fails closed.
STAMPFN_GITHUB_APP_CLIENT_ID = get_from_env("STAMPFN_GITHUB_APP_CLIENT_ID", "")
STAMPFN_GITHUB_APP_CLIENT_SECRET = get_from_env("STAMPFN_GITHUB_APP_CLIENT_SECRET", "")
# URL-friendly App name in github.com/apps/<slug>; the install URL is built from it. Empty until
# the App is provisioned, in which case the install-info endpoint returns a blank install URL.
STAMPFN_GITHUB_APP_SLUG = get_from_env("STAMPFN_GITHUB_APP_SLUG", "")
# Extra outbound domains the review sandbox may reach, on top of the built-in allowlist (GitHub,
# PyPI, the LLM gateway host, the Insights capture host). Comma-separated; an ops escape hatch for
# when a legitimate dependency host is missing — never a way to open the sandbox wide.
STAMPFN_SANDBOX_EXTRA_EGRESS_DOMAINS = get_list(get_from_env("STAMPFN_SANDBOX_EXTRA_EGRESS_DOMAINS", ""))

ZENDESK_ADMIN_EMAIL = get_from_env("ZENDESK_ADMIN_EMAIL", "")
ZENDESK_API_TOKEN = get_from_env("ZENDESK_API_TOKEN", "")
ZENDESK_SUBDOMAIN = get_from_env("ZENDESK_SUBDOMAIN", "insightshelp")

META_ADS_APP_CLIENT_ID = get_from_env("META_ADS_APP_CLIENT_ID", "")
META_ADS_APP_CLIENT_SECRET = get_from_env("META_ADS_APP_CLIENT_SECRET", "")

BING_ADS_CLIENT_ID = get_from_env("BING_ADS_CLIENT_ID", "")
BING_ADS_CLIENT_SECRET = get_from_env("BING_ADS_CLIENT_SECRET", "")
BING_ADS_CLIENT_ID_FALLBACK = get_from_env("BING_ADS_CLIENT_ID_FALLBACK", "")
BING_ADS_CLIENT_SECRET_FALLBACK = get_from_env("BING_ADS_CLIENT_SECRET_FALLBACK", "")
BING_ADS_DEVELOPER_TOKEN = get_from_env("BING_ADS_DEVELOPER_TOKEN", "")

REDDIT_ADS_CLIENT_ID = get_from_env("REDDIT_ADS_CLIENT_ID", "")
REDDIT_ADS_CLIENT_SECRET = get_from_env("REDDIT_ADS_CLIENT_SECRET", "")

PINTEREST_ADS_CLIENT_ID = get_from_env("PINTEREST_ADS_CLIENT_ID", "")
PINTEREST_ADS_CLIENT_SECRET = get_from_env("PINTEREST_ADS_CLIENT_SECRET", "")

TIKTOK_ADS_CLIENT_ID = get_from_env("TIKTOK_ADS_CLIENT_ID", "")
TIKTOK_ADS_CLIENT_SECRET = get_from_env("TIKTOK_ADS_CLIENT_SECRET", "")

CLICKUP_APP_CLIENT_ID = get_from_env("CLICKUP_APP_CLIENT_ID", "")
CLICKUP_APP_CLIENT_SECRET = get_from_env("CLICKUP_APP_CLIENT_SECRET", "")

ATLASSIAN_APP_CLIENT_ID = get_from_env("ATLASSIAN_APP_CLIENT_ID", "")
ATLASSIAN_APP_CLIENT_SECRET = get_from_env("ATLASSIAN_APP_CLIENT_SECRET", "")

# Stripe requires a more complex OAuth setup: we authenticate with Stripe, then exchange tokens
# with our internal OAuth system to allow the Stripe app to make API calls to users' Insights instances.
# We also support their agentic provisioning protocol which requires us to check even more stuff
# - STRIPE_APP_CLIENT_ID: The app's public client ID, used in the OAuth authorize redirect URL
# - STRIPE_APP_OVERRIDE_AUTHORIZE_URL: Optional override for testing (e.g., with a channel link URL)
# - STRIPE_APP_SECRET_KEY: API secret key used for HTTP Basic auth during live token exchange/refresh
# - STRIPE_INSIGHTS_OAUTH_CLIENT_ID: Client ID of the Insights OAuthApplication for Stripe to authenticate with Insights APIs
# - STRIPE_SIGNING_SECRET: Used to verify the authenticity of incoming webhook/agentic provisioning requests from Stripe
STRIPE_APP_CLIENT_ID = get_from_env("STRIPE_APP_CLIENT_ID", "")
STRIPE_APP_OVERRIDE_AUTHORIZE_URL = get_from_env("STRIPE_APP_OVERRIDE_AUTHORIZE_URL", "")
STRIPE_APP_SECRET_KEY = get_from_env("STRIPE_APP_SECRET_KEY", "")
STRIPE_INSIGHTS_OAUTH_CLIENT_ID = get_from_env("STRIPE_INSIGHTS_OAUTH_CLIENT_ID", "")
STRIPE_SIGNING_SECRET = get_from_env("STRIPE_SIGNING_SECRET", "")

# WorkOS Radar (bot/fraud detection for auth flows)
WORKOS_RADAR_API_KEY = get_from_env("WORKOS_RADAR_API_KEY", "")
WORKOS_RADAR_ENABLED = get_from_env("WORKOS_RADAR_ENABLED", False, type_cast=str_to_bool)

# Cloudflare Turnstile (challenge verification for Radar "challenge" verdict)
CLOUDFLARE_TURNSTILE_SECRET_KEY = get_from_env("CLOUDFLARE_TURNSTILE_SECRET_KEY", "")
CLOUDFLARE_TURNSTILE_SITE_KEY = get_from_env("CLOUDFLARE_TURNSTILE_SITE_KEY", "")

# PandaDoc (for legal documents: BAA/DPA). One template per document variant.
# Each call needs the matching template id, so we keep them as separate env vars —
# rotating one (e.g., when Legal updates the DPA copy) doesn't touch the others.
PANDADOC_API_BASE_URL = get_from_env("PANDADOC_API_BASE_URL", "https://api.pandadoc.com")
PANDADOC_API_KEY = get_from_env("PANDADOC_API_KEY", "")
PANDADOC_WEBHOOK_SECRET = get_from_env("PANDADOC_WEBHOOK_SECRET", "")
PANDADOC_BAA_TEMPLATE_ID = get_from_env("PANDADOC_BAA_TEMPLATE_ID", "")
PANDADOC_DPA_TEMPLATE_ID = get_from_env("PANDADOC_DPA_TEMPLATE_ID", "")

# Unlayer (server-side email design → HTML rendering for message templates)
UNLAYER_API_KEY = get_from_env("UNLAYER_API_KEY", "")
UNLAYER_API_BASE_URL = get_from_env("UNLAYER_API_BASE_URL", "https://api.unlayer.com")

HEATMAP_BROWSERLESS_URL = get_from_env("HEATMAP_BROWSERLESS_URL", "")
HEATMAP_BROWSERLESS_TOKEN = get_from_env("HEATMAP_BROWSERLESS_TOKEN", "")
# Browserless /screenshot session cap (ms); must stay under the plan's max-timeout.
HEATMAP_BROWSERLESS_TIMEOUT_MS = get_from_env("HEATMAP_BROWSERLESS_TIMEOUT_MS", 180000, type_cast=int)
HEATMAP_BROWSERLESS_CONNECT_TIMEOUT_MS = get_from_env("HEATMAP_BROWSERLESS_CONNECT_TIMEOUT_MS", 30000, type_cast=int)
HEATMAP_BROWSERLESS_BLOCK_ADS = get_from_env("HEATMAP_BROWSERLESS_BLOCK_ADS", False, type_cast=str_to_bool)

# Insights connect — lets a user connect (via the target's OAuth consent flow) to another Insights
# project to drive its APIs, e.g. dispatching a Task that must run in that project (including one in
# another region, to reach region-resident data). The target may be in a different region OR the
# same one as the connecting project — same-region is just "target region == your region". The
# connecting side is the OAuth *client*: it redirects to the target region's /oauth/authorize and
# exchanges the code against its /oauth/token, so it needs that region's registered app credentials
# plus its public base URL. One entry per region a user may connect TO (your own included). Empty
# defaults keep the app importable until the OAuthApplications are provisioned in each region, in
# which case the connect flow fails closed for the unconfigured region.
INSIGHTS_CONNECT_OAUTH_CLIENT_ID_US = get_from_env("INSIGHTS_CONNECT_OAUTH_CLIENT_ID_US", "")
INSIGHTS_CONNECT_OAUTH_CLIENT_SECRET_US = get_from_env("INSIGHTS_CONNECT_OAUTH_CLIENT_SECRET_US", "")
INSIGHTS_CONNECT_OAUTH_CLIENT_ID_EU = get_from_env("INSIGHTS_CONNECT_OAUTH_CLIENT_ID_EU", "")
INSIGHTS_CONNECT_OAUTH_CLIENT_SECRET_EU = get_from_env("INSIGHTS_CONNECT_OAUTH_CLIENT_SECRET_EU", "")
INSIGHTS_CONNECT_OAUTH_CLIENT_ID_DEV = get_from_env("INSIGHTS_CONNECT_OAUTH_CLIENT_ID_DEV", "")
INSIGHTS_CONNECT_OAUTH_CLIENT_SECRET_DEV = get_from_env("INSIGHTS_CONNECT_OAUTH_CLIENT_SECRET_DEV", "")
# Public base URL of each target cell's OAuth server. DEV points at the local instance so the flow
# is exercisable end to end against a single dev stack; override via env for a custom dev host.
INSIGHTS_CONNECT_BASE_URL_US = get_from_env("INSIGHTS_CONNECT_BASE_URL_US", "https://us.hanzo.ai")
INSIGHTS_CONNECT_BASE_URL_EU = get_from_env("INSIGHTS_CONNECT_BASE_URL_EU", "https://eu.hanzo.ai")
INSIGHTS_CONNECT_BASE_URL_DEV = get_from_env("INSIGHTS_CONNECT_BASE_URL_DEV", "http://localhost:8000")

# Legacy OAuth client credentials kept alive during an app or secret rotation.
# Refreshes fall back to these when the primary credentials fail, so tokens issued
# by a since-migrated app keep working until users reconnect.
OAUTH_CLIENT_FALLBACKS: dict[str, dict[str, str]] = {
    "bing-ads": {
        "client_id": BING_ADS_CLIENT_ID_FALLBACK,
        "client_secret": BING_ADS_CLIENT_SECRET_FALLBACK,
    },
}

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
