from typing import Generic, TypeVar

from pydantic import BaseModel

from posthog.schema import AssistantFunnelsQuery, AssistantInsightsQLQuery, AssistantRetentionQuery, AssistantTrendsQuery

Q = TypeVar("Q", AssistantInsightsQLQuery, AssistantTrendsQuery, AssistantFunnelsQuery, AssistantRetentionQuery)


class SchemaGeneratorOutput(BaseModel, Generic[Q]):
    query: Q
