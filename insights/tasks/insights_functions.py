from typing import Optional

from django.core.management import call_command
from django.utils import timezone

from celery import shared_task
from structlog import get_logger

from insights.cdp.filters import compile_filters_bytecode
from insights.models.action.action import Action
from insights.plugins.plugin_server_api import reload_insights_functions_on_workers
from insights.redis import get_client
from insights.tasks.utils import CeleryQueue

logger = get_logger(__name__)


@shared_task(ignore_result=True, queue=CeleryQueue.DEFAULT.value)
def refresh_affected_insights_functions(team_id: Optional[int] = None, action_id: Optional[int] = None) -> int:
    from insights.models.insights_functions.insights_function import InsightsFunction

    affected_insights_functions: list[InsightsFunction] = []

    if action_id:
        action = Action.objects.get(id=action_id)
        team_id = action.team_id
        affected_insights_functions = list(
            InsightsFunction.objects.select_related("team")
            .filter(team_id=action.team_id)
            .filter(filters__contains={"actions": [{"id": str(action_id)}]})
        )
    elif team_id:
        affected_insights_functions = list(
            InsightsFunction.objects.select_related("team")
            .filter(team_id=team_id)
            .filter(filters__contains={"filter_test_accounts": True})
        )

    if team_id is None:
        raise Exception("Either team_id or action_id must be provided")

    if not affected_insights_functions:
        return 0

    all_related_actions = (
        Action.objects.select_related("team")
        .filter(team_id=team_id)
        .filter(
            id__in=[
                action_id for insights_function in affected_insights_functions for action_id in insights_function.filter_action_ids
            ]
        )
    )

    actions_by_id = {action.id: action for action in all_related_actions}

    successfully_compiled_insights_functions = []
    for insights_function in affected_insights_functions:
        compiled_filters = compile_filters_bytecode(insights_function.filters, insights_function.team, actions_by_id)

        # Only update if compilation succeeded (no bytecode_error)
        if not compiled_filters.get("bytecode_error"):
            insights_function.filters = compiled_filters
            insights_function.updated_at = timezone.now()
            successfully_compiled_insights_functions.append(insights_function)
        else:
            logger.warning(
                f"Failed to compile filters for custom function {insights_function.id}: {compiled_filters.get('bytecode_error')}. "
                "Keeping existing filters intact."
            )

    updates = InsightsFunction.objects.bulk_update(successfully_compiled_insights_functions, ["filters", "updated_at"])

    reload_insights_functions_on_workers(
        team_id=team_id, insights_function_ids=[str(insights_function.id) for insights_function in successfully_compiled_insights_functions]
    )

    return updates


@shared_task(
    ignore_result=True,
    autoretry_for=(Exception,),
    max_retries=5,
    default_retry_delay=30,  # retry every 30 seconds
)
def sync_insights_function_templates_task() -> None:
    try:
        logger.info("Running sync_insights_function_templates command (celery task)...")
        call_command("sync_insights_function_templates")
    except Exception as e:
        logger.exception(f"Celery task sync_insights_function_templates failed: {e}")
        raise  # Needed for Celery to trigger a retry


def queue_sync_insights_function_templates() -> None:
    """Queue the sync_insights_function_templates_task with Redis lock to ensure it only runs once."""
    try:
        r = get_client()
        lock_key = "insights_sync_insights_function_templates_task_lock"
        # setnx returns True if the key was set, False if it already exists
        if r.setnx(lock_key, 1):
            r.expire(lock_key, 60 * 60)  # expire after 1 hour
            logger.info("Queuing sync_insights_function_templates celery task (redis lock)...")
            sync_insights_function_templates_task.delay()
        else:
            logger.info("Not queuing sync_insights_function_templates task: lock already set")
    except Exception as e:
        logger.exception(f"Failed to queue sync_insights_function_templates celery task: {e}")
