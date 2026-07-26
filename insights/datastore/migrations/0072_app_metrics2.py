from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.app_metrics2.sql import (
    APP_METRICS2_DATA_TABLE_SQL,
    APP_METRICS2_MV_TABLE_SQL,
    APP_METRICS2_SHARDED_TABLE,
    DISTRIBUTED_APP_METRICS2_TABLE_SQL,
    KAFKA_APP_METRICS2_TABLE_SQL,
)
from insights.settings import DATASTORE_CLUSTER

operations = [
    run_sql_with_exceptions(f"DROP TABLE IF EXISTS app_metrics2_mv ON CLUSTER '{DATASTORE_CLUSTER}'"),
    run_sql_with_exceptions(f"DROP TABLE IF EXISTS kafka_app_metrics2 ON CLUSTER '{DATASTORE_CLUSTER}'"),
    run_sql_with_exceptions(f"DROP TABLE IF EXISTS app_metrics2 ON CLUSTER '{DATASTORE_CLUSTER}'"),
    run_sql_with_exceptions(f"DROP TABLE IF EXISTS sharded_app_metrics2 ON CLUSTER '{DATASTORE_CLUSTER}'"),
    run_sql_with_exceptions(APP_METRICS2_DATA_TABLE_SQL()),
    run_sql_with_exceptions(DISTRIBUTED_APP_METRICS2_TABLE_SQL()),
    run_sql_with_exceptions(KAFKA_APP_METRICS2_TABLE_SQL()),
    run_sql_with_exceptions(APP_METRICS2_MV_TABLE_SQL(target_table=APP_METRICS2_SHARDED_TABLE)),
]
