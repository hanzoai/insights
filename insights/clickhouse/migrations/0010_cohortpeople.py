from insights.clickhouse.client.migration_tools import run_sql_with_exceptions
from insights.models.cohort.sql import CREATE_COHORTPEOPLE_TABLE_SQL

operations = [run_sql_with_exceptions(CREATE_COHORTPEOPLE_TABLE_SQL())]
