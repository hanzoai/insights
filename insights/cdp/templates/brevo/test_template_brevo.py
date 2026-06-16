from insights.cdp.templates.brevo.template_brevo import template as template_brevo
from insights.cdp.templates.helpers import BaseInsightsFunctionTemplateTest


def create_inputs(**kwargs):
    inputs = {
        "apiKey": "apikey12345",
        "email": "max@hanzo.ai",
        "attributes": {"EMAIL": "max@hanzo.ai", "FIRSTNAME": "Max"},
    }
    inputs.update(kwargs)

    return inputs


class TestTemplateBrevo(BaseInsightsFunctionTemplateTest):
    template = template_brevo

    def test_function_works(self):
        self.run_function(inputs=create_inputs())
        assert self.get_mock_fetch_calls()[0] == (
            "https://api.brevo.com/v3/contacts",
            {
                "method": "POST",
                "headers": {
                    "api-key": "apikey12345",
                    "Content-Type": "application/json",
                },
                "body": {
                    "email": "max@hanzo.ai",
                    "updateEnabled": True,
                    "attributes": {"EMAIL": "max@hanzo.ai", "FIRSTNAME": "Max"},
                },
            },
        )

    def test_function_requires_identifier(self):
        self.run_function(inputs=create_inputs(email=""))

        assert not self.get_mock_fetch_calls()
        assert self.get_mock_print_calls() == [("No email set. Skipping...",)]
