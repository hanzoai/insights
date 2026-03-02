from abc import ABC
from datetime import datetime
from typing import Optional, Protocol

from insights.schema import InsightsQLQueryModifiers

from insights.insightsql.constants import LimitContext
from insights.insightsql.context import InsightsQLContext
from insights.insightsql.modifiers import create_default_modifiers_for_team
from insights.insightsql.timings import InsightsQLTimings

from insights.models.team.team import Team
from insights.types import InsightQueryNode


class QueryContext(ABC):
    query: InsightQueryNode
    team: Team
    timings: InsightsQLTimings
    modifiers: InsightsQLQueryModifiers
    limit_context: LimitContext
    insightsql_context: InsightsQLContext
    now: datetime

    def __init__(
        self,
        query: InsightQueryNode,
        team: Team,
        timings: Optional[InsightsQLTimings] = None,
        modifiers: Optional[InsightsQLQueryModifiers] = None,
        limit_context: Optional[LimitContext] = None,
        now: Optional[datetime] = None,
    ):
        self.query = query
        self.team = team
        self.timings = timings or InsightsQLTimings()
        self.limit_context = limit_context or LimitContext.QUERY
        self.modifiers = create_default_modifiers_for_team(team, modifiers)
        self.insightsql_context = InsightsQLContext(
            team_id=self.team.pk,
            enable_select_queries=True,
            timings=self.timings,
            modifiers=self.modifiers,
        )
        self.now = now or datetime.now()


class QueryContextProtocol(Protocol):
    context: QueryContext
