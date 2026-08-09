"""Route registration for stamp. Auto-discovered by insights/api/__init__.py."""

from insights.api.routing import RouterRegistry

from .presentation.views import (
    DigestChannelViewSet,
    DigestRunViewSet,
    PullRequestViewSet,
    ReviewRunViewSet,
    StampRepoConfigViewSet,
)


def register_routes(routers: RouterRegistry) -> None:
    routers.projects.register(
        r"stamp/repo_configs", StampRepoConfigViewSet, "project_stamp_repo_configs", ["team_id"]
    )
    routers.projects.register(
        r"stamp/pull_requests", PullRequestViewSet, "project_stamp_pull_requests", ["team_id"]
    )
    routers.projects.register(r"stamp/review_runs", ReviewRunViewSet, "project_stamp_review_runs", ["team_id"])
    routers.projects.register(
        r"stamp/digest_channels", DigestChannelViewSet, "project_stamp_digest_channels", ["team_id"]
    )
    routers.projects.register(r"stamp/digest_runs", DigestRunViewSet, "project_stamp_digest_runs", ["team_id"])
