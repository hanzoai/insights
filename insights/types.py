from typing import Union

from insights.schema import (
    AccountCustomPropertyFilter,
    ActionsNode,
    CohortPropertyFilter,
    DataWarehouseNode,
    DataWarehousePersonPropertyFilter,
    DataWarehousePropertyFilter,
    ElementPropertyFilter,
    EmptyPropertyFilter,
    ErrorTrackingIssueFilter,
    EventMetadataPropertyFilter,
    EventPropertyFilter,
    EventsNode,
    ExperimentActorsQuery,
    FeaturePropertyFilter,
    FlagPropertyFilter,
    FunnelCorrelationActorsQuery,
    FunnelExclusionActionsNode,
    FunnelExclusionEventsNode,
    FunnelsActorsQuery,
    FunnelsDataWarehouseNode,
    FunnelsQuery,
    GroupNode,
    GroupPropertyFilter,
    InsightsQLPropertyFilter,
    InsightActorsQuery,
    LifecycleDataWarehouseNode,
    LifecycleQuery,
    LogEntryPropertyFilter,
    LogPropertyFilter,
    MetricPropertyFilter,
    PathsQuery,
    PersonMetadataPropertyFilter,
    PersonPropertyFilter,
    RecordingPropertyFilter,
    RetentionQuery,
    RevenueAnalyticsPropertyFilter,
    SessionPropertyFilter,
    SpanPropertyFilter,
    StickinessActorsQuery,
    StickinessQuery,
    TrendsQuery,
    WorkflowVariablePropertyFilter,
)

from insights.models.filters.filter import Filter
from insights.models.filters.path_filter import PathFilter
from insights.models.filters.retention_filter import RetentionFilter
from insights.models.filters.stickiness_filter import StickinessFilter

type FilterType = Union[Filter, PathFilter, RetentionFilter, StickinessFilter]
"""Legacy insight filters."""

type InsightQueryNode = Union[TrendsQuery, FunnelsQuery, RetentionQuery, PathsQuery, StickinessQuery, LifecycleQuery]

type InsightActorsQueryNode = Union[
    InsightActorsQuery, FunnelsActorsQuery, FunnelCorrelationActorsQuery, StickinessActorsQuery, ExperimentActorsQuery
]

type AnyPropertyFilter = Union[
    EventPropertyFilter,
    PersonPropertyFilter,
    PersonMetadataPropertyFilter,
    ElementPropertyFilter,
    EventMetadataPropertyFilter,
    RevenueAnalyticsPropertyFilter,
    AccountCustomPropertyFilter,
    SessionPropertyFilter,
    LogEntryPropertyFilter,
    CohortPropertyFilter,
    RecordingPropertyFilter,
    GroupPropertyFilter,
    FeaturePropertyFilter,
    FlagPropertyFilter,
    InsightsQLPropertyFilter,
    EmptyPropertyFilter,
    DataWarehousePropertyFilter,
    DataWarehousePersonPropertyFilter,
    ErrorTrackingIssueFilter,
    LogPropertyFilter,
    MetricPropertyFilter,
    SpanPropertyFilter,
    WorkflowVariablePropertyFilter,
]

type EntityNode = Union[
    EventsNode, ActionsNode, DataWarehouseNode, LifecycleDataWarehouseNode, FunnelsDataWarehouseNode, GroupNode
]
type FunnelEntityNode = Union[EventsNode, ActionsNode, FunnelsDataWarehouseNode, GroupNode]
type FunnelExclusionEntityNode = Union[FunnelExclusionEventsNode, FunnelExclusionActionsNode]
