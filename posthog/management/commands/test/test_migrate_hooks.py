from posthog.test.base import BaseTest

from posthog.cdp.templates.insights_function_template import sync_template_to_db
from posthog.cdp.templates.zapier.template_zapier import template as template_zapier
from posthog.management.commands.migrate_hooks import migrate_hooks
from posthog.models.action.action import Action
from posthog.models.insights_functions.insights_function import InsightsFunction

from common.hogvm.python.operation import INSIGHTSQL_BYTECODE_VERSION
from ee.models.hook import Hook


class TestMigrateHooks(BaseTest):
    action: Action
    hook: Hook

    def setUp(self):
        super().setUp()
        self.action = Action.objects.create(
            created_by=self.user,
            name="Test Action",
            team_id=self.team.id,
            slack_message_format="[event] triggered by [person]",
            post_to_slack=True,
        )

        self.hook = Hook.objects.create(
            team=self.team,
            target="https://hooks.zapier.com/abcd/",
            event="action_performed",
            resource_id=self.action.id,
            user_id=self.user.id,
        )

        sync_template_to_db(template_zapier)

    def test_dry_run(self):
        migrate_hooks(hook_ids=[], team_ids=[], dry_run=True)
        assert not InsightsFunction.objects.exists()

    def test_only_specified_team(self):
        migrate_hooks(hook_ids=[], team_ids=[9999])
        assert not InsightsFunction.objects.exists()
        migrate_hooks(hook_ids=[], team_ids=[self.team.id])
        assert InsightsFunction.objects.exists()

    def test_only_specified_hooks(self):
        migrate_hooks(hook_ids=["9999"], team_ids=[])
        assert not InsightsFunction.objects.exists()
        migrate_hooks(hook_ids=[self.hook.id], team_ids=[])
        assert InsightsFunction.objects.exists()

    def test_migrates_hook_correctly(self):
        migrate_hooks(hook_ids=[], team_ids=[], dry_run=False)

        insights_functions = InsightsFunction.objects.all()
        assert len(insights_functions) == 1
        insights_function = insights_functions[0]

        assert insights_function.name == f"Zapier webhook for action {self.action.id}"
        assert insights_function.filters == {
            "source": "events",
            "actions": [{"id": f"{self.action.id}", "name": "", "type": "actions", "order": 0}],
            "bytecode": ["_H", INSIGHTSQL_BYTECODE_VERSION, 29],
        }
        assert insights_function.hog == template_zapier.code
        assert insights_function.description == f"{template_zapier.description} Migrated from legacy hook {self.hook.id}."
        assert insights_function.inputs_schema == template_zapier.inputs_schema
        assert insights_function.template_id == template_zapier.id
        assert insights_function.bytecode
        assert insights_function.enabled
        assert insights_function.icon_url == template_zapier.icon_url

        assert Hook.objects.count() == 0
