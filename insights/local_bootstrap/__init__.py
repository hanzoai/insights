"""Bootstrap a local Insights project from an S3 dump of the events and persons tables.

The dumps are produced by the Insights S3 batch export feature (Parquet/JSONLines, optionally
compressed). See ``insights/management/commands/bootstrap_local_project.py`` for the CLI entry point.
"""

from insights.local_bootstrap.config import (
    BootstrapConfig,
    BootstrapConfigError,
    DiscoveredFile,
    S3Location,
    TableImportConfig,
    TablePlan,
    TableResult,
)
from insights.local_bootstrap.importer import BootstrapReport, Progress, run_bootstrap
from insights.local_bootstrap.source import iter_table_rows, list_files

__all__ = [
    "BootstrapConfig",
    "BootstrapConfigError",
    "BootstrapReport",
    "DiscoveredFile",
    "Progress",
    "S3Location",
    "TableImportConfig",
    "TablePlan",
    "TableResult",
    "iter_table_rows",
    "list_files",
    "run_bootstrap",
]
