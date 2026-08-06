"""Materialized-column lookups for the InsightsQL engine.

Materialization was an enterprise-only capability: the registry that minted and tracked physical
`mat_`/`pmat_` columns lived under ee/, which this fork does not carry. The lookups therefore
always report "no materialized column", and the engine falls back to reading the property out of
the JSON blob. That is correct, just slower on large event tables — see
insights/datastore/materialized_column_types.py for the shape callers still depend on.
"""

from collections.abc import Mapping

from insights.datastore.materialized_column_types import (
    DMAT_STRING_COLUMN_NAME_PREFIX,
    MATERIALIZATION_VALID_TABLES,
    MATERIALIZED_COLUMN_NAME_PREFIXES,
    ColumnName,
    MaterializedColumn,
    TablesWithMaterializedColumns,
)
from insights.models.property import PropertyName, TableColumn
from insights.property_columns import TableWithProperties

__all__ = [
    "DMAT_STRING_COLUMN_NAME_PREFIX",
    "MATERIALIZATION_VALID_TABLES",
    "MATERIALIZED_COLUMN_NAME_PREFIXES",
    "ColumnName",
    "MaterializedColumn",
    "TableWithProperties",
    "TablesWithMaterializedColumns",
    "get_enabled_materialized_columns_by_table",
    "get_materialized_column_for_property",
]


def get_materialized_column_for_property(
    table: TablesWithMaterializedColumns, table_column: TableColumn, property_name: PropertyName
) -> MaterializedColumn | None:
    return None


def get_enabled_materialized_columns_by_table() -> Mapping[
    TablesWithMaterializedColumns, Mapping[tuple[PropertyName, TableColumn], MaterializedColumn]
]:
    return {}
