from insights.api.routing import RouterRegistry

from products.review_hog.backend.api import (
    ReviewBlindSpotsConfigViewSet,
    ReviewTriggerViewSet,
    ReviewPerspectiveConfigViewSet,
    ReviewRecentReviewsViewSet,
    ReviewUserSettingsViewSet,
    ReviewValidatorConfigViewSet,
)


def register_routes(routers: RouterRegistry) -> None:
    # Unscoped: the trigger resolves team + run user server-side and is gated by a shared secret, so it
    # mounts at /v1/review/trigger (no team in the URL) rather than under the project router.
    routers.root.register(r"review", ReviewTriggerViewSet, "review")
    # Team-scoped: per-user perspective enablement for the project's reviews (the config UI).
    routers.projects.register(
        r"review/perspectives",
        ReviewPerspectiveConfigViewSet,
        "project_review_perspectives",
        ["team_id"],
    )
    # Team-scoped: per-user selection of the single active review validator (the config UI).
    routers.projects.register(
        r"review/validators",
        ReviewValidatorConfigViewSet,
        "project_review_validators",
        ["team_id"],
    )
    # Team-scoped: per-user selection of the single active blind-spots skill (the config UI).
    routers.projects.register(
        r"review/blind_spots",
        ReviewBlindSpotsConfigViewSet,
        "project_review_blind_spots",
        ["team_id"],
    )
    # Team-scoped: the requesting user's recent reviews (read-only meta for the config UI).
    routers.projects.register(
        r"review/reviews",
        ReviewRecentReviewsViewSet,
        "project_review_reviews",
        ["team_id"],
    )
    # Team-scoped: per-user trigger opt-outs + urgency threshold, at review/settings (the viewset
    # has no list/detail routes — only the GET+PATCH "settings" action).
    routers.projects.register(
        r"review",
        ReviewUserSettingsViewSet,
        "project_review_settings",
        ["team_id"],
    )
