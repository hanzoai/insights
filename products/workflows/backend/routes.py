from insights.api.routing import RouterRegistry

from products.workflows.backend.api import insights_flow, insights_flow_template


def register_routes(routers: RouterRegistry) -> None:
    routers.projects.register(r"insights_flows", insights_flow.InsightsFlowViewSet, "project_insights_flows", ["team_id"])
    routers.projects.register(
        r"insights_flow_templates",
        insights_flow_template.InsightsFlowTemplateViewSet,
        "project_insights_flow_templates",
        ["team_id"],
    )
