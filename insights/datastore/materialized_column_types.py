"""Materialized-column types and constants the InsightsQL engine can import without booting Django.

The lookups live in insights.datastore.materialized_columns, which re-exports these names for
existing callers.
"""

from dataclasses import dataclass
from typing import Protocol, cast

from insights.property_columns import TableColumn, TableWithProperties

ColumnName = str
TablesWithMaterializedColumns = TableWithProperties
MATERIALIZATION_VALID_TABLES: frozenset[TablesWithMaterializedColumns] = frozenset({"events", "person", "groups"})

DMAT_STRING_COLUMN_NAME_PREFIX = "dmat_string_"
# Naming prefixes for physical materialized columns. Retained so queries can still recognize
# columns an older enterprise-era deployment already materialized on disk.
MATERIALIZED_COLUMN_NAME_PREFIXES = ("mat_", "pmat_", DMAT_STRING_COLUMN_NAME_PREFIX)


MATERIALIZED_COLUMN_COMMENT_PREFIX = "column_materializer"


@dataclass(frozen=True)
class MaterializedColumnDetails:
    """What property a physical column on the events table stands in for.

    Datastore carries this on the column's COMMENT, and it is the only way to map a `mat_*` column
    back to the property it holds. Two spellings exist on disk: the original two-part
    `column_materializer::<property>`, which always meant the `properties` blob, and the later
    three-part `column_materializer::<table_column>::<property>` that named the source column
    explicitly. Both are still written by migrations in this repo (see
    insights/datastore/migrations/0015 and 0064) so both must keep parsing.
    """

    table_column: TableColumn
    property_name: str
    is_disabled: bool = False

    def as_column_comment(self) -> str:
        comment = f"{MATERIALIZED_COLUMN_COMMENT_PREFIX}::{self.table_column}::{self.property_name}"
        return f"{comment}::disabled" if self.is_disabled else comment

    @staticmethod
    def from_column_comment(comment: str) -> "MaterializedColumnDetails":
        parts = comment.split("::")
        if len(parts) == 2:
            # Legacy spelling: the source column was implicit, and only ever `properties`.
            _, property_name = parts
            return MaterializedColumnDetails("properties", property_name, is_disabled=False)
        if len(parts) == 3:
            _, table_column, property_name = parts
            return MaterializedColumnDetails(cast(TableColumn, table_column), property_name, is_disabled=False)
        if len(parts) == 4 and parts[3] == "disabled":
            _, table_column, property_name, _ = parts
            return MaterializedColumnDetails(cast(TableColumn, table_column), property_name, is_disabled=True)
        raise ValueError(f"Unrecognized column comment {comment!r}")


class MaterializedColumn(Protocol):
    name: ColumnName
    is_nullable: bool
    has_minmax_index: bool
    has_bloom_filter_index: bool
    has_ngram_lower_index: bool
    has_bloom_filter_lower_index: bool

    @property
    def type(self) -> str: ...
