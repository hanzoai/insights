from infi.datastore_orm import migrations

from insights.datastore.client.connection import get_client_from_pool
from insights.settings import DATASTORE_CLUSTER

DROP_COLUMNS_SHARDED_EVENTS = """
ALTER TABLE {table} ON CLUSTER {cluster}
DROP COLUMN IF EXISTS elements_chain_ids
"""

ADD_COLUMNS_SHARDED_EVENTS = """
ALTER TABLE {table} ON CLUSTER {cluster}
ADD COLUMN IF NOT EXISTS elements_chain_ids Array(String) MATERIALIZED arrayDistinct(extractAll(elements_chain, '(?::|\")attr_id="(.*?)"'))
"""


def add_columns_to_required_tables(_):
    with get_client_from_pool() as client:
        client.execute(DROP_COLUMNS_SHARDED_EVENTS.format(table="sharded_events", cluster=DATASTORE_CLUSTER))
        client.execute(ADD_COLUMNS_SHARDED_EVENTS.format(table="sharded_events", cluster=DATASTORE_CLUSTER))


operations = [
    migrations.RunPython(add_columns_to_required_tables),
]
