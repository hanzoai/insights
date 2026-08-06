from insights.cdp.templates.activecampaign.template_activecampaign import template as template_activecampaign
from insights.cdp.templates.helpers import BaseInsightsFunctionTemplateTest


def create_inputs(**kwargs):
    inputs = {
        "accountName": "insights",
        "apiKey": "API_KEY",
        "email": "max@hanzo.ai",
        "firstName": "max",
        "attributes": {"1": "Insights", "2": "hanzo.ai"},
    }
    inputs.update(kwargs)

    return inputs


class TestTemplateActiveCampaign(BaseInsightsFunctionTemplateTest):
    template = template_activecampaign

    def test_function_works(self):
        self.run_function(
            inputs=create_inputs(),
            globals={
                "event": {"event": "$identify"},
            },
        )

        assert self.get_mock_fetch_calls()[0] == (
            "https://insights.api-us1.com/api/3/contact/sync",
            {
                "method": "POST",
                "headers": {
                    "content-type": "application/json",
                    "Api-Token": "API_KEY",
                },
                "body": {
                    "contact": {
                        "email": "max@hanzo.ai",
                        "firstName": "max",
                        "fieldValues": [{"field": "1", "value": "Insights"}, {"field": "2", "value": "hanzo.ai"}],
                    }
                },
            },
        )

    def test_function_requires_identifier(self):
        self.run_function(inputs=create_inputs(email=""))

        assert not self.get_mock_fetch_calls()
        assert self.get_mock_print_calls() == [("`email` input is empty. Not creating a contact.",)]
