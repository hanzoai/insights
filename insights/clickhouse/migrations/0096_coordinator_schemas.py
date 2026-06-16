from insights.clickhouse.client.connection import NodeRole
from insights.clickhouse.client.migration_tools import run_sql_with_exceptions
from insights.clickhouse.log_entries import LOG_ENTRIES_TABLE_SQL
from insights.clickhouse.plugin_log_entries import PLUGIN_LOG_ENTRIES_TABLE_SQL
from insights.heatmaps.sql import DISTRIBUTED_HEATMAPS_TABLE_SQL
from insights.models.app_metrics.sql import DISTRIBUTED_APP_METRICS_TABLE_SQL
from insights.models.channel_type.sql import CHANNEL_DEFINITION_DICTIONARY_SQL, CHANNEL_DEFINITION_TABLE_SQL
from insights.models.cohort.sql import CREATE_COHORTPEOPLE_TABLE_SQL
from insights.models.event.sql import (
    DISTRIBUTED_EVENTS_RECENT_TABLE_SQL,
    DISTRIBUTED_EVENTS_TABLE_SQL,
    EVENTS_RECENT_TABLE_SQL,
)
from insights.models.group.sql import GROUPS_TABLE_SQL
from insights.models.performance.sql import DISTRIBUTED_PERFORMANCE_EVENTS_TABLE_SQL
from insights.models.person.sql import (
    PERSON_DISTINCT_ID2_TABLE_SQL,
    PERSON_DISTINCT_ID_OVERRIDES_TABLE_SQL,
    PERSON_STATIC_COHORT_TABLE_SQL,
    PERSONS_DISTINCT_ID_TABLE_SQL,
    PERSONS_TABLE_SQL,
)
from insights.models.person_overrides.sql import PERSON_OVERRIDES_CREATE_TABLE_SQL
from insights.models.raw_sessions.sessions_v2 import DISTRIBUTED_RAW_SESSIONS_TABLE_SQL
from insights.models.sessions.sql import DISTRIBUTED_SESSIONS_TABLE_SQL
from insights.session_recordings.sql.session_replay_embeddings_sql import DISTRIBUTED_SESSION_REPLAY_EMBEDDINGS_TABLE_SQL
from insights.session_recordings.sql.session_replay_event_sql import DISTRIBUTED_SESSION_REPLAY_EVENTS_TABLE_SQL

operations = [
    # Distributed tables
    run_sql_with_exceptions(DISTRIBUTED_APP_METRICS_TABLE_SQL(), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(CHANNEL_DEFINITION_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(CHANNEL_DEFINITION_DICTIONARY_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(CREATE_COHORTPEOPLE_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(DISTRIBUTED_EVENTS_RECENT_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(DISTRIBUTED_EVENTS_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(EVENTS_RECENT_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(GROUPS_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(DISTRIBUTED_HEATMAPS_TABLE_SQL(), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(LOG_ENTRIES_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(
        DISTRIBUTED_PERFORMANCE_EVENTS_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]
    ),
    run_sql_with_exceptions(PERSONS_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(PERSON_OVERRIDES_CREATE_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(PERSONS_DISTINCT_ID_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(PERSON_DISTINCT_ID2_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(
        PERSON_DISTINCT_ID_OVERRIDES_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]
    ),
    run_sql_with_exceptions(PERSON_STATIC_COHORT_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(PLUGIN_LOG_ENTRIES_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(DISTRIBUTED_SESSIONS_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(DISTRIBUTED_RAW_SESSIONS_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]),
    run_sql_with_exceptions(
        DISTRIBUTED_SESSION_REPLAY_EMBEDDINGS_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]
    ),
    run_sql_with_exceptions(
        DISTRIBUTED_SESSION_REPLAY_EVENTS_TABLE_SQL(on_cluster=False), node_roles=[NodeRole.COORDINATOR]
    ),
]
