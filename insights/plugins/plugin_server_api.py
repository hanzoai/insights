import json
from typing import Union

import requests
import structlog

from insights.models.utils import UUIDT
from insights.redis import get_client
from insights.settings import CDP_API_URL, INTERNAL_API_SECRET, PLUGINS_RELOAD_REDIS_URL

logger = structlog.get_logger(__name__)

# NOTE: Any message publishing to the workers should be done here so that it is easy to find and update if needed


def get_internal_api_headers() -> dict[str, str]:
    return {"x-internal-api-secret": INTERNAL_API_SECRET} if INTERNAL_API_SECRET else {}


def publish_message(channel: str, payload: Union[dict, str]):
    message = json.dumps(payload) if not isinstance(payload, str) else payload
    get_client(PLUGINS_RELOAD_REDIS_URL).publish(channel, message)


def reload_plugins_on_workers():
    logger.info("Reloading plugins on workers")
    publish_message("reload-plugins", "")


def reload_action_on_workers(team_id: int, action_id: int):
    logger.info(f"Reloading action {action_id} on workers")
    publish_message("reload-action", {"teamId": team_id, "actionId": action_id})


def drop_action_on_workers(team_id: int, action_id: int):
    logger.info(f"Dropping action {action_id} on workers")
    publish_message("drop-action", {"teamId": team_id, "actionId": action_id})


def reload_insights_functions_on_workers(team_id: int, insights_function_ids: list[str]):
    logger.info(f"Reloading custom functions {insights_function_ids} on workers")
    publish_message("reload-insights-functions", {"teamId": team_id, "insightsFunctionIds": insights_function_ids})


def reload_insights_flows_on_workers(team_id: int, insights_flow_ids: list[str]):
    logger.info(f"Reloading insights flows {insights_flow_ids} on workers")
    publish_message("reload-hog-flows", {"teamId": team_id, "insightsFlowIds": insights_flow_ids})


def reload_evaluations_on_workers(team_id: int, evaluation_ids: list[str]):
    logger.info(f"Reloading evaluations {evaluation_ids} on workers")
    publish_message("reload-evaluations", {"teamId": team_id, "evaluationIds": evaluation_ids})


def reload_all_insights_functions_on_workers():
    logger.info(f"Reloading all custom functions on workers")
    publish_message("reload-all-insights-functions", {})


def reload_integrations_on_workers(team_id: int, integration_ids: list[int]):
    logger.info(f"Reloading integrations {integration_ids} on workers")
    publish_message("reload-integrations", {"teamId": team_id, "integrationIds": integration_ids})


def populate_plugin_capabilities_on_workers(plugin_id: str):
    logger.info(f"Populating plugin capabilities for plugin {plugin_id} on workers")
    publish_message("populate-plugin-capabilities", {"pluginId": plugin_id})


def create_script_invocation_test(team_id: int, insights_function_id: str, payload: dict) -> requests.Response:
    logger.info(f"Creating script invocation test for custom function {insights_function_id} on workers")
    return requests.post(
        CDP_API_URL + f"/api/projects/{team_id}/insights_functions/{insights_function_id}/invocations",
        json=payload,
        headers=get_internal_api_headers(),
    )


def create_insights_flow_invocation_test(team_id: int, insights_flow_id: str, payload: dict) -> requests.Response:
    logger.info(f"Creating insights flow invocation test for flow {insights_flow_id} on workers")
    return requests.post(
        CDP_API_URL + f"/api/projects/{team_id}/insights_flows/{insights_flow_id}/invocations",
        json=payload,
        headers=get_internal_api_headers(),
    )


def get_insights_function_status(team_id: int, insights_function_id: UUIDT) -> requests.Response:
    return requests.get(
        CDP_API_URL + f"/api/projects/{team_id}/insights_functions/{insights_function_id}/status",
        headers=get_internal_api_headers(),
    )


def patch_insights_function_status(team_id: int, insights_function_id: UUIDT, state: int) -> requests.Response:
    return requests.patch(
        CDP_API_URL + f"/api/projects/{team_id}/insights_functions/{insights_function_id}/status",
        json={"state": state},
        headers=get_internal_api_headers(),
    )


def generate_messaging_preferences_token(team_id: int, identifier: str) -> str:
    payload = {"team_id": team_id, "identifier": identifier}
    response = requests.post(
        CDP_API_URL + "/api/messaging/generate_preferences_token",
        json=payload,
        headers=get_internal_api_headers(),
    )
    if response.status_code == 200:
        return response.json().get("token")
    return ""


def validate_messaging_preferences_token(token: str) -> requests.Response:
    return requests.get(
        CDP_API_URL + f"/api/messaging/validate_preferences_token/{token}",
        headers=get_internal_api_headers(),
    )


def get_insights_function_templates() -> requests.Response:
    return requests.get(
        CDP_API_URL + "/api/insights_function_templates",
        headers=get_internal_api_headers(),
    )


def create_batch_insights_flow_job_invocation(team_id: int, insights_flow_id: UUIDT, batch_job_id: UUIDT) -> requests.Response:
    return requests.post(
        CDP_API_URL + f"/api/projects/{team_id}/insights_flows/{insights_flow_id}/batch_invocations/{batch_job_id}",
        headers=get_internal_api_headers(),
    )


def get_plugin_server_status() -> requests.Response:
    return requests.get(CDP_API_URL + f"/_health")
