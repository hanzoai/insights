from dataclasses import dataclass, field
from functools import cached_property
from typing import TYPE_CHECKING, Any, Literal, Optional

from insights.schema import InsightsQLNotice, InsightsQLQueryModifiers

from insights.insightsql.constants import LimitContext
from insights.insightsql.timings import InsightsQLTimings

from insights.clickhouse.workload import Workload

if TYPE_CHECKING:
    from insights.insightsql.database.database import Database
    from insights.insightsql.transforms.property_types import PropertySwapper

    from insights.models import Team


@dataclass
class InsightsQLFieldAccess:
    input: list[str]
    type: Optional[Literal["event", "event.properties", "person", "person.properties"]]
    field: Optional[str]
    sql: str


@dataclass
class InsightsQLContext:
    """Context given to a InsightsQL expression printer"""

    # Team making the queries
    team_id: Optional[int] = None
    # Team making the queries - if team is passed in, then the team isn't queried when creating the database
    team: Optional["Team"] = None
    # Virtual database we're querying, will be populated from team_id if not present
    database: Optional["Database"] = None
    # If set, will save string constants to this dict. Inlines strings into the query if None.
    values: dict = field(default_factory=dict)
    # Are we small part of a non-InsightsQL query? If so, use custom syntax for accessed person properties.
    within_non_insightsql_query: bool = False
    # Enable full SELECT queries and subqueries in ClickHouse
    enable_select_queries: bool = False
    # Do we apply a limit of MAX_SELECT_RETURNED_ROWS=10000 to the topmost select query?
    limit_top_select: bool = True
    # Context for determining the appropriate limit to apply
    limit_context: Optional[LimitContext] = None
    # Apply a FORMAT clause to output data in given format.
    output_format: str | None = None
    # Globals that will be resolved in the context of the query
    globals: Optional[dict] = None

    # Warnings returned with the metadata query
    warnings: list["InsightsQLNotice"] = field(default_factory=list)
    # Notices returned with the metadata query
    notices: list["InsightsQLNotice"] = field(default_factory=list)
    # Errors returned with the metadata query
    errors: list["InsightsQLNotice"] = field(default_factory=list)

    # Timings in seconds for different parts of the InsightsQL query
    timings: InsightsQLTimings = field(default_factory=InsightsQLTimings)
    # Modifications requested by the InsightsQL client
    modifiers: InsightsQLQueryModifiers = field(default_factory=InsightsQLQueryModifiers)
    # Enables more verbose output for debugging
    debug: bool = False

    property_swapper: Optional["PropertySwapper"] = None
    # Workload detected during AST resolution (set by prepare_ast_for_printing)
    workload: Optional[Workload] = None

    def __post_init__(self):
        if self.team:
            self.team_id = self.team.id

    def add_value(self, value: Any) -> str:
        key = f"insightsql_val_{len(self.values)}"
        self.values[key] = value
        return f"%({key})s"

    def add_sensitive_value(self, value: Any) -> str:
        key = f"insightsql_val_{len(self.values)}_sensitive"
        self.values[key] = value
        return f"%({key})s"

    def add_notice(
        self,
        message: str,
        start: Optional[int] = None,
        end: Optional[int] = None,
        fix: Optional[str] = None,
    ):
        if not any(n.start == start and n.end == end and n.message == message and n.fix == fix for n in self.notices):
            self.notices.append(InsightsQLNotice(start=start, end=end, message=message, fix=fix))

    def add_warning(
        self,
        message: str,
        start: Optional[int] = None,
        end: Optional[int] = None,
        fix: Optional[str] = None,
    ):
        if not any(n.start == start and n.end == end and n.message == message and n.fix == fix for n in self.warnings):
            self.warnings.append(InsightsQLNotice(start=start, end=end, message=message, fix=fix))

    def add_error(
        self,
        message: str,
        start: Optional[int] = None,
        end: Optional[int] = None,
        fix: Optional[str] = None,
    ):
        if not any(n.start == start and n.end == end and n.message == message and n.fix == fix for n in self.errors):
            self.errors.append(InsightsQLNotice(start=start, end=end, message=message, fix=fix))

    @cached_property
    def project_id(self) -> int:
        from insights.models import Team

        if not self.team and not self.team_id:
            raise ValueError("Either team or team_id must be set to determine project_id")
        team = self.team or Team.objects.only("project_id").get(id=self.team_id)
        return team.project_id
