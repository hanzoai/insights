from typing import Literal

from rest_framework.request import Request

from insights.models import Team
from insights.ph_client import feature_enabled_or_false


def insight_api_use_legacy_queries(team: Team) -> bool:
    """
    Use the legacy implementation of insight api calculation endpoints.
    """
    return feature_enabled_or_false(
        "insight-api-use-legacy-queries",
        str(team.uuid),
        groups={
            "organization": str(team.organization_id),
            "project": str(team.id),
        },
        group_properties={
            "organization": {
                "id": str(team.organization_id),
            },
            "project": {
                "id": str(team.id),
            },
        },
        only_evaluate_locally=True,
        send_feature_flag_events=False,
    )


LegacyAPIQueryMethod = Literal["legacy", "insightsql"]


def get_query_method(request: Request, team: Team) -> LegacyAPIQueryMethod:
    query_method_param = request.query_params.get("query_method", None)
    if query_method_param in ["insightsql", "legacy"]:
        return query_method_param  # type: ignore
    return "legacy" if insight_api_use_legacy_queries(team) else "insightsql"
