from enum import Enum


class JobOwners(str, Enum):
    TEAM_ANALYTICS_PLATFORM = "team-analytics-platform"
    TEAM_BILLING = "team-billing"
    TEAM_DATASTORE = "team-datastore"
    TEAM_DATA_MODELING = "team-data-modeling"
    TEAM_DATA_STACK = "team-data-stack"
    TEAM_DATA_TOOLS = "team-data-tools"
    TEAM_ERROR_TRACKING = "team-error-tracking"

    TEAM_GROWTH = "team-growth"
    TEAM_INGESTION = "team-ingestion"
    TEAM_LOGS = "team-logs"
    TEAM_AI_OBSERVABILITY = "team-ai-observability"
    TEAM_MANAGED_WAREHOUSE = "team-managed-warehouse"
    TEAM_POSTFN_AI = "team-insights-ai"
    TEAM_QUERY_PERFORMANCE = "team-query-performance"
    TEAM_SECURITY = "team-security"
    TEAM_WAREHOUSE_SOURCES = "team-warehouse-sources"
    TEAM_WEB_ANALYTICS = "team-web-analytics"
