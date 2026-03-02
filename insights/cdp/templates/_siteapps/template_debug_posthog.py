from insights.cdp.templates.insights_function_template import InsightsFunctionTemplateDC

template: InsightsFunctionTemplateDC = InsightsFunctionTemplateDC(
    status="beta",
    free=True,
    type="site_app",
    id="template-debug-posthog-js",
    name="Insights JS debugger",
    description="Enable extra debugging tools on your posthog-js",
    icon_url="",
    category=["Custom"],
    code_language="javascript",
    code="""
export function onLoad({ inputs, posthog }) {
    if (inputs.enable_debugging) {
        console.log("[Insights JS debugger site app] Enabling Insights.js debugging", posthog)
        posthog.debug(true)
    }

    if (inputs.capture_config) {
        posthog.capture("posthog-js debug", {
            config: posthog.config
        })
    }
}
""".strip(),
    inputs_schema=[
        {
            "key": "capture_config",
            "type": "boolean",
            "label": "Capture debug event on load",
            "secret": False,
            "default": False,
            "required": False,
            "description": "Whether to capture an event on load including the posthog config",
        },
        {
            "key": "enable_debugging",
            "type": "boolean",
            "label": "Enable debugging",
            "secret": False,
            "default": False,
            "required": False,
        },
    ],
)
