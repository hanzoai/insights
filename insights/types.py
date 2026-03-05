from typing import Union

from insights.schema import (
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
    FeaturePropertyFilter,
    FlagPropertyFilter,
    FunnelCorrelationActorsQuery,
    FunnelExclusionActionsNode,
    FunnelExclusionEventsNode,
    FunnelsActorsQuery,
    FunnelsQuery,
    GroupNode,
    GroupPropertyFilter,
    InsightsQLPropertyFilter,
    InsightActorsQuery,
    LifecycleQuery,
    LogEntryPropertyFilter,
    LogPropertyFilter,
    PathsQuery,
    PersonPropertyFilter,
    RecordingPropertyFilter,
    RetentionQuery,
    RevenueAnalyticsPropertyFilter,
    SessionPropertyFilter,
    StickinessActorsQuery,
    StickinessQuery,
    TrendsQuery,
)

from insights.models.filters.filter import Filter
from insights.models.filters.path_filter import PathFilter
from insights.models.filters.retention_filter import RetentionFilter
from insights.models.filters.stickiness_filter import StickinessFilter

type FilterType = Union[Filter, PathFilter, RetentionFilter, StickinessFilter]
"""Legacy insight filters."""

type InsightQueryNode = Union[TrendsQuery, FunnelsQuery, RetentionQuery, PathsQuery, StickinessQuery, LifecycleQuery]

type InsightActorsQueryNode = Union[
    InsightActorsQuery, FunnelsActorsQuery, FunnelCorrelationActorsQuery, StickinessActorsQuery
]

type AnyPropertyFilter = Union[
    EventPropertyFilter,
    PersonPropertyFilter,
    ElementPropertyFilter,
    EventMetadataPropertyFilter,
    RevenueAnalyticsPropertyFilter,
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
]

type EntityNode = Union[EventsNode, ActionsNode, DataWarehouseNode, GroupNode]
type ExclusionEntityNode = Union[FunnelExclusionEventsNode, FunnelExclusionActionsNode]
