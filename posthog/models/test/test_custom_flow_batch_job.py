from unittest.mock import patch

from django.test import TestCase

from posthog.models.custom_flow.custom_flow import CustomFlow
from posthog.models.user import User

from products.workflows.backend.models.custom_flow_batch_job import CustomFlowBatchJob


class TestCustomFlowBatchJob(TestCase):
    def setUp(self):
        super().setUp()
        org, team, user = User.objects.bootstrap("Test org", "ben@posthog.com", None)
        self.team = team
        self.user = user
        self.org = org

        # Create a CustomFlow for testing
        self.custom_flow = CustomFlow.objects.create(
            team=self.team,
            name="Test Flow",
            actions=[
                {
                    "id": "trigger_node",
                    "name": "trigger_1",
                    "type": "trigger",
                    "config": {
                        "type": "event",
                        "filters": {
                            "events": [{"id": "$pageview", "name": "$pageview", "type": "events", "order": 0}],
                        },
                    },
                }
            ],
        )

    @patch(
        "products.workflows.backend.models.custom_flow_batch_job.custom_flow_batch_job.create_batch_custom_flow_job_invocation"
    )
    def test_custom_flow_batch_job_creation(self, mock_create_invocation):
        batch_job = CustomFlowBatchJob.objects.create(
            team=self.team,
            custom_flow=self.custom_flow,
            created_by=self.user,
            variables=[{"key": "event_name", "value": "$pageview"}],
        )

        assert batch_job.team == self.team
        assert batch_job.custom_flow == self.custom_flow
        assert batch_job.created_by == self.user
        assert batch_job.status == CustomFlowBatchJob.State.QUEUED
        assert batch_job.variables == [{"key": "event_name", "value": "$pageview"}]
        assert str(batch_job) == f"CustomFlow batch run {batch_job.id}"
        mock_create_invocation.assert_called_once()

    @patch(
        "products.workflows.backend.models.custom_flow_batch_job.custom_flow_batch_job.create_batch_custom_flow_job_invocation"
    )
    def test_custom_flow_batch_job_can_fail(self, mock_create_invocation):
        batch_job = CustomFlowBatchJob.objects.create(team=self.team, custom_flow=self.custom_flow, variables=[])

        batch_job.status = CustomFlowBatchJob.State.FAILED
        batch_job.save()
        batch_job.refresh_from_db()
        assert batch_job.status == CustomFlowBatchJob.State.FAILED

    @patch(
        "products.workflows.backend.models.custom_flow_batch_job.custom_flow_batch_job.create_batch_custom_flow_job_invocation"
    )
    @patch("products.workflows.backend.models.custom_flow_batch_job.custom_flow_batch_job.handle_custom_flow_batch_job_created")
    def test_custom_flow_batch_job_created_signal(self, mock_handler, mock_create_invocation):
        # Disconnect the signal temporarily to test it
        from django.db.models.signals import post_save

        from products.workflows.backend.models.custom_flow_batch_job.custom_flow_batch_job import (
            handle_custom_flow_batch_job_created,
        )

        post_save.disconnect(handle_custom_flow_batch_job_created, sender=CustomFlowBatchJob)

        try:
            # Reconnect with our mock
            post_save.connect(mock_handler, sender=CustomFlowBatchJob)

            batch_job = CustomFlowBatchJob.objects.create(team=self.team, custom_flow=self.custom_flow, variables=[])

            mock_handler.assert_called_once()
            call_kwargs = mock_handler.call_args[1]
            assert call_kwargs["sender"] == CustomFlowBatchJob
            assert call_kwargs["instance"] == batch_job
            assert call_kwargs["created"] is True
        finally:
            # Reconnect the original signal
            post_save.disconnect(mock_handler, sender=CustomFlowBatchJob)
            post_save.connect(handle_custom_flow_batch_job_created, sender=CustomFlowBatchJob)

    @patch(
        "products.workflows.backend.models.custom_flow_batch_job.custom_flow_batch_job.create_batch_custom_flow_job_invocation"
    )
    def test_custom_flow_batch_job_without_created_by(self, mock_create_invocation):
        batch_job = CustomFlowBatchJob.objects.create(team=self.team, custom_flow=self.custom_flow, variables=[])

        assert batch_job.created_by is None
        assert batch_job.team == self.team

    @patch(
        "products.workflows.backend.models.custom_flow_batch_job.custom_flow_batch_job.create_batch_custom_flow_job_invocation"
    )
    def test_custom_flow_batch_job_complex_variables(self, mock_create_invocation):
        variables = [
            {"key": "first_name", "value": "John"},
            {"key": "last_name", "value": "Doe"},
            {"key": "email", "value": "john@posthog.com"},
        ]
        batch_job = CustomFlowBatchJob.objects.create(team=self.team, custom_flow=self.custom_flow, variables=variables)

        assert batch_job.variables == variables
