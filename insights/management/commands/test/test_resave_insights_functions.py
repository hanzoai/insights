from insights.test.base import BaseTest
from unittest.mock import call, patch

from django.core.management import call_command

from insights.models.integration import Integration

from products.cdp.backend.models.insights_functions.insights_function import InsightsFunction


class TestResaveInsightsFunctions(BaseTest):
    def setUp(self):
        super().setUp()
        # Create two integrations
        self.integration1 = Integration.objects.create(
            team=self.team,
            kind="slack",
            config={"refreshed_at": 1234567890},
        )

        self.integration2 = Integration.objects.create(
            team=self.team,
            kind="hubspot",
            config={"refreshed_at": 1234567890},
        )

        # Create two InsightsFunctions that use different integrations
        with patch("products.cdp.backend.models.insights_functions.insights_function.reload_insights_functions_on_workers"):
            self.insights_function1 = InsightsFunction.objects.create(
                team=self.team,
                name="Test Function 1",
                type="transformation",
                description="Test Description 1",
                script="return event",
                enabled=True,
                inputs_schema=[{"type": "integration", "key": "integration"}],
                inputs={"integration": {"value": str(self.integration1.id)}},
            )

            self.insights_function2 = InsightsFunction.objects.create(
                team=self.team,
                name="Test Function 2",
                type="transformation",
                description="Test Description 2",
                script="return event",
                enabled=True,
                inputs_schema=[{"type": "integration", "key": "integration"}],
                inputs={"integration": {"value": str(self.integration2.id)}},
            )

    @patch("products.cdp.backend.models.insights_functions.insights_function.reload_insights_functions_on_workers")
    def test_resave_insights_functions(self, mock_reload):
        """Test that the command correctly identifies and resaves InsightsFunctions connected to integrations."""

        call_command("resave_insights_functions")

        # any_order: the command applies no ORDER BY, so reload order isn't deterministic.
        mock_reload.assert_has_calls(
            [
                call(team_id=self.team.id, insights_function_ids=[str(self.insights_function1.id)]),
                call(team_id=self.team.id, insights_function_ids=[str(self.insights_function2.id)]),
            ],
            any_order=True,
        )
        assert mock_reload.call_count == 2

    @patch("products.cdp.backend.models.insights_functions.insights_function.reload_insights_functions_on_workers")
    def test_only_resaves_enabled_non_deleted_functions(self, mock_reload):
        """Test that the command only resaves enabled and non-deleted functions."""

        # Create a disabled function
        with patch("products.cdp.backend.models.insights_functions.insights_function.reload_insights_functions_on_workers"):
            InsightsFunction.objects.create(
                team=self.team,
                name="Disabled Function",
                type="transformation",
                enabled=False,
                inputs_schema=[{"type": "integration", "key": "integration"}],
                inputs={"integration": {"value": str(self.integration1.id)}},
            )

            # Create a deleted function
            InsightsFunction.objects.create(
                team=self.team,
                name="Deleted Function",
                type="transformation",
                deleted=True,
                inputs_schema=[{"type": "integration", "key": "integration"}],
                inputs={"integration": {"value": str(self.integration2.id)}},
            )

        call_command("resave_insights_functions")

        # any_order: the command applies no ORDER BY, so reload order isn't deterministic.
        mock_reload.assert_has_calls(
            [
                call(team_id=self.team.id, insights_function_ids=[str(self.insights_function1.id)]),
                call(team_id=self.team.id, insights_function_ids=[str(self.insights_function2.id)]),
            ],
            any_order=True,
        )
        assert mock_reload.call_count == 2
