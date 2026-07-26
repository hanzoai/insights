from datastore_orm import migrations

from insights.datastore.client import sync_execute
from insights.settings import DATASTORE_CLUSTER

ADD_COLUMNS_BASE_SQL = """
ALTER TABLE {table}
ON CLUSTER '{cluster}'
ADD COLUMN IF NOT EXISTS version UInt64,
MODIFY ORDER BY (team_id, cohort_id, person_id, version)
"""


def add_columns_to_required_tables(_):
    sync_execute(ADD_COLUMNS_BASE_SQL.format(table="cohortpeople", cluster=DATASTORE_CLUSTER))


operations = [migrations.RunPython(add_columns_to_required_tables)]
