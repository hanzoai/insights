import os
import json
from contextlib import suppress
from typing import Optional
from urllib.parse import urlparse

from django.core.exceptions import ImproperlyConfigured

import dj_database_url

from insights.settings.base_variables import DEBUG, IN_EVAL_TESTING, IS_COLLECT_STATIC, TEST
from insights.settings.utils import get_from_env, get_list, str_to_bool
from insights.utils import str_to_int_set

# See https://docs.djangoproject.com/en/3.2/ref/settings/#std:setting-DATABASE-DISABLE_SERVER_SIDE_CURSORS
DISABLE_SERVER_SIDE_CURSORS: bool = get_from_env("USING_PGBOUNCER", False, type_cast=str_to_bool)
# See https://docs.djangoproject.com/en/3.2/ref/settings/#std:setting-DATABASE-DISABLE_SERVER_SIDE_CURSORS
DEFAULT_AUTO_FIELD: str = "django.db.models.AutoField"

# Configuration for sqlcommenter
SQLCOMMENTER_WITH_FRAMEWORK: bool = False

# Person table configuration
# Controls which PostgreSQL table the Person model uses.
# Default: "insights_person" (legacy non-partitioned table)
# For partitioned table: set PERSON_TABLE_NAME=insights_person_new
# Note: insights_person_new must exist (created by Rust sqlx migrations)
PERSON_TABLE_NAME: str = os.getenv("PERSON_TABLE_NAME", "insights_person")


# Database
# https://docs.djangoproject.com/en/2.2/ref/settings/#databases


def postgres_config(host: str) -> dict:
    """Generate the config map we need for a postgres database.

    Generally all our postgres databases will need the same config - replicas are identical other than host.

    Parameters:
        host (str): The host to connect to

    Returns:
        dict: The config, to be set in django DATABASES
    """

    return {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": get_from_env("INSIGHTS_DB_NAME"),
        "USER": os.getenv("INSIGHTS_DB_USER", "postgres"),
        "PASSWORD": os.getenv("INSIGHTS_DB_PASSWORD", ""),
        "HOST": host,
        "PORT": os.getenv("INSIGHTS_POSTGRES_PORT", "5432"),
        "CONN_MAX_AGE": 0,
        "DISABLE_SERVER_SIDE_CURSORS": DISABLE_SERVER_SIDE_CURSORS,
        "SSL_OPTIONS": {
            "sslmode": os.getenv("INSIGHTS_POSTGRES_SSL_MODE", None),
            "sslrootcert": os.getenv("INSIGHTS_POSTGRES_CLI_SSL_CA", None),
            "sslcert": os.getenv("INSIGHTS_POSTGRES_CLI_SSL_CRT", None),
            "sslkey": os.getenv("INSIGHTS_POSTGRES_CLI_SSL_KEY", None),
        },
        "TEST": {
            "MIRROR": "default",
        },
    }


if TEST or DEBUG:
    PG_HOST: str = os.getenv("PGHOST", "localhost")
    PG_USER: str = os.getenv("PGUSER", "insights")
    PG_PASSWORD: str = os.getenv("PGPASSWORD", "insights")
    PG_PORT: str = os.getenv("PGPORT", "5432")
    PG_DATABASE: str = os.getenv(
        "PGDATABASE",
        # AI evals get their own database, as they fully reuse the DB between runs and only reset once per day, for perf
        "insights_ai_eval" if IN_EVAL_TESTING else "insights",
    )
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"postgres://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DATABASE}",
    )
else:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

if DATABASE_URL:
    DATABASES: dict[str, dict] = {"default": dj_database_url.config(default=DATABASE_URL, conn_max_age=0)}

    if DISABLE_SERVER_SIDE_CURSORS:
        DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True

elif os.getenv("INSIGHTS_DB_NAME"):
    DATABASES = {"default": postgres_config(os.getenv("INSIGHTS_POSTGRES_HOST", "localhost"))}

    ssl_configurations = []
    for ssl_option, value in DATABASES["default"]["SSL_OPTIONS"].items():
        if value:
            ssl_configurations.append("{}={}".format(ssl_option, value))

    if ssl_configurations:
        ssl_configuration = "?{}".format("&".join(ssl_configurations))
    else:
        ssl_configuration = ""

    DATABASE_URL = "postgres://{}{}{}{}:{}/{}{}".format(
        DATABASES["default"]["USER"],
        ":" + DATABASES["default"]["PASSWORD"] if DATABASES["default"]["PASSWORD"] else "",
        "@" if DATABASES["default"]["USER"] or DATABASES["default"]["PASSWORD"] else "",
        DATABASES["default"]["HOST"],
        DATABASES["default"]["PORT"],
        DATABASES["default"]["NAME"],
        ssl_configuration,
    )
else:
    raise ImproperlyConfigured(
        f'The environment vars "DATABASE_URL" or "INSIGHTS_DB_NAME" are absolutely required to run this software'
    )

DATABASE_ROUTERS: list[str] = []

# Configure the database which will be used as a read replica.
# This should have all the same config as our main writer DB, just use a different host.
# Our database router will point here.
read_host = os.getenv("INSIGHTS_POSTGRES_READ_HOST")
if read_host:
    DATABASES["replica"] = postgres_config(read_host)
    DATABASE_ROUTERS.append("insights.dbrouter.ReplicaRouter")

# Configure a direct database connection bypassing PgBouncer.
# This allows using PGOPTIONS like lock_timeout which PgBouncer doesn't support.
# Used for migrations: python manage.py migrate --database=default_direct
direct_host = os.getenv("INSIGHTS_POSTGRES_DIRECT_HOST")
if direct_host:
    # Copy from default database config (works with both DATABASE_URL and INSIGHTS_DB_NAME setups)
    DATABASES["default_direct"] = DATABASES["default"].copy()
    # Override host and port for direct connection (bypassing PgBouncer)
    DATABASES["default_direct"]["HOST"] = direct_host
    DATABASES["default_direct"]["PORT"] = os.getenv("INSIGHTS_POSTGRES_DIRECT_PORT", "5432")
    # Disable server-side cursors is not needed for direct connection
    DATABASES["default_direct"]["DISABLE_SERVER_SIDE_CURSORS"] = False
    # Set lock_timeout for migrations to fail fast on lock contention
    lock_timeout_ms = os.getenv("MIGRATE_LOCK_TIMEOUT", "20000")
    DATABASES["default_direct"]["OPTIONS"] = {"options": f"-c lock_timeout={lock_timeout_ms}"}

# Add the persons_db_writer database configuration using PERSONS_DB_WRITER_URL
# For local development, default to the persons database in the main container if no URL is provided
persons_db_writer_url = os.getenv("PERSONS_DB_WRITER_URL")
if not persons_db_writer_url and DEBUG and not TEST:
    # Default to local persons database in main container in development mode (but not test mode)
    # This matches the docker-compose.dev.yml configuration
    # A default is needed for generate_demo_data to properly populate the correct databases
    # with the demo data
    persons_db_writer_url = f"postgres://{PG_USER}:{PG_PASSWORD}@localhost:5432/insights_persons"
elif not persons_db_writer_url and TEST:
    # In test mode, use a placeholder database name that will be updated by conftest
    # pytest-django adds test_ prefix which isn't known at settings import time
    # conftest.py django_db_setup fixture will update the NAME with the correct test database name
    test_persons_db = PG_DATABASE + "_persons"
    persons_db_writer_url = f"postgres://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{test_persons_db}"

if persons_db_writer_url:
    DATABASES["persons_db_writer"] = dj_database_url.config(
        env="PERSONS_DB_WRITER_URL", default=persons_db_writer_url, conn_max_age=0
    )

    # Fall back to the writer URL if no reader URL is set
    DATABASES["persons_db_reader"] = dj_database_url.config(
        env="PERSONS_DB_READER_URL", default=persons_db_writer_url, conn_max_age=0
    )
    if DISABLE_SERVER_SIDE_CURSORS:
        DATABASES["persons_db_writer"]["DISABLE_SERVER_SIDE_CURSORS"] = True
        DATABASES["persons_db_reader"]["DISABLE_SERVER_SIDE_CURSORS"] = True

    DATABASE_ROUTERS.insert(0, "insights.person_db_router.PersonDBRouter")

# Opt-in to using the read replica
# Models using this will likely see better query latency, and better performance.
# Immediately reading after writing may not return consistent data if done in <100ms
# Pass in model classnames that should use the read replica

# Note: Regardless of settings, cursor usage will use the default DB unless otherwise specified.
# Database routers route models!
replica_opt_in = os.environ.get("READ_REPLICA_OPT_IN", "")
READ_REPLICA_OPT_IN: list[str] = get_list(replica_opt_in)

# Xdist Settings
# When running concurrent tests, PYTEST_XDIST_WORKER gets set to "gw0" ... "gwN"
# We use this setting to create multiple databases to achieve test isolation
PYTEST_XDIST_WORKER: str | None = os.getenv("PYTEST_XDIST_WORKER")
PYTEST_XDIST_WORKER_NUM: int | None = None
SUFFIX = ""
XDIST_SUFFIX = ""
try:
    if PYTEST_XDIST_WORKER is not None:
        XDIST_SUFFIX = f"_{PYTEST_XDIST_WORKER}"
        PYTEST_XDIST_WORKER_NUM = int("".join([x for x in PYTEST_XDIST_WORKER if x.isdigit()]))
except:
    pass

if IN_EVAL_TESTING:
    # AI evals get their own database, as they fully reuse the DB between runs and only reset once per day, for perf
    SUFFIX = "_ai_eval" + XDIST_SUFFIX
elif TEST:
    SUFFIX = "_test" + XDIST_SUFFIX

# Hanzo Datastore. ONE env prefix: DATASTORE_*.
#
# The DATASTORE_* fallback is gone — two spellings for one setting is two ways
# to configure the same thing, and the loser is silent: a stale DATASTORE_HOST
# would be read only when DATASTORE_HOST happened to be unset. Nothing in the
# cluster sets the old names (the App CRs are DATASTORE_*), so this is a rename,
# not a migration.
#
# Internal Python identifiers are still DATASTORE_* — that rename spans ~974
# files and belongs in its own pass, not this one.
DATASTORE_TEST_DB: str = "insights" + SUFFIX

DATASTORE_HOST: str = os.getenv("DATASTORE_HOST", "localhost")
DATASTORE_OFFLINE_CLUSTER_HOST: str | None = os.getenv("DATASTORE_OFFLINE_CLUSTER_HOST", None)
DATASTORE_MIGRATIONS_HOST: str = os.getenv("DATASTORE_MIGRATIONS_HOST", DATASTORE_HOST)
DATASTORE_ENDPOINTS_HOST: str = os.getenv("DATASTORE_ENDPOINTS_HOST", DATASTORE_HOST)
DATASTORE_USER: str = os.getenv("DATASTORE_USER", "default")
DATASTORE_PASSWORD: str = os.getenv("DATASTORE_PASSWORD", "")
DATASTORE_DATABASE: str = DATASTORE_TEST_DB if TEST else os.getenv("DATASTORE_DATABASE", "default")

# RED M1: fail closed on a shared-datastore misconfig. The `insights` database is
# co-resident with o11y/analytics on the shared datastore; running migrations or
# queries against "default"/"system" could read or ALTER another tenant's data.
if not TEST and not IS_COLLECT_STATIC and DATASTORE_DATABASE in ("", "default", "system"):
    raise ImproperlyConfigured(
        f"DATASTORE_DATABASE must name an explicit Insights database "
        f"(got {DATASTORE_DATABASE!r}); refusing to run against a shared/system database."
    )
DATASTORE_CLUSTER: str = os.getenv("DATASTORE_CLUSTER", "insights")
DATASTORE_MIGRATIONS_CLUSTER: str = os.getenv("DATASTORE_MIGRATIONS_CLUSTER", "insights_migrations")
DATASTORE_CA: str | None = os.getenv("DATASTORE_CA", None)
DATASTORE_SECURE: bool = get_from_env("DATASTORE_SECURE", not TEST and not DEBUG, type_cast=str_to_bool)
DATASTORE_VERIFY: bool = get_from_env("DATASTORE_VERIFY", True, type_cast=str_to_bool)
DATASTORE_ENABLE_STORAGE_POLICY: bool = get_from_env("DATASTORE_ENABLE_STORAGE_POLICY", False, type_cast=str_to_bool)
DATASTORE_SINGLE_SHARD_CLUSTER: str = os.getenv("DATASTORE_SINGLE_SHARD_CLUSTER", "insights_single_shard")
DATASTORE_WRITABLE_CLUSTER: str = os.getenv("DATASTORE_WRITABLE_CLUSTER", "insights_writable")
DATASTORE_PRIMARY_REPLICA_CLUSTER: str = os.getenv("DATASTORE_PRIMARY_REPLICA_CLUSTER", "insights_primary_replica")
DATASTORE_FALLBACK_CANCEL_QUERY_ON_CLUSTER = get_from_env(
    "DATASTORE_FALLBACK_CANCEL_QUERY_ON_CLUSTER", default=False, type_cast=str_to_bool
)

DATASTORE_USE_HTTP: str = get_from_env("DATASTORE_USE_HTTP", False, type_cast=str_to_bool)
DATASTORE_USE_HTTP_PER_TEAM = set[int]([])
with suppress(Exception):
    as_json = json.loads(os.getenv("DATASTORE_USE_HTTP_PER_TEAM", "[]"))
    DATASTORE_USE_HTTP_PER_TEAM = {int(v) for v in as_json}

QUERYSERVICE_HOST: str = get_from_env("QUERYSERVICE_HOST", DATASTORE_HOST)
QUERYSERVICE_SECURE: bool = get_from_env("QUERYSERVICE_SECURE", DATASTORE_SECURE, type_cast=str_to_bool)
QUERYSERVICE_VERIFY: bool = get_from_env("QUERYSERVICE_VERIFY", DATASTORE_VERIFY, type_cast=str_to_bool)

DATASTORE_CONN_POOL_MIN: int = get_from_env("DATASTORE_CONN_POOL_MIN", 20, type_cast=int)
DATASTORE_CONN_POOL_MAX: int = get_from_env("DATASTORE_CONN_POOL_MAX", 1000, type_cast=int)

DATASTORE_STABLE_HOST: str = get_from_env("DATASTORE_STABLE_HOST", DATASTORE_HOST)
# If enabled, some queries will use system.cluster table to query each shard
DATASTORE_ALLOW_PER_SHARD_EXECUTION: bool = get_from_env(
    "DATASTORE_ALLOW_PER_SHARD_EXECUTION", False, type_cast=str_to_bool
)

# Logs share the one datastore connection: DATASTORE_HOST / _DATABASE / _USER /
# _PASSWORD / _SECURE, same as every other query product.
#
# They used to carry a parallel DATASTORE_LOGS_CLUSTER_{HOST,PORT,USER,PASSWORD,
# DATABASE,SECURE} family whose defaults were literals ("localhost", "default",
# ""), not the base settings. Nothing in the fleet ever set them, so Logs — and
# only Logs — dialled localhost:9000 and every one of its endpoints answered 500
# while every other product on the same page worked. A per-product connection
# knob that defaults to something other than the connection everything else uses
# cannot be right when unset, so it is gone rather than re-defaulted: there is
# now nothing to configure and nothing to drift.
#
# DATASTORE_LOGS_CLUSTER is the ON CLUSTER topology for the Distributed logs
# table — a DDL concern, not a connection — so it stays.
DATASTORE_LOGS_CLUSTER: str = os.getenv("DATASTORE_LOGS_CLUSTER", "insights_single_shard")
DATASTORE_LOGS_ENABLE_STORAGE_POLICY: bool = get_from_env(
    "DATASTORE_LOGS_ENABLE_STORAGE_POLICY", False, type_cast=str_to_bool
)

DATASTORE_KAFKA_NAMED_COLLECTION: str = os.getenv("DATASTORE_KAFKA_NAMED_COLLECTION", "msk_cluster")
DATASTORE_KAFKA_WARPSTREAM_NAMED_COLLECTION: str = os.getenv(
    "DATASTORE_KAFKA_WARPSTREAM_NAMED_COLLECTION", "warpstream_ingestion"
)

# Per-team settings used for client/pool connection parameters. Note that this takes precedence over any workload-based
# routing. Keys should be strings, not numbers.
try:
    DATASTORE_PER_TEAM_SETTINGS: dict = json.loads(os.getenv("DATASTORE_PER_TEAM_SETTINGS", "{}"))
except Exception:
    DATASTORE_PER_TEAM_SETTINGS = {}

# Per-team settings used for query execution. Keys should be strings, not numbers.
try:
    DATASTORE_PER_TEAM_QUERY_SETTINGS: dict = json.loads(os.getenv("DATASTORE_PER_TEAM_QUERY_SETTINGS", "{}"))
except Exception:
    DATASTORE_PER_TEAM_QUERY_SETTINGS = {}

# Set of teams querying the data before we switched to new limits
API_QUERIES_LEGACY_TEAM_LIST: Optional[set[int]] = None
with suppress(Exception):
    as_json = json.loads(get_from_env("API_QUERIES_LEGACY_TEAM_LIST"))
    API_QUERIES_LEGACY_TEAM_LIST = {int(v) for v in as_json}

# Per-team API /query concurrent limits, e.g. {"2": 7}
API_QUERIES_PER_TEAM: dict[int, int] = {}
with suppress(Exception):
    as_json = json.loads(os.getenv("API_QUERIES_PER_TEAM", "{}"))
    API_QUERIES_PER_TEAM = {int(k): int(v) for k, v in as_json.items()}

_datastore_http_protocol = "http://"
_datastore_http_port = "8123"
if DATASTORE_SECURE:
    _datastore_http_protocol = "https://"
    _datastore_http_port = "8443"

DATASTORE_HTTP_URL: str = f"{_datastore_http_protocol}{DATASTORE_HOST}:{_datastore_http_port}/"

DATASTORE_OFFLINE_HTTP_URL: str = (
    f"{_datastore_http_protocol}{DATASTORE_OFFLINE_CLUSTER_HOST}:{_datastore_http_port}/"
)

if TEST or DEBUG or os.getenv("DATASTORE_OFFLINE_CLUSTER_HOST", None) is None:
    # When testing, there is no offline cluster.
    # Also in EU, there is no offline cluster.
    DATASTORE_OFFLINE_HTTP_URL = DATASTORE_HTTP_URL

READONLY_DATASTORE_USER: str | None = os.getenv("READONLY_DATASTORE_USER", None)
READONLY_DATASTORE_PASSWORD: str | None = os.getenv("READONLY_DATASTORE_PASSWORD", None)


def _parse_kafka_hosts(hosts_string: str) -> list[str]:
    hosts = []
    for host in hosts_string.split(","):
        if "://" in host:
            hosts.append(urlparse(host).netloc)
        else:
            hosts.append(host)

    # We don't want empty strings
    return [host for host in hosts if host]


# URL(s) used by Kafka clients/producers - KEEP IN SYNC WITH plugin-server/src/config/config.ts
# We prefer KAFKA_HOSTS over KAFKA_URL (which used to be used)
KAFKA_HOSTS = _parse_kafka_hosts(os.getenv("KAFKA_HOSTS", "") or os.getenv("KAFKA_URL", "") or "kafka:9092")
# Dedicated kafka hosts for session recordings
SESSION_RECORDING_KAFKA_HOSTS = _parse_kafka_hosts(os.getenv("SESSION_RECORDING_KAFKA_HOSTS", "")) or KAFKA_HOSTS
# Kafka broker host(s) that is used by datastore for ingesting messages.
# Useful if datastore is hosted outside the cluster.
KAFKA_HOSTS_FOR_DATASTORE = _parse_kafka_hosts(os.getenv("KAFKA_URL_FOR_DATASTORE", "")) or KAFKA_HOSTS

# To support e.g. Multi-tenanted plans on Heroko, we support specifying a prefix for
# Kafka Topics. See
# https://devcenter.heroku.com/articles/multi-tenant-kafka-on-heroku#differences-to-dedicated-kafka-plans
# for details.
KAFKA_PREFIX = os.getenv("KAFKA_PREFIX", "")

KAFKA_BASE64_KEYS = get_from_env("KAFKA_BASE64_KEYS", False, type_cast=str_to_bool)

KAFKA_PRODUCER_SETTINGS = {
    key: value
    for key, value in {
        "client_id": get_from_env("KAFKA_PRODUCER_CLIENT_ID", optional=True),
        "metadata_max_age_ms": get_from_env("KAFKA_PRODUCER_METADATA_MAX_AGE_MS", optional=True, type_cast=int),
        "batch_size": get_from_env("KAFKA_PRODUCER_BATCH_SIZE", optional=True, type_cast=int),
        "max_request_size": get_from_env("KAFKA_PRODUCER_MAX_REQUEST_SIZE", optional=True, type_cast=int),
        "linger_ms": get_from_env("KAFKA_PRODUCER_LINGER_MS", optional=True, type_cast=int),
        "partitioner": get_from_env("KAFKA_PRODUCER_PARTITIONER", optional=True),
        "max_in_flight_requests_per_connection": get_from_env(
            "KAFKA_PRODUCER_MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION", optional=True, type_cast=int
        ),
        "buffer_memory": get_from_env("KAFKA_PRODUCER_BUFFER_MEMORY", optional=True, type_cast=int),
        "max_block_ms": get_from_env("KAFKA_PRODUCER_MAX_BLOCK_MS", optional=True, type_cast=int),
    }.items()
    if value is not None
}

SESSION_RECORDING_KAFKA_MAX_REQUEST_SIZE_BYTES: int = get_from_env(
    "SESSION_RECORDING_KAFKA_MAX_REQUEST_SIZE_BYTES",
    1024 * 1024,  # 1MB
    type_cast=int,
)

KAFKA_SECURITY_PROTOCOL = os.getenv("KAFKA_SECURITY_PROTOCOL", None)
SESSION_RECORDING_KAFKA_SECURITY_PROTOCOL = os.getenv(
    "SESSION_RECORDING_KAFKA_SECURITY_PROTOCOL", KAFKA_SECURITY_PROTOCOL
)
KAFKA_SASL_MECHANISM = os.getenv("KAFKA_SASL_MECHANISM", None)
KAFKA_SASL_USER = os.getenv("KAFKA_SASL_USER", None)
KAFKA_SASL_PASSWORD = os.getenv("KAFKA_SASL_PASSWORD", None)

# A list of tokens for which events should be sent to the historical topic
# TODO: possibly remove this and replace with something that provides the
# separation of concerns between realtime and historical ingestion but without
# needing to have a deploy.
TOKENS_HISTORICAL_DATA = os.getenv("TOKENS_HISTORICAL_DATA", "").split(",")

# Hanzo KV is the ONE key/value + cache + celery-broker backend. It speaks the
# Redis (RESP) wire protocol, so the kv:// URL is normalized to redis:// for the
# RESP drivers (redis-py / django_redis / celery). Config surface is KV_URL —
# never REDIS_URL. REDIS_URL below is the derived RESP connection URL, not an env.
def _kv_to_resp(url: str) -> str:
    """Map Hanzo KV's kv:// scheme to the redis:// RESP wire the driver speaks."""
    return "redis://" + url[len("kv://") :] if url.startswith("kv://") else url


if TEST or DEBUG or IS_COLLECT_STATIC:
    if PYTEST_XDIST_WORKER_NUM is not None:
        KV_URL = os.getenv("KV_URL", f"kv://localhost/{PYTEST_XDIST_WORKER_NUM}")
    else:
        KV_URL = os.getenv("KV_URL", "kv://localhost/")
else:
    KV_URL = os.getenv("KV_URL", "")

if not KV_URL and get_from_env("INSIGHTS_KV_HOST", ""):
    KV_URL = "kv://:{}@{}:{}/".format(
        os.getenv("INSIGHTS_KV_PASSWORD", ""),
        os.getenv("INSIGHTS_KV_HOST", ""),
        os.getenv("INSIGHTS_KV_PORT", "6379"),
    )

# RESP connection URL consumed by redis-py / django_redis / celery (Hanzo KV backend).
REDIS_URL = _kv_to_resp(KV_URL)

SESSION_RECORDING_REDIS_URL = REDIS_URL

if get_from_env("INSIGHTS_SESSION_RECORDING_KV_HOST", ""):
    SESSION_RECORDING_REDIS_URL = _kv_to_resp(
        "kv://{}:{}/".format(
            os.getenv("INSIGHTS_SESSION_RECORDING_KV_HOST", ""),
            os.getenv("INSIGHTS_SESSION_RECORDING_KV_PORT", "6379"),
        )
    )

if not REDIS_URL:
    raise ImproperlyConfigured(
        "Env var KV_URL (or INSIGHTS_KV_HOST) is absolutely required to run this software.\n"
        "Hanzo KV backs the cache, celery broker and rate-limits; there is no Redis."
    )

# Controls whether the ZstdCompressor is used for Redis compression when writing to Redis.
# The ZstdCompressor uses zstd compression and can cope with compressed and uncompressed reading at the same time
USE_REDIS_COMPRESSION = get_from_env("USE_REDIS_COMPRESSION", True, type_cast=str_to_bool)

# AWS ElastiCache supports "reader" endpoints.
# See "Finding a Redis (Cluster Mode Disabled) Cluster's Endpoints (Console)"
# on https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/Endpoints.html#Endpoints.Find.Redis
# A reader endpoint distributes read-only connections across all replicas in the cluster.
# ElastiCache manages updating which nodes are used if a replica is failed-over to primary
# so that we don't have to worry about changing config.
REDIS_READER_URL = os.getenv("REDIS_READER_URL", None)

# Ingestion is now using a separate Redis cluster for better resource isolation.
# Django and plugin-server currently communicate via the reload-plugins Redis
# pubsub channel, pushed to when plugin configs change.
# We should move away to a different communication channel and remove this.
PLUGINS_RELOAD_REDIS_URL = os.getenv("PLUGINS_RELOAD_REDIS_URL", REDIS_URL)

CDP_API_URL = get_from_env("CDP_API_URL", "")

if not CDP_API_URL:
    CDP_API_URL = "http://localhost:6738" if DEBUG else "http://ingestion-cdp-api.insights.svc.cluster.local"

# Shared secret for internal API authentication between Django and Node.js services
INTERNAL_API_SECRET = get_from_env("INTERNAL_API_SECRET", "")

EMBEDDING_API_URL = get_from_env("EMBEDDING_API_URL", "")

# Used to generate embeddings on the fly, for use with the document embeddings table
if not EMBEDDING_API_URL:
    EMBEDDING_API_URL = "http://localhost:3305" if DEBUG else "http://embedding-api.insights.svc.cluster.local"

# Dedicated Redis for feature flags
# This allows feature-flags service to have dedicated Redis for better resource isolation
FLAGS_REDIS_URL = os.getenv("FLAGS_REDIS_URL", None)

# Rust feature flags service URL
# This is used to proxy flag evaluation requests to the Rust feature flags service
FEATURE_FLAGS_SERVICE_URL = os.getenv("FEATURE_FLAGS_SERVICE_URL", "http://localhost:3001")

FLAGS_CACHE_TTL = int(os.getenv("FLAGS_CACHE_TTL", str(60 * 60 * 24 * 7)))  # 7 days
FLAGS_CACHE_MISS_TTL = int(os.getenv("FLAGS_CACHE_MISS_TTL", str(60 * 60 * 24)))  # 1 day

CACHES = {
    "default": {
        # IMPORTANT: If any of these settings change, make sure the
        # feature-flags crate is updated accordingly.
        "BACKEND": "django_redis.cache.RedisCache",
        # the django redis default client can be replica aware
        # if location is an array then the first element is the primary
        # and the rest are replicas
        "LOCATION": REDIS_URL if not REDIS_READER_URL else [REDIS_URL, REDIS_READER_URL],
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "COMPRESSOR": "insights.caching.zstd_compressor.ZstdCompressor",
        },
        "KEY_PREFIX": "insights",
    }
}

# Dedicated cache for the feature flags service (if configured)
# Django only writes to this cache (never reads), so no reader URL needed
if FLAGS_REDIS_URL:
    from insights.caching.flags_redis_cache import FLAGS_DEDICATED_CACHE_ALIAS

    CACHES[FLAGS_DEDICATED_CACHE_ALIAS] = {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": FLAGS_REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "COMPRESSOR": "insights.caching.zstd_compressor.ZstdCompressor",
        },
        "KEY_PREFIX": "insights",
    }

QUERY_CACHE_REDIS_CLUSTER_URL: str | None = os.getenv("QUERY_CACHE_REDIS_CLUSTER_URL", None)

if QUERY_CACHE_REDIS_CLUSTER_URL:
    CACHES["query_cache"] = {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": QUERY_CACHE_REDIS_CLUSTER_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_FACTORY": "insights.caching.redis_cluster_connection_factory.RedisClusterConnectionFactory",
            "COMPRESSOR": "insights.caching.zstd_compressor.ZstdCompressor",
        },
        "KEY_PREFIX": "insights",
    }

if TEST:
    CACHES["default"] = {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}

# Cache timeout for materialized columns metadata (in seconds)
MATERIALIZED_COLUMNS_CACHE_TIMEOUT: int = get_from_env("MATERIALIZED_COLUMNS_CACHE_TIMEOUT", 900, type_cast=int)
MATERIALIZED_COLUMNS_USE_CACHE: bool = get_from_env("MATERIALIZED_COLUMNS_USE_CACHE", False, type_cast=str_to_bool)

# Limiting event_list API, saving Datastore, 0 - disabled, 1 - migration period, 2 - enabled.
PATCH_EVENT_LIST_MAX_OFFSET: int = get_from_env("PATCH_EVENT_LIST_MAX_OFFSET", 0, type_cast=int)
PATCH_EVENT_LIST_MAX_OFFSET_PER_TEAM: set[int] = get_from_env(
    "PATCH_EVENT_LIST_MAX_OFFSET_PER_TEAM", default=set[int]([]), type_cast=str_to_int_set
)

DATASTORE_EVENT_LIST_MAX_THREADS: int = get_from_env("DATASTORE_EVENT_LIST_MAX_THREADS", 50, type_cast=int)
