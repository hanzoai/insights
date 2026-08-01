from django.conf import settings

from insights.datastore.kafka_engine import CONSUMER_GROUP_TOPHOG, CONSUMER_GROUP_TOPFN_WS, kafka_engine, ttl_period
from insights.datastore.table_engines import Distributed, MergeTreeEngine, ReplicationScheme
from insights.kafka_client.topics import KAFKA_DATASTORE_TOPHOG

TOPFN_TTL_DAYS = 30

TABLE_BASE_NAME = "tophog"
DATA_TABLE_NAME = f"sharded_{TABLE_BASE_NAME}"
WRITABLE_TABLE_NAME = f"writable_{TABLE_BASE_NAME}"
KAFKA_TABLE_NAME = f"kafka_{TABLE_BASE_NAME}"
MV_NAME = f"{TABLE_BASE_NAME}_mv"


def TOPFN_DATA_TABLE_ENGINE():
    return MergeTreeEngine(
        TABLE_BASE_NAME,
        replication_scheme=ReplicationScheme.SHARDED,
    )


TOPFN_TABLE_BASE_SQL = """
CREATE TABLE IF NOT EXISTS {table_name}
(
    timestamp DateTime64(6, 'UTC'),
    metric LowCardinality(String),
    type LowCardinality(String) DEFAULT 'sum',
    key Map(LowCardinality(String), String),
    value Float64,
    count UInt64 DEFAULT 0,
    pipeline LowCardinality(String),
    lane LowCardinality(String),
    labels Map(LowCardinality(String), String)
) ENGINE = {engine}
"""


def TOPFN_DATA_TABLE_SQL():
    return (
        TOPFN_TABLE_BASE_SQL
        + """
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (pipeline, lane, metric, timestamp, key)
{ttl}
SETTINGS ttl_only_drop_parts = 1
"""
    ).format(
        table_name=DATA_TABLE_NAME,
        engine=TOPFN_DATA_TABLE_ENGINE(),
        ttl=ttl_period("timestamp", TOPFN_TTL_DAYS, unit="DAY"),
    )


def WRITABLE_TOPFN_TABLE_SQL():
    return TOPFN_TABLE_BASE_SQL.format(
        table_name=WRITABLE_TABLE_NAME,
        engine=Distributed(
            data_table=DATA_TABLE_NAME,
            sharding_key="cityHash64(toString(key))",
        ),
    )


def DISTRIBUTED_TOPFN_TABLE_SQL():
    return TOPFN_TABLE_BASE_SQL.format(
        table_name=TABLE_BASE_NAME,
        engine=Distributed(
            data_table=DATA_TABLE_NAME,
            sharding_key="cityHash64(toString(key))",
        ),
    )


KAFKA_TOPFN_TABLE_BASE_SQL = """
CREATE TABLE IF NOT EXISTS {table_name}
(
    timestamp DateTime64(6, 'UTC'),
    metric LowCardinality(String),
    type LowCardinality(String),
    key Map(LowCardinality(String), String),
    value Float64,
    count UInt64,
    pipeline LowCardinality(String),
    lane LowCardinality(String),
    labels Map(LowCardinality(String), String)
) ENGINE = {engine}
SETTINGS date_time_input_format = 'best_effort', kafka_skip_broken_messages = 100
"""


def KAFKA_TOPFN_TABLE_SQL():
    return KAFKA_TOPFN_TABLE_BASE_SQL.format(
        table_name=KAFKA_TABLE_NAME,
        engine=kafka_engine(topic=KAFKA_DATASTORE_TOPHOG, group=CONSUMER_GROUP_TOPHOG),
    )


def TOPFN_MV_SQL(target_table: str = WRITABLE_TABLE_NAME):
    return """
CREATE MATERIALIZED VIEW IF NOT EXISTS {mv_name}
TO {target_table}
AS SELECT
    timestamp,
    metric,
    type,
    key,
    value,
    count,
    pipeline,
    lane,
    labels
FROM {kafka_table}
""".format(
        mv_name=MV_NAME,
        target_table=target_table,
        kafka_table=KAFKA_TABLE_NAME,
    )


def TRUNCATE_TOPFN_TABLE_SQL():
    return f"TRUNCATE TABLE IF EXISTS {DATA_TABLE_NAME}"


# WarpStream Kafka engine tables (coexist alongside MSK tables, same target)

KAFKA_WS_TABLE_NAME = f"kafka_{TABLE_BASE_NAME}_ws"
WS_MV_NAME = f"{TABLE_BASE_NAME}_ws_mv"

DROP_KAFKA_TOPFN_WS_TABLE_SQL = f"DROP TABLE IF EXISTS {KAFKA_WS_TABLE_NAME}"
DROP_TOPFN_WS_MV_SQL = f"DROP TABLE IF EXISTS {WS_MV_NAME}"


def KAFKA_TOPFN_WS_TABLE_SQL():
    return KAFKA_TOPFN_TABLE_BASE_SQL.format(
        table_name=KAFKA_WS_TABLE_NAME,
        engine=kafka_engine(
            topic=KAFKA_DATASTORE_TOPHOG,
            group=CONSUMER_GROUP_TOPFN_WS,
            named_collection=settings.DATASTORE_KAFKA_WARPSTREAM_INGESTION_NAMED_COLLECTION,
        ),
    )


def TOPFN_WS_MV_SQL(target_table: str = WRITABLE_TABLE_NAME):
    return """
CREATE MATERIALIZED VIEW IF NOT EXISTS {mv_name}
TO {target_table}
AS SELECT
    timestamp,
    metric,
    type,
    key,
    value,
    count,
    pipeline,
    lane,
    labels
FROM {kafka_table}
""".format(
        mv_name=WS_MV_NAME,
        target_table=target_table,
        kafka_table=KAFKA_WS_TABLE_NAME,
    )
