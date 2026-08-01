from insights.api.routing import RouterRegistry

from products.insights_ai.backend.api import MCPToolsViewSet


def register_routes(routers: RouterRegistry) -> None:
    routers.projects.register(
        r"mcp_tools",
        MCPToolsViewSet,
        "project_mcp_tools",
        ["team_id"],
    )
