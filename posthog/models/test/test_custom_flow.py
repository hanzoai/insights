from unittest.mock import patch

from django.test import TestCase

from posthog.models.action.action import Action
from posthog.models.custom_flow.custom_flow import CustomFlow
from posthog.models.user import User


class TestCustomFlow(TestCase):
    def setUp(self):
        super().setUp()
        org, team, user = User.objects.bootstrap("Test org", "ben@posthog.com", None)
        self.team = team
        self.user = user
        self.org = org

    @patch("posthog.models.custom_flow.custom_flow.reload_custom_flows_on_workers")
    def test_custom_flow_saved_receiver(self, mock_reload):
        custom_flow = CustomFlow.objects.create(name="Test Flow", team=self.team)
        mock_reload.assert_called_once_with(team_id=self.team.id, custom_flow_ids=[str(custom_flow.id)])

    @patch("posthog.tasks.custom_flows.refresh_affected_custom_flows.delay")
    def test_action_saved_receiver(self, mock_refresh):
        action = Action.objects.create(team=self.team, name="Test Action")
        mock_refresh.assert_called_once_with(action_id=action.id)

    @patch("posthog.tasks.custom_flows.refresh_affected_custom_flows.delay")
    def test_team_saved_receiver(self, mock_refresh):
        self.team.save()
        mock_refresh.assert_called_once_with(team_id=self.team.id)
