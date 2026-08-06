import dataclasses
from typing import TYPE_CHECKING, Any, Protocol

from insights.insightsql.constants import InsightsQLDialect, InsightsQLGlobalSettings
from insights.insightsql.timings import InsightsQLTimings

if TYPE_CHECKING:
    from insights.models.team import Team

    from products.warehouse_sources.backend.facade.models import ExternalDataSource


@dataclasses.dataclass
class DirectQueryRequest:
    source: "ExternalDataSource"
    team: "Team"
    sql: str
    values: dict[str, object] | None
    settings: InsightsQLGlobalSettings
    timings: InsightsQLTimings
    query_type: str
    debug: bool


@dataclasses.dataclass
class DirectQueryResult:
    results: list
    types: list[tuple[str, str]]
    print_columns: list[str]
    error: str | None = None


class DirectSQLAdapter(Protocol):
    """Contract every direct-query engine implements. The registry keys adapters by ``engine``.

    ``dialect`` is the InsightsQL printer dialect the engine compiles to, or ``None`` for raw-only
    engines (no printer — only ``sendRawQuery`` works). Phase 1 engines (Postgres, MySQL) both
    have a dialect; raw-only engines arrive in Phase 2.
    """

    engine: str
    dialect: InsightsQLDialect | None

    def validate_source_config(self, source: "ExternalDataSource", team: "Team") -> tuple[Any, Any]:
        """Validate the source is queryable (host/SSRF + SSH tunnel) and return (implementation, config)."""
        ...

    def prepare_raw_sql(self, sql: str) -> str:
        """Apply the engine's read-only / single-statement guard to user-supplied raw SQL."""
        ...

    def execute(self, request: DirectQueryRequest) -> DirectQueryResult:
        """Connect, enforce read-only + timeout, run the SQL, and map results/types back."""
        ...
