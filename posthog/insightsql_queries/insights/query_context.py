from abc import ABC
from datetime import datetime
from typing import Optional, Protocol

from posthog.schema import InsightsQLQueryModifiers

from posthog.insightsql.constants import LimitContext
from posthog.insightsql.context import InsightsQLContext
from posthog.insightsql.modifiers import create_default_modifiers_for_team
from posthog.insightsql.timings import InsightsQLTimings

from posthog.models.team.team import Team
from posthog.types import InsightQueryNode


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
