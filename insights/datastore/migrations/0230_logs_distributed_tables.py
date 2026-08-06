from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.datastore.logs import (
    LOG_ATTRIBUTES_DISTRIBUTED_TABLE_SQL,
    LOGS_DISTRIBUTED2_TABLE_SQL,
    LOGS_KAFKA_METRICS_DISTRIBUTED_TABLE_SQL,
)
from insights.datastore.logs.logs_kafka_metrics import LOGS_KAFKA_METRICS_TABLE_SQL

operations = [
    # Create the base logs_kafka_metrics replicated table (previously only in bin/datastore-logs.sql)
    run_sql_with_exceptions(
        LOGS_KAFKA_METRICS_TABLE_SQL(),
        node_roles=[NodeRole.LOGS],
    ),
    # Distributed read table for logs
    run_sql_with_exceptions(
        LOGS_DISTRIBUTED2_TABLE_SQL(),
        node_roles=[NodeRole.LOGS],
    ),
    # Distributed read table for log_attributes
    run_sql_with_exceptions(
        LOG_ATTRIBUTES_DISTRIBUTED_TABLE_SQL(),
        node_roles=[NodeRole.LOGS],
    ),
    # Distributed read table for logs_kafka_metrics
    run_sql_with_exceptions(
        LOGS_KAFKA_METRICS_DISTRIBUTED_TABLE_SQL(),
        node_roles=[NodeRole.LOGS],
    ),
]
