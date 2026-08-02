from insights.api import sharing
from insights.api.routing import RouterRegistry

import products.alerts.backend.api.alert as alert
from products.product_analytics.backend.api.insight import InsightViewSet
from products.product_analytics.backend.api.insight_variable import InsightVariableViewSet


def register_routes(routers: RouterRegistry) -> None:
    insights_router = routers.projects.register(r"insights", InsightViewSet, "project_insights", ["team_id"])

    # SharingConfigurationViewSet is shared (core); the route lives under
    # insights/<id>/sharing — product_analytics owns the sub-route.
    insights_router.register(
        r"sharing",
        sharing.SharingConfigurationViewSet,
        "project_insight_sharing",
        ["team_id", "insight_id"],
    )

    # ThresholdViewSet is owned by the alerts product but nests under insights.
    insights_router.register(
        "thresholds",
        alert.ThresholdViewSet,
        "project_insight_thresholds",
        ["team_id", "insight_id"],
    )

    routers.projects.register(
        r"insight_variables",
        InsightVariableViewSet,
        "project_insight_variables",
        ["team_id"],
    )
