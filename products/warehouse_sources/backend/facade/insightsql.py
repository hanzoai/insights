"""
InsightsQL system-table wiring for warehouse_sources.

The InsightsQL database builder (``insights/insightsql/database/database.py``) registers these
model classes as system tables. They cross the boundary as objects — the builder
keys off class identity and calls ORM-bound methods (``insightsql_definition()``,
``raw_objects``, ``queryable()``) — not as contract data, so they are re-exported
here rather than through ``facade/api.py``.

Keeping them in their own submodule keeps the heavy InsightsQL-adjacent model surface off
the ``facade/api.py`` import path, so config-only consumers don't drag it onto the
``django.setup()`` path (see the skill's note on splitting light shared tables out of
the heavy re-exports).
"""

from products.warehouse_sources.backend.models.credential import DataWarehouseCredential
from products.warehouse_sources.backend.models.external_data_job import ExternalDataJob
from products.warehouse_sources.backend.models.external_data_schema import ExternalDataSchema
from products.warehouse_sources.backend.models.external_data_source import ExternalDataSource
from products.warehouse_sources.backend.models.table import (
    SERIALIZED_FIELD_TO_DATASTORE_MAPPING,
    DataWarehouseTable,
    DataWarehouseTableColumns,
    insightsql_fields_and_structure_for_columns,
)

# Table/type resolution used by the InsightsQL database builder and query runners. These return
# ORM objects / reference InsightsQL field factories, so they belong with the object wiring here
# rather than the contract-returning facade/api.py.
from products.warehouse_sources.backend.models.util import (
    DATASTORE_INSIGHTSQL_MAPPING,
    LEGACY_DATASTORE_INSIGHTSQL_MAPPING,
    STR_TO_INSIGHTSQL_MAPPING,
    clean_type,
    get_view_or_table_by_name,
    reconstruct_ordered_columns,
    remove_named_tuples,
)

__all__ = [
    "DATASTORE_INSIGHTSQL_MAPPING",
    "LEGACY_DATASTORE_INSIGHTSQL_MAPPING",
    "SERIALIZED_FIELD_TO_DATASTORE_MAPPING",
    "STR_TO_INSIGHTSQL_MAPPING",
    "DataWarehouseCredential",
    "DataWarehouseTable",
    "DataWarehouseTableColumns",
    "ExternalDataJob",
    "ExternalDataSchema",
    "ExternalDataSource",
    "clean_type",
    "get_view_or_table_by_name",
    "insightsql_fields_and_structure_for_columns",
    "reconstruct_ordered_columns",
    "remove_named_tuples",
]
