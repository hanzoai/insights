from insights.cdp.templates.insights_function_template import InsightsFunctionTemplateDC

template: InsightsFunctionTemplateDC = InsightsFunctionTemplateDC(
    status="beta",
    free=True,
    type="site_app",
    id="template-debug-insights-js",
    name="Insights JS debugger",
    description="Enable extra debugging tools on your insights-js",
    icon_url="https://res.cloudinary.com/dmukukwp6/image/upload/q_auto,f_auto/builder_hog_01_955c082cad.png",
    category=["Custom"],
    code_language="javascript",
    code="""
export function onLoad({ inputs, insights }) {
    if (inputs.enable_debugging) {
        console.log("[Insights JS debugger site app] Enabling Insights.js debugging", insights)
        globalThis.POSTFN_DEBUG = true
        globalThis.__POSTFN_JS_DEBUGGER_ENABLED = true
    }

    if (inputs.capture_config) {
        insights.capture("insights-js debug", {
            config: insights.config
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
            "description": "Whether to capture an event on load including the insights config",
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
