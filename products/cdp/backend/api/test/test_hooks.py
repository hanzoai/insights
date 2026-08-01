import uuid
from typing import Any

import pytest
from insights.test.base import DatastoreTestMixin

from insights.cdp.templates.insights_function_template import sync_template_to_db
from insights.cdp.templates.zapier.template_zapier import template as template_zapier

from products.actions.backend.models.action import Action
from products.cdp.backend.api.hooks import create_zapier_insights_function, valid_domain
from products.cdp.backend.models.insights_functions.insights_function import InsightsFunction
from products.cdp.backend.models.hook import Hook

from common.scriptvm.python.operation import INSIGHTSQL_BYTECODE_VERSION
from ee.api.test.base import APILicensedTest


@pytest.mark.usefixtures("unittest_snapshot")
class TestHooksAPI(DatastoreTestMixin, APILicensedTest):
    snapshot: Any
    action: Action

    def setUp(self):
        super().setUp()
        self.action = Action.objects.create(
            team=self.team,
            name="Test Action",
            steps_json=[
                {
                    "event": "$pageview",
                    "properties": [],
                }
            ],
        )
        sync_template_to_db(template_zapier)

    def test_delete_hook(self):
        hook_id = "abc123"
        Hook.objects.create(id=hook_id, user=self.user, team=self.team, resource_id=20)
        response = self.client.delete(f"/api/projects/{self.team.id}/hooks/{hook_id}")
        self.assertEqual(response.status_code, 204)

    def test_invalid_target(self):
        data = {
            "target": "https://hooks.non-zapier.com/abcd/",
            "event": "action_performed",
        }
        response = self.client.post(f"/api/projects/{self.team.id}/hooks/", data)
        self.assertEqual(response.status_code, 400)

    def test_create_insights_function_via_hook(self):
        data = {
            "target": "https://hooks.zapier.com/hooks/standard/1234/abcd",
            "event": "action_performed",
            "resource_id": self.action.id,
        }

        res = self.client.post(f"/api/projects/{self.team.id}/hooks/", data)

        assert res.status_code == 201, res.json()
        json = res.json()

        assert not Hook.objects.exists()
        assert InsightsFunction.objects.count() == 1
        insights_function = InsightsFunction.objects.first()
        assert insights_function
        assert json == {
            "id": str(insights_function.id),
            "event": "action_performed",
            "target": "https://hooks.zapier.com/hooks/standard/1234/abcd",
            "resource_id": self.action.id,
        }

        assert insights_function.description == template_zapier.description

        assert insights_function.filters == {
            "source": "events",
            "actions": [{"id": str(self.action.id), "name": "", "type": "actions", "order": 0}],
            "bytecode": ["_H", INSIGHTSQL_BYTECODE_VERSION, 32, "$pageview", 32, "event", 1, 1, 11],
        }

        assert (insights_function.script, insights_function.inputs) == self.snapshot

    def test_delete_insights_function_via_hook(self):
        data = {
            "target": "https://hooks.zapier.com/hooks/standard/1234/abcd",
            "event": "action_performed",
            "resource_id": self.action.id,
        }

        res = self.client.post(f"/api/projects/{self.team.id}/hooks/", data)

        hook_id = res.json()["id"]

        assert InsightsFunction.objects.filter(enabled=True, deleted=False).count() == 1

        res = self.client.delete(f"/api/projects/{self.team.id}/hooks/{hook_id}")
        assert res.status_code == 204

        assert InsightsFunction.objects.filter(enabled=True, deleted=False).count() == 0

    def test_delete_migrated_insights_function_via_hook(self):
        hooks = []
        insights_functions = []
        for hook_id in [uuid.uuid4(), uuid.uuid4()]:
            hook = Hook.objects.create(
                id=str(hook_id),
                user=self.user,
                team=self.team,
                resource_id=self.action.id,
                target=f"https://hooks.zapier.com/hooks/standard/{hook_id}",
            )

            insights_function = create_zapier_insights_function(
                hook, {"user": hook.user, "get_team": lambda hook=hook: hook.team}, from_migration=True
            )
            insights_function.save()
            hooks.append(hook)
            insights_functions.append(insights_function)

        res = self.client.delete(f"/api/projects/{self.team.id}/hooks/{hooks[0].id}")
        assert res.status_code == 204

        # Ensure the right hook and script function were deleted
        loaded_hooks = Hook.objects.all()
        assert len(loaded_hooks) == 1
        assert str(loaded_hooks[0].id) == str(hooks[1].id)
        loaded_insights_functions = InsightsFunction.objects.filter(enabled=True, deleted=False)
        assert len(loaded_insights_functions) == 1
        assert str(loaded_insights_functions[0].id) == str(insights_functions[1].id)


def test_valid_domain() -> None:
    test_cases = {
        "http://hooks.zapier.com": True,
        "https://hooks.zapier.com": True,
        "http://hooks.zapier.com/something": True,
        "https://hooks.zapier.com/something": True,
        "http://hooks.zapierz.com": False,
        "https://hooks.zapierz.com": False,
        "http://hoos.zapier.com/something": False,
        "https://hoos.zapier.com/something": False,
    }

    for test_input, expected_test_output in test_cases.items():
        test_output = valid_domain(test_input)
        assert test_output == expected_test_output
