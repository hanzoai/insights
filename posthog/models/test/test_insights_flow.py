from unittest.mock import patch

from django.test import TestCase

from posthog.models.action.action import Action
from posthog.models.insights_flow.insights_flow import InsightsFlow
from posthog.models.user import User


class TestInsightsFlow(TestCase):
    def setUp(self):
        super().setUp()
        org, team, user = User.objects.bootstrap("Test org", "ben@posthog.com", None)
        self.team = team
        self.user = user
        self.org = org

    @patch("posthog.models.insights_flow.insights_flow.reload_insights_flows_on_workers")
    def test_insights_flow_saved_receiver(self, mock_reload):
        insights_flow = InsightsFlow.objects.create(name="Test Flow", team=self.team)
        mock_reload.assert_called_once_with(team_id=self.team.id, insights_flow_ids=[str(insights_flow.id)])

    @patch("posthog.tasks.insights_flows.refresh_affected_insights_flows.delay")
    def test_action_saved_receiver(self, mock_refresh):
        action = Action.objects.create(team=self.team, name="Test Action")
        mock_refresh.assert_called_once_with(action_id=action.id)

    @patch("posthog.tasks.insights_flows.refresh_affected_insights_flows.delay")
    def test_team_saved_receiver(self, mock_refresh):
        self.team.save()
        mock_refresh.assert_called_once_with(team_id=self.team.id)
