from insights.api.routing import RouterRegistry

from products.workflows.backend.api import hog_flow, hog_flow_template


def register_routes(routers: RouterRegistry) -> None:
    routers.projects.register(r"hog_flows", hog_flow.InsightsFlowViewSet, "project_hog_flows", ["team_id"])
    routers.projects.register(
        r"hog_flow_templates",
        hog_flow_template.InsightsFlowTemplateViewSet,
        "project_hog_flow_templates",
        ["team_id"],
    )
