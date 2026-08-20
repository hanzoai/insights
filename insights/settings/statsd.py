import os

# Metrics - StatsD. The client is insights/statsd.py; it always writes tags in
# the Telegraf dialect, so there is no dialect to choose here.
STATSD_HOST = os.getenv("STATSD_HOST")
STATSD_PORT = os.getenv("STATSD_PORT", 8125)
STATSD_PREFIX = os.getenv("STATSD_PREFIX", "")
STATSD_SEPARATOR = "_"
