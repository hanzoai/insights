from typing import Optional

from django.utils import timezone

from celery import shared_task
from structlog import get_logger

from insights.models.action.action import Action
from insights.plugins.plugin_server_api import reload_insights_flows_on_workers
from insights.tasks.utils import CeleryQueue

logger = get_logger(__name__)


@shared_task(ignore_result=True, queue=CeleryQueue.DEFAULT.value)
def refresh_affected_insights_flows(team_id: Optional[int] = None, action_id: Optional[int] = None) -> int:
    from insights.models.insights_flow.insights_flow import InsightsFlow

    affected_insights_flows: list[InsightsFlow] = []

    if action_id:
        action = Action.objects.get(id=action_id)
        team_id = action.team_id
        # Find hog flows that reference this action in their trigger filters
        affected_insights_flows = list(
            InsightsFlow.objects.select_related("team")
            .filter(team_id=action.team_id, status="active")
            .filter(trigger__contains={"actions": [{"id": str(action_id)}]})
        )
    elif team_id:
        # Find hog flows that have test account filters enabled
        affected_insights_flows = list(
            InsightsFlow.objects.select_related("team")
            .filter(team_id=team_id, status="active")
            .filter(trigger__contains={"filter_test_accounts": True})
        )

    if team_id is None:
        raise Exception("Either team_id or action_id must be provided")

    if not affected_insights_flows:
        return 0

    # Update the updated_at timestamp to trigger a reload
    for insights_flow in affected_insights_flows:
        insights_flow.updated_at = timezone.now()

    updates = InsightsFlow.objects.bulk_update(affected_insights_flows, ["updated_at"])

    reload_insights_flows_on_workers(team_id=team_id, insights_flow_ids=[str(insights_flow.id) for insights_flow in affected_insights_flows])

    return updates
