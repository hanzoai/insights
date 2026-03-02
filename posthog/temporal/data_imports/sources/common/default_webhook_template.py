from posthog.cdp.templates.custom_function_template import CustomFunctionTemplateDC

template: CustomFunctionTemplateDC = CustomFunctionTemplateDC(
    status="alpha",
    free=False,
    type="warehouse_source_webhook",
    id="template-warehouse-source-default",
    name="Default warehouse source webhook",
    description="Passthrough webhook that returns the request body as-is",
    icon_url="/static/services/webhook.png",
    category=["Data warehouse"],
    code_language="custom_script",
    code="return request.body",
    inputs_schema=[],
)
