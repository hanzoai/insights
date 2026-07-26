from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions

from products.error_tracking.backend.embedding import DOCUMENT_EMBEDDINGS_MV

# Has been replaced by the buffer table MV as of 0191
operations = [
    run_sql_with_exceptions(
        f"DROP TABLE IF EXISTS {DOCUMENT_EMBEDDINGS_MV}",
        node_roles=[NodeRole.INGESTION_SMALL],
    ),
]
