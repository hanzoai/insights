from insights.insightsql.direct_sql.adapter import DirectQueryRequest, DirectQueryResult, DirectSQLAdapter
from insights.insightsql.direct_sql.capability import direct_capable_source_types, is_direct_capable
from insights.insightsql.direct_sql.datastore_adapter import DatastoreAdapter
from insights.insightsql.direct_sql.mysql_adapter import MySQLAdapter
from insights.insightsql.direct_sql.postgres_adapter import PostgresAdapter
from insights.insightsql.direct_sql.raw_sql import ensure_single_direct_statement
from insights.insightsql.direct_sql.redshift_adapter import RedshiftAdapter
from insights.insightsql.direct_sql.registry import get_adapter, register_adapter, registered_engines
from insights.insightsql.direct_sql.snowflake_adapter import SnowflakeAdapter

register_adapter(PostgresAdapter())
register_adapter(MySQLAdapter())
register_adapter(SnowflakeAdapter())
register_adapter(RedshiftAdapter())
register_adapter(DatastoreAdapter())

__all__ = [
    "DirectQueryRequest",
    "DirectQueryResult",
    "DirectSQLAdapter",
    "DatastoreAdapter",
    "PostgresAdapter",
    "MySQLAdapter",
    "SnowflakeAdapter",
    "RedshiftAdapter",
    "direct_capable_source_types",
    "is_direct_capable",
    "ensure_single_direct_statement",
    "get_adapter",
    "register_adapter",
    "registered_engines",
]
