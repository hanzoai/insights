import uuid
from typing import Any

import pytest
from posthog.test.base import ClickhouseTestMixin

from posthog.cdp.templates.custom_function_template import sync_template_to_db
from posthog.cdp.templates.zapier.template_zapier import template as template_zapier
from posthog.models.action.action import Action
from posthog.models.custom_functions.custom_function import CustomFunction

from common.hogvm.python.operation import INSIGHTSQL_BYTECODE_VERSION
from ee.api.hooks import create_zapier_custom_function, valid_domain
from ee.api.test.base import APILicensedTest
from ee.models.hook import Hook


@pytest.mark.usefixtures("unittest_snapshot")
class TestHooksAPI(ClickhouseTestMixin, APILicensedTest):
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

    def test_create_custom_function_via_hook(self):
        data = {
            "target": "https://hooks.zapier.com/hooks/standard/1234/abcd",
            "event": "action_performed",
            "resource_id": self.action.id,
        }

        res = self.client.post(f"/api/projects/{self.team.id}/hooks/", data)

        assert res.status_code == 201, res.json()
        json = res.json()

        assert not Hook.objects.exists()
        assert CustomFunction.objects.count() == 1
        custom_function = CustomFunction.objects.first()
        assert custom_function
        assert json == {
            "id": str(custom_function.id),
            "event": "action_performed",
            "target": "https://hooks.zapier.com/hooks/standard/1234/abcd",
            "resource_id": self.action.id,
        }

        assert custom_function.description == template_zapier.description

        assert custom_function.filters == {
            "source": "events",
            "actions": [{"id": str(self.action.id), "name": "", "type": "actions", "order": 0}],
            "bytecode": ["_H", INSIGHTSQL_BYTECODE_VERSION, 32, "$pageview", 32, "event", 1, 1, 11],
        }

        assert (custom_function.hog, custom_function.inputs) == self.snapshot

    def test_delete_custom_function_via_hook(self):
        data = {
            "target": "https://hooks.zapier.com/hooks/standard/1234/abcd",
            "event": "action_performed",
            "resource_id": self.action.id,
        }

        res = self.client.post(f"/api/projects/{self.team.id}/hooks/", data)

        hook_id = res.json()["id"]

        assert CustomFunction.objects.filter(enabled=True, deleted=False).count() == 1

        res = self.client.delete(f"/api/projects/{self.team.id}/hooks/{hook_id}")
        assert res.status_code == 204

        assert CustomFunction.objects.filter(enabled=True, deleted=False).count() == 0

    def test_delete_migrated_custom_function_via_hook(self):
        hooks = []
        custom_functions = []
        for hook_id in [uuid.uuid4(), uuid.uuid4()]:
            hook = Hook.objects.create(
                id=hook_id,
                user=self.user,
                team=self.team,
                resource_id=self.action.id,
                target=f"https://hooks.zapier.com/hooks/standard/{hook_id}",
            )

            custom_function = create_zapier_custom_function(
                hook, {"user": hook.user, "get_team": lambda hook=hook: hook.team}, from_migration=True
            )
            custom_function.save()
            hooks.append(hook)
            custom_functions.append(custom_function)

        res = self.client.delete(f"/api/projects/{self.team.id}/hooks/{hooks[0].id}")
        assert res.status_code == 204

        # Ensure the right hook and custom function were deleted
        loaded_hooks = Hook.objects.all()
        assert len(loaded_hooks) == 1
        assert str(loaded_hooks[0].id) == str(hooks[1].id)
        loaded_custom_functions = CustomFunction.objects.filter(enabled=True, deleted=False)
        assert len(loaded_custom_functions) == 1
        assert str(loaded_custom_functions[0].id) == str(custom_functions[1].id)


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
