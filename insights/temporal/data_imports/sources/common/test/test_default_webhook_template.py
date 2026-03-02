from parameterized import parameterized

from insights.cdp.templates.helpers import BaseInsightsFunctionTemplateTest
from insights.temporal.data_imports.sources.common.default_webhook_template import template


class TestDefaultWarehouseWebhookTemplate(BaseInsightsFunctionTemplateTest):
    template = template

    def createHogGlobals(self, globals=None) -> dict:
        data: dict = {
            "request": {
                "method": "POST",
                "headers": {},
                "body": {"key": "value"},
                "query": {},
                "stringBody": '{"key": "value"}',
                "ip": "127.0.0.1",
            },
        }
        if globals and globals.get("request"):
            data["request"].update(globals["request"])
        return data

    @parameterized.expand(
        [
            ("simple_object", {"type": "event", "data": {"id": "123"}}),
            ("nested_object", {"a": {"b": {"c": "deep"}}, "list": [1, 2, 3]}),
            ("empty_object", {}),
        ]
    )
    def test_returns_request_body_as_is(self, _name, body):
        res = self.run_function(inputs={}, globals={"request": {"body": body}})
        assert res.result == body
