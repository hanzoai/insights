from typing import Optional

from celery import shared_task
from structlog import get_logger

from posthog.tasks.email import send_fatal_plugin_error
from posthog.tasks.utils import CeleryQueue

logger = get_logger(__name__)

# IMPORTANT - Do not modify this without also modifying plugin-server/../celery.ts
# Same goes for this file path and the task names
queue = CeleryQueue.DEFAULT.value


# Called from plugin-server/../lazy.ts
@shared_task(ignore_result=True, queue=queue)
def fatal_plugin_error(
    plugin_config_id: int,
    plugin_config_updated_at: Optional[str],
    error: str,
    is_system_error: bool,
) -> None:
    send_fatal_plugin_error.delay(plugin_config_id, plugin_config_updated_at, error, is_system_error)


# Called from plugin-server/../hog-watcher.service.ts
@shared_task(ignore_result=True, queue=queue)
def custom_function_state_transition(custom_function_id: str, state: int) -> None:
    logger.info("custom_function_state_transition (disabled)", custom_function_id=custom_function_id, state=state)
    return
    # from posthog.models.custom_functions.custom_function import CustomFunction

    # logger.info("custom_function_state_transition", custom_function_id=custom_function_id, state=state)

    # custom_function = CustomFunction.objects.get(id=custom_function_id)

    # if not custom_function:
    #     logger.warning("custom_function_state_transition: custom_function not found", custom_function_id=custom_function_id)
    #     return

    # report_team_action(
    #     custom_function.team,
    #     "custom function state changed",
    #     {
    #         "custom_function_id": custom_function_id,
    #         "custom_function_url": f"{settings.SITE_URL}/project/{custom_function.team.id}/pipeline/destinations/hog-{custom_function_id}",
    #         "state": state,
    #     },
    # )

    # # TRICKY: It seems like without this call the events don't get flushed, possibly due to celery worker threads exiting...
    # logger.info("custom_function_state_transition: Flushing posthoganalytics")
    # posthoganalytics.flush()

    # if state >= 2:  # 2 and 3 are disabled
    #     logger.info("custom_function_state_transition: sending custom_function_disabled email")
    #     send_custom_function_disabled.delay(custom_function_id)

    # logger.info("custom_function_state_transition: done")
