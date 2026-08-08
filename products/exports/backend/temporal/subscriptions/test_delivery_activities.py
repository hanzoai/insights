import uuid

import pytest
from unittest.mock import MagicMock, patch

from insights.slo.types import SloArea, SloConfig, SloOperation
from insights.temporal.exports.activities import export_asset_activity
from insights.temporal.exports.types import ExportAssetResult

from products.exports.backend.temporal.subscriptions.activities import (
    advance_next_delivery_date,
    create_delivery_record,
    create_export_assets,
    deliver_subscription,
    deliver_subscription_v2,
    update_delivery_record,
    validate_subscription_for_delivery,
)
from products.exports.backend.temporal.subscriptions.ai_subscription.activities import generate_ai_subscription_report
from products.exports.backend.temporal.subscriptions.snapshot_activities import snapshot_subscription_insights
from products.exports.backend.temporal.subscriptions.types import (
    CreateExportAssetsResult,
    DeliverSubscriptionResult,
    GenerateAIReportResult,
    SnapshotInsightsResult,
    TrackedSubscriptionInputs,
)
from products.exports.backend.temporal.subscriptions.workflows import (
    ProcessAISubscriptionWorkflow,
    ProcessSubscriptionWorkflow,
)

pytestmark = [pytest.mark.asyncio, pytest.mark.django_db(transaction=True)]


# The patch-gated activity switch is the rollout seam for the v2 delivery campaign: new
# executions take v2, in-flight pre-patch executions stay on v1 for history compatibility.
# Driving through the workflow (not just the patched() helper) pins both the selection and
# that the chosen activity is what execute_activity receives.
@pytest.mark.parametrize("patch_active", [True, False], ids=["patched_v2", "pre_patch_v1"])
async def test_process_subscription_picks_delivery_activity_from_patch(patch_active) -> None:
    picked = None

    async def fake_execute_activity(activity, inputs, **_kwargs):
        nonlocal picked
        if activity is create_delivery_record:
            return uuid.uuid4()
        if activity is validate_subscription_for_delivery:
            return None
        if activity is create_export_assets:
            return CreateExportAssetsResult(
                exported_asset_ids=[1],
                total_insight_count=3,
                target_type="email",
                available_insight_count=5,
                selected_insight_count=4,
            )
        if activity is export_asset_activity:
            return ExportAssetResult(exported_asset_id=1, success=True)
        if activity is snapshot_subscription_insights:
            return SnapshotInsightsResult()
        if activity in (deliver_subscription, deliver_subscription_v2):
            picked = activity
            return DeliverSubscriptionResult()
        if activity is update_delivery_record:
            return None
        raise AssertionError(f"unexpected activity {activity}")

    with (
        patch("temporalio.workflow.execute_activity", side_effect=fake_execute_activity),
        patch("temporalio.workflow.patched", return_value=patch_active),
        patch("temporalio.workflow.info") as mock_info,
        patch("temporalio.workflow.uuid4", return_value=uuid.uuid4()),
        patch("temporalio.workflow.logger", MagicMock()),
    ):
        mock_info.return_value = MagicMock(workflow_id="wf-test")
        inputs = TrackedSubscriptionInputs(
            subscription_id=1,
            team_id=1,
            distinct_id="u1",
            slo=SloConfig(
                operation=SloOperation.SUBSCRIPTION_DELIVERY,
                area=SloArea.ANALYTIC_PLATFORM,
                team_id=1,
                resource_id="1",
                distinct_id="u1",
            ),
        )
        await ProcessSubscriptionWorkflow().run(inputs)

    assert picked is (deliver_subscription_v2 if patch_active else deliver_subscription)
    assert inputs.slo is not None
    assert inputs.slo.completion_properties["target_type"] == "email"
    assert inputs.slo.completion_properties["selected_insight_count"] == 4
    assert inputs.slo.completion_properties["available_insight_count"] == 5


@pytest.mark.parametrize("patch_active", [True, False], ids=["patched_v2", "pre_patch_v1"])
async def test_process_ai_subscription_picks_delivery_activity_from_patch(patch_active) -> None:
    picked = None

    async def fake_execute_activity(activity, inputs, **_kwargs):
        nonlocal picked
        if activity is create_delivery_record:
            return uuid.uuid4()
        if activity is validate_subscription_for_delivery:
            return None
        if activity is generate_ai_subscription_report:
            return GenerateAIReportResult(target_type="slack")
        if activity in (deliver_subscription, deliver_subscription_v2):
            picked = activity
            return DeliverSubscriptionResult()
        if activity in (update_delivery_record, advance_next_delivery_date):
            return None
        raise AssertionError(f"unexpected activity {activity}")

    with (
        patch("temporalio.workflow.execute_activity", side_effect=fake_execute_activity),
        patch("temporalio.workflow.patched", return_value=patch_active),
        patch("temporalio.workflow.info") as mock_info,
        patch("temporalio.workflow.uuid4", return_value=uuid.uuid4()),
        patch("temporalio.workflow.logger", MagicMock()),
    ):
        mock_info.return_value = MagicMock(workflow_id="wf-test-ai")
        inputs = TrackedSubscriptionInputs(
            subscription_id=1,
            team_id=1,
            distinct_id="u1",
            slo=SloConfig(
                operation=SloOperation.SUBSCRIPTION_DELIVERY,
                area=SloArea.ANALYTIC_PLATFORM,
                team_id=1,
                resource_id="1",
                distinct_id="u1",
            ),
        )
        await ProcessAISubscriptionWorkflow().run(inputs)

    assert picked is (deliver_subscription_v2 if patch_active else deliver_subscription)
    assert inputs.slo is not None
    assert inputs.slo.completion_properties["target_type"] == "slack"
