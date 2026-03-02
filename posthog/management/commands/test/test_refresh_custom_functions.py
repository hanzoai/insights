from io import StringIO

from posthog.test.base import BaseTest
from unittest.mock import patch

from django.core.management import call_command

from posthog.models import Team
from posthog.models.custom_functions.custom_function import CustomFunction


class TestRefreshCustomFunctions(BaseTest):
    def setUp(self):
        super().setUp()

        # Create additional teams for testing
        self.team2 = Team.objects.create(organization=self.organization, name="Test Team 2")

        # Create CustomFunctions for testing
        with patch("posthog.models.custom_functions.custom_function.reload_custom_functions_on_workers"):
            self.custom_function1 = CustomFunction.objects.create(
                team=self.team,
                name="Test Function 1",
                type="destination",
                description="Test Description 1",
                hog="return event",
                enabled=True,
            )

            self.custom_function2 = CustomFunction.objects.create(
                team=self.team,
                name="Test Function 2",
                type="transformation",
                description="Test Description 2",
                hog="return event",
                enabled=True,
            )

            self.custom_function3 = CustomFunction.objects.create(
                team=self.team2,
                name="Test Function 3",
                type="destination",
                description="Test Description 3",
                hog="return event",
                enabled=True,
            )

            # Create disabled function - should also be processed
            self.disabled_function = CustomFunction.objects.create(
                team=self.team,
                name="Disabled Function",
                type="destination",
                enabled=False,
            )

            # Create deleted function - should not be processed
            self.deleted_function = CustomFunction.objects.create(
                team=self.team,
                name="Deleted Function",
                type="destination",
                enabled=True,
                deleted=True,
            )

    @patch("posthog.models.custom_functions.custom_function.reload_custom_functions_on_workers")
    def test_refresh_all_custom_functions(self, mock_reload):
        """Test refreshing all non-deleted destination CustomFunctions (both enabled and disabled) across all teams."""

        out = StringIO()
        call_command("refresh_custom_functions", stdout=out)

        # Should have refreshed 3 destination functions
        # (custom_function1, custom_function3, disabled_function)
        # The transformation custom_function2 and deleted_function should be excluded
        assert mock_reload.call_count == 3

        output = out.getvalue()
        self.assertIn("Found 3 CustomFunctions to process", output)
        self.assertIn("Processed: 3", output)
        self.assertIn("Updated: 3", output)
        self.assertIn("Errors: 0", output)

    @patch("posthog.models.custom_functions.custom_function.reload_custom_functions_on_workers")
    def test_refresh_by_team_id(self, mock_reload):
        """Test refreshing destination CustomFunctions for a specific team."""

        out = StringIO()
        call_command("refresh_custom_functions", team_id=self.team.id, stdout=out)

        # Should have refreshed destination functions from team1 (custom_function1, disabled_function)
        # The transformation custom_function2 and deleted_function should be excluded
        assert mock_reload.call_count == 2

        output = out.getvalue()
        self.assertIn(f"Processing CustomFunctions for team: {self.team.id}", output)
        self.assertIn("Found 2 CustomFunctions to process", output)
        self.assertIn("Updated: 2", output)

    @patch("posthog.models.custom_functions.custom_function.reload_custom_functions_on_workers")
    def test_refresh_by_custom_function_id(self, mock_reload):
        """Test refreshing a specific CustomFunction by ID."""

        out = StringIO()
        call_command("refresh_custom_functions", custom_function_id=str(self.custom_function1.id), stdout=out)

        # Should have refreshed only the specific function
        assert mock_reload.call_count == 1

        output = out.getvalue()
        self.assertIn(f"Processing single CustomFunction: {self.custom_function1.id}", output)
        self.assertIn("Found 1 CustomFunctions to process", output)
        self.assertIn("Updated: 1", output)

    @patch("posthog.models.custom_functions.custom_function.reload_custom_functions_on_workers")
    def test_nonexistent_team_id(self, mock_reload):
        """Test handling of nonexistent team ID."""

        out = StringIO()
        call_command("refresh_custom_functions", team_id=99999, stdout=out)

        assert mock_reload.call_count == 0

        output = out.getvalue()
        self.assertIn("Found 0 CustomFunctions to process", output)
        self.assertIn("No CustomFunctions found matching criteria", output)

    @patch("posthog.models.custom_functions.custom_function.reload_custom_functions_on_workers")
    def test_nonexistent_custom_function_id(self, mock_reload):
        """Test handling of nonexistent CustomFunction ID."""

        out = StringIO()
        # Use a valid UUID format that doesn't exist
        nonexistent_uuid = "00000000-0000-0000-0000-000000000000"
        call_command("refresh_custom_functions", custom_function_id=nonexistent_uuid, stdout=out)

        assert mock_reload.call_count == 0

        output = out.getvalue()
        self.assertIn("Found 0 CustomFunctions to process", output)
        self.assertIn("No CustomFunctions found matching criteria", output)
