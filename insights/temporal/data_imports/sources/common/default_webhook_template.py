from insights.cdp.templates.insights_function_template import InsightsFunctionTemplateDC

template: InsightsFunctionTemplateDC = InsightsFunctionTemplateDC(
    status="alpha",
    free=False,
    type="warehouse_source_webhook",
    id="template-warehouse-source-default",
    name="Default warehouse source webhook",
    description="Passthrough webhook that returns the request body as-is",
    icon_url="/static/services/webhook.png",
    category=["Data warehouse"],
    code_language="fn",
    code="return request.body",
    inputs_schema=[],
)
