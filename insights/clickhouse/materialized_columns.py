from typing import Protocol

from insights.models.property import PropertyName, TableColumn, TableWithProperties

ColumnName = str
TablesWithMaterializedColumns = TableWithProperties
MATERIALIZATION_VALID_TABLES = {"events", "person", "groups"}


class MaterializedColumn(Protocol):
    name: ColumnName
    is_nullable: bool
    has_minmax_index: bool
    has_bloom_filter_index: bool
    has_ngram_lower_index: bool


def get_materialized_column_for_property(
    table: TablesWithMaterializedColumns, table_column: TableColumn, property_name: PropertyName
) -> MaterializedColumn | None:
    return None
