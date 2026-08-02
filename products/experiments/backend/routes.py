from insights.api.routing import RouterRegistry


def register_routes(routers: RouterRegistry) -> None:
    from products.experiments.backend.presentation.views import EnterpriseExperimentsViewSet

    routers.projects.register(r"experiments", EnterpriseExperimentsViewSet, "project_experiments", ["project_id"])

    # Holdouts and shared saved metrics keep their models and their nesting inside an experiment,
    # but their standalone viewsets were part of the enterprise edition, so they register no routes
    # of their own.
