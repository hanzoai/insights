from posthog.api.custom_function import CustomFunctionSerializer
from posthog.models.custom_function_template import CustomFunctionTemplate


def custom_function_from_plugin_config(plugin_config: dict, serializer_context: dict) -> CustomFunctionSerializer:
    plugin = plugin_config["plugin"]
    # Attempts to find a related CustomFunctionTemplate for the plugin config

    plugin_id = plugin.url.replace("inline://", "").replace("https://github.com/Insights/", "")

    # Inline plugins are named slightly differently so we fix it here
    if plugin_id == "semver-flattener":
        plugin_id = "semver-flattener-plugin"
    if plugin_id == "user-agent":
        plugin_id = "user-agent-plugin"

    template = CustomFunctionTemplate.objects.get(template_id=f"plugin-{plugin_id}")

    if not template:
        raise Exception(f"Template not found for plugin {plugin_id}")

    inputs = {}
    for key, value in plugin_config["config"].items():
        inputs[key] = {"value": value}

    data = {
        "template_id": template.template_id,
        "type": template.type,
        "name": plugin.name,
        "description": template.description,
        "filters": template.filters,
        "custom_script": template.code,
        "inputs": inputs,
        "enabled": plugin_config.get("enabled", True),
        "icon_url": template.icon_url,
        "inputs_schema": template.inputs_schema,
        "execution_order": plugin_config["order"],
        "created_by": serializer_context["request"].user,
    }

    serializer = CustomFunctionSerializer(
        data=data,
        context=serializer_context,
    )

    serializer.is_valid(raise_exception=True)
    return serializer
