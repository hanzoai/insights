from typing import Optional

from django.core.management import call_command
from django.utils import timezone

from celery import shared_task
from structlog import get_logger

from insights.celery_queues import CeleryQueue
from insights.plugins.plugin_server_api import reload_insights_functions_on_workers
from insights.redis import get_client
from insights.scoping_audit import skip_team_scope_audit

from products.actions.backend.models.action import Action

logger = get_logger(__name__)


@shared_task(ignore_result=True, queue=CeleryQueue.DEFAULT.value)
@skip_team_scope_audit
def refresh_affected_insights_functions(
    team_id: Optional[int] = None, action_id: Optional[int] = None, cohort_id: Optional[int] = None
) -> int:
    from products.cdp.backend.models.insights_functions.insights_function import InsightsFunction

    affected_insights_functions: list[InsightsFunction] = []

    if action_id:
        action = Action.objects.get(id=action_id)
        team_id = action.team_id
        affected_insights_functions = list(
            InsightsFunction.objects.select_related("team")
            .filter(team_id=action.team_id)
            .filter(filters__contains={"actions": [{"id": str(action_id)}]})
        )
    elif cohort_id:
        from products.cohorts.backend.models.cohort import Cohort

        try:
            cohort = Cohort.objects.select_related("team").get(id=cohort_id)
        except Cohort.DoesNotExist:
            # Cohort was deleted between signal firing and task execution — nothing to refresh
            return 0
        team = cohort.team

        # Check if this team references the cohort in its test_account_filters
        uses_cohort = any(
            f.get("type") == "cohort" and f.get("value") == cohort.id for f in (team.test_account_filters or [])
        )
        if not uses_cohort:
            return 0

        team_id = team.id

    # For both cohort_id and team_id paths, find script functions with test account filters enabled
    if team_id and not affected_insights_functions:
        affected_insights_functions = list(
            InsightsFunction.objects.select_related("team")
            .filter(team_id=team_id)
            .filter(filters__contains={"filter_test_accounts": True})
        )

    if team_id is None:
        raise Exception("Either team_id, action_id, or cohort_id must be provided")

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

    # insights.cdp.filters pulls insightsql.property and with it the InsightsQL/schema layer;
    # insights.apps ready() imports this module in every process at setup.
    from insights.cdp.filters import compile_filters_bytecode  # noqa: PLC0415 — keeps InsightsQL off the import path

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
                f"Failed to compile filters for script function {insights_function.id}: {compiled_filters.get('bytecode_error')}. "
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
