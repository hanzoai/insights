from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.tophog.sql import (
    DISTRIBUTED_TOPFN_TABLE_SQL,
    KAFKA_TOPFN_TABLE_SQL,
    TOPFN_DATA_TABLE_SQL,
    TOPFN_MV_SQL,
    WRITABLE_TOPFN_TABLE_SQL,
)

# Migration to create tophog tables for top-N metrics tracking.
#
# TopHog tracks per-key metrics (count, time) within pipeline steps and
# flushes top-N reports to Kafka on an interval. This table stores those
# reports for queryable observability.
#
# Architecture:
# - sharded_tophog: Sharded MergeTree on DATA nodes
# - tophog: Distributed read table on DATA nodes
# - writable_tophog: Distributed write table on INGESTION_MEDIUM nodes
# - kafka_tophog: Kafka engine table on INGESTION_MEDIUM nodes
# - tophog_mv: Materialized view on INGESTION_MEDIUM nodes

operations = [
    # 1. Create sharded data table on data nodes only
    run_sql_with_exceptions(
        TOPFN_DATA_TABLE_SQL(),
        node_roles=[NodeRole.DATA],
    ),
    # 2. Create distributed read table on all nodes
    run_sql_with_exceptions(
        DISTRIBUTED_TOPFN_TABLE_SQL(),
        node_roles=[NodeRole.DATA],
    ),
    # 3. Create writable distributed table on ingestion nodes
    run_sql_with_exceptions(
        WRITABLE_TOPFN_TABLE_SQL(),
        node_roles=[NodeRole.INGESTION_MEDIUM],
    ),
    # 4. Create Kafka table on ingestion nodes
    run_sql_with_exceptions(
        KAFKA_TOPFN_TABLE_SQL(),
        node_roles=[NodeRole.INGESTION_MEDIUM],
    ),
    # 5. Create MV on ingestion nodes (reads from Kafka, writes to writable table)
    run_sql_with_exceptions(
        TOPFN_MV_SQL(),
        node_roles=[NodeRole.INGESTION_MEDIUM],
    ),
]
