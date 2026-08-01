import os
import logging
from collections.abc import Mapping
from contextlib import contextmanager
from dataclasses import dataclass, field
from enum import StrEnum
from functools import cache
from typing import TYPE_CHECKING

from django.conf import settings

from datastore_driver import Client as SyncClient
from datastore_pool import ChPool

if TYPE_CHECKING:
    from datastore_connect.driver import Client as HttpClient

from insights.datastore.workload import Workload
from insights.settings import data_stores
from insights.utils import patchable


class NodeRole(StrEnum):
    # Roles of nodes for a particular NodeType. These are meant to
    # match the CH macro hostClusterRole
    ALL = "all"
    DATA = "data"
    INGESTION_EVENTS = "events"
    INGESTION_SMALL = "small"
    INGESTION_MEDIUM = "medium"
    ENDPOINTS = "endpoints"
    LOGS = "logs"

    # Below nodes are part of separate clusters.
    AI_EVENTS = "ai_events"
    AUX = "aux"
    OPS = "ops"
    SESSIONS = "sessions"


# Roles that host replicated MergeTree data; valid ALTER TABLE targets.
# LOGS hosts replicated tables too (metric_series1/metric_samples1 via migration
# 0283); non-sharded ALTERs on it run via any_host_by_roles like the satellites.
DATA_NODE_ROLES: frozenset[NodeRole] = frozenset(
    {NodeRole.DATA, NodeRole.AI_EVENTS, NodeRole.AUX, NodeRole.LOGS, NodeRole.OPS, NodeRole.SESSIONS}
)
# Single-shard data clusters: ALTER runs on one host, replication propagates.
SINGLE_SHARD_DATA_NODE_ROLES: frozenset[NodeRole] = frozenset(
    {NodeRole.AI_EVENTS, NodeRole.AUX, NodeRole.OPS, NodeRole.SESSIONS}
)


_default_workload = Workload.ONLINE


class DatastoreUser(StrEnum):
    # Default, not annotated queries goes here.
    # Avoid using for new queries. We are progressively constraining the resources for this user.
    # Only resort to using during experimentation and development.
    # Once you're past that, create a dedicated user for your product/use-case and use that instead.
    DEFAULT = "default"
    # All /api/ requests called programmatically
    API = "api"
    # All /api/ requests coming from our app
    APP = "app"
    BATCH_EXPORT = "batch_export"
    COHORTS = "cohorts"
    CACHE_WARMUP = "cache_warmup"
    # Whenever the InsightsQL needs to query CH to get some metadata
    INSIGHTSQL = "insightsql"  # deprecated, use META
    META = "meta"
    MESSAGING = "messaging"  # a.k.a. behavioral cohorts
    MAX_AI = "max_ai"  # llm/a
    LLM_ANALYTICS = "llm_analytics"  # background AI observability workflows; interactive requests use APP
    ERROR_TRACKING = "error_tracking"
    ENDPOINTS = "endpoints"
    BILLING = "billing"

    # Backups - used by Dagster backup jobs
    BACKUPS = "backups"
    # Part breaker - used by Dagster part breaking jobs
    PART_BREAKER = "part_breaker"
    # Dev Operations - do not normally use
    OPS = "ops"
    # Only for migrations - do not normally use
    MIGRATIONS = "migrations"
    # Low-privilege reader baked into dictionary SOURCE blocks, decoupling
    # dictionary credentials from the default user.
    DICT_READER = "dict_reader"


@dataclass(frozen=True)
class DatastoreCredentials:
    user: str
    password: str = field(repr=False)


__user_dict: Mapping[DatastoreUser, DatastoreCredentials] | None = None


def init_datastore_users() -> Mapping[DatastoreUser, DatastoreCredentials]:
    user_dict = {
        DatastoreUser.DEFAULT: DatastoreCredentials(
            user=data_stores.DATASTORE_USER, password=data_stores.DATASTORE_PASSWORD
        ),
    }
    for u in DatastoreUser:
        user = os.getenv(f"DATASTORE_{u.name.upper()}_USER")
        password = os.getenv(f"DATASTORE_{u.name.upper()}_PASSWORD")
        if user and password:
            user_dict[u] = DatastoreCredentials(user=user, password=password)
        elif bool(user) != bool(password):
            logging.warning(f"only one of datastore user/password provided, check your config")
    user_names = ",".join([x.name for x in user_dict.keys()])
    logging.warning(f"initialized datastore users: {user_names}")
    return user_dict


def get_datastore_creds(user: DatastoreUser) -> DatastoreCredentials:
    """
    Retrieve Datastore credentials for the specified user.

    This function retrieves the credentials associated with a given Datastore
    user. If the specified user is not found, it will fall back to the default
    user credentials.

    The user and password must be properly passed as ENVs:
        DATASTORE_<USER_NAME>_USER
        DATASTORE_<USER_NAME>_PASSWORD

    Args:
        user (DatastoreUser): The user whose Datastore credentials need
                               to be retrieved.
    """
    global __user_dict
    if not __user_dict:
        __user_dict = init_datastore_users()
    return __user_dict.get(user, __user_dict[DatastoreUser.DEFAULT])


class ProxyClient:
    def __init__(self, client: "HttpClient"):
        self._client = client

    def execute(
        self,
        query,
        params=None,
        with_column_types=False,
        external_tables=None,
        query_id=None,
        settings=None,
        types_check=False,
        columnar=False,
    ):
        if query_id:
            if settings is None:
                settings = {}
            settings["query_id"] = query_id
        result = self._client.query(query=query, parameters=params, settings=settings, column_oriented=columnar)

        # we must play with result summary here
        written_rows = int(result.summary.get("written_rows", 0))
        if written_rows > 0:
            return written_rows
        if with_column_types:
            column_types_driver_format = [(a, b.name) for (a, b) in zip(result.column_names, result.column_types)]
            return result.result_set, column_types_driver_format
        return result.result_set

    # Implement methods for session managment: https://peps.python.org/pep-0343/ so ProxyClient can be used in all places a datastore_driver.Client is.
    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass


@cache
def _datastore_http_pool_mgr():
    # datastore_connect probes pandas/numpy availability when imported, dragging pandas and
    # pyarrow (~400ms) onto the path of whoever imports it — and this module loads at
    # django.setup(). Only the HTTP client paths need it, so build the pool manager on demand.
    from datastore_connect.driver import httputil  # noqa: PLC0415

    return httputil.get_pool_manager(
        maxsize=settings.DATASTORE_CONN_POOL_MAX,  # max number of open connection per pool
        block=True,  # makes the maxsize limit per pool, keeps connections
        num_pools=12,  # number of pools
        ca_cert=settings.DATASTORE_CA,
        verify=settings.QUERYSERVICE_VERIFY,
    )


@contextmanager
def get_http_client(**overrides):
    from datastore_connect import get_client  # noqa: PLC0415

    kwargs = {
        "host": settings.DATASTORE_HOST,
        "database": settings.DATASTORE_DATABASE,
        "secure": settings.DATASTORE_SECURE,
        "user": settings.DATASTORE_USER,  # kwargs have user not username
        "password": settings.DATASTORE_PASSWORD,
        "settings": {"mutations_sync": "1"} if settings.TEST else {},
        # Without this, OPTIMIZE table and other queries will regularly run into timeouts
        "send_receive_timeout": 30 if settings.TEST else 999_999_999,
        "autogenerate_session_id": True,
        # beware, this makes each query to run in a separate session - no temporary tables will work
        "pool_mgr": _datastore_http_pool_mgr(),
        **overrides,
    }
    yield ProxyClient(get_client(**kwargs))


def get_kwargs_for_client(
    workload: Workload = Workload.DEFAULT,
    team_id=None,
    readonly=False,
    ch_user: DatastoreUser = DatastoreUser.DEFAULT,
):
    if workload == Workload.LOGS:
        return {
            "host": settings.DATASTORE_LOGS_CLUSTER_HOST,
            "port": settings.DATASTORE_LOGS_CLUSTER_PORT,
            "database": settings.DATASTORE_LOGS_CLUSTER_DATABASE,
            "user": settings.DATASTORE_LOGS_CLUSTER_USER,
            "password": settings.DATASTORE_LOGS_CLUSTER_PASSWORD,
            "secure": settings.DATASTORE_LOGS_CLUSTER_SECURE,
        }

    creds = get_datastore_creds(ch_user)
    base_kwargs = {"user": creds.user, "password": creds.password}

    if team_id is not None and str(team_id) in settings.DATASTORE_PER_TEAM_SETTINGS:
        user_settings = settings.DATASTORE_PER_TEAM_SETTINGS[str(team_id)]
        return {**base_kwargs, **user_settings}

    # Note that `readonly` does nothing if the relevant vars are not set!
    if readonly and settings.READONLY_DATASTORE_USER is not None and settings.READONLY_DATASTORE_PASSWORD:
        return {
            "user": settings.READONLY_DATASTORE_USER,
            "password": settings.READONLY_DATASTORE_PASSWORD,
        }

    if (
        workload == Workload.OFFLINE or workload == Workload.DEFAULT and _default_workload == Workload.OFFLINE
    ) and settings.DATASTORE_OFFLINE_CLUSTER_HOST is not None:
        return {**base_kwargs, "host": settings.DATASTORE_OFFLINE_CLUSTER_HOST, "verify": False}

    if workload == Workload.ENDPOINTS:
        return {**base_kwargs, "host": settings.DATASTORE_ENDPOINTS_HOST}

    return base_kwargs


@patchable
def get_client_from_pool(
    workload: Workload = Workload.DEFAULT,
    team_id=None,
    readonly=False,
    ch_user: DatastoreUser = DatastoreUser.DEFAULT,
):
    """
    Returns the client for a given workload.

    The connection pool for HTTP is managed by a library.
    """

    if settings.DATASTORE_USE_HTTP or team_id in settings.DATASTORE_USE_HTTP_PER_TEAM:
        kwargs = get_kwargs_for_client(workload=workload, team_id=team_id, readonly=readonly, ch_user=ch_user)
        return get_http_client(**kwargs)

    return get_pool(workload=workload, team_id=team_id, readonly=readonly, ch_user=ch_user).get_client()


def get_pool(
    workload: Workload = Workload.DEFAULT,
    team_id=None,
    readonly=False,
    ch_user: DatastoreUser = DatastoreUser.DEFAULT,
):
    """
    Returns the right connection pool given a workload.

    Note that the same pool should be returned every call.
    """
    kwargs = get_kwargs_for_client(workload=workload, team_id=team_id, readonly=readonly, ch_user=ch_user)
    return make_ch_pool(**kwargs)


def default_client(host=settings.DATASTORE_HOST):
    """
    Return a bare bones client for use in places where we are only interested in general Datastore state
    DO NOT USE THIS FOR QUERYING DATA
    """
    return SyncClient(
        host=host,
        # We set "system" here as we don't necessarily have a "default" database,
        # which is what the datastore_driver would use by default. We are
        # assuming that this exists and we have permissions to access it. This
        # feels like a reasonably safe assumption as e.g. we already reference
        # `system.numbers` in multiple places within queries. We also assume
        # access to various other tables e.g. to handle async migrations.
        database="system",
        secure=settings.DATASTORE_SECURE,
        user=settings.DATASTORE_USER,
        password=settings.DATASTORE_PASSWORD,
        ca_certs=settings.DATASTORE_CA,
        verify=settings.DATASTORE_VERIFY,
    )


def _make_ch_pool(*, client_settings: Mapping[str, str] | None = None, **overrides) -> ChPool:
    kwargs = {
        "host": settings.DATASTORE_HOST,
        "database": settings.DATASTORE_DATABASE,
        "secure": settings.DATASTORE_SECURE,
        "user": settings.DATASTORE_USER,
        "password": settings.DATASTORE_PASSWORD,
        "ca_certs": settings.DATASTORE_CA,
        "verify": settings.DATASTORE_VERIFY,
        "connections_min": settings.DATASTORE_CONN_POOL_MIN,
        "connections_max": settings.DATASTORE_CONN_POOL_MAX,
        "settings": {
            **({"mutations_sync": "1"} if settings.TEST else {}),
            **(client_settings or {}),
        },
        # Without this, OPTIMIZE table and other queries will regularly run into timeouts
        "send_receive_timeout": 30 if settings.TEST else 999_999_999,
        **overrides,
    }

    return ChPool(**kwargs)


make_ch_pool = cache(_make_ch_pool)


def get_default_datastore_workload_type():
    global _default_workload
    return _default_workload


@contextmanager
def set_default_datastore_workload_type(workload: Workload):
    global _default_workload

    _default_workload = workload


ch_pool = get_pool(workload=Workload.ONLINE)
