"""Tests for `enqueue_pointer_message`.

The activity builds the pointer describing where the day's chunks landed and
records the run metrics. Delivery to billing was an enterprise concern this
fork does not carry, so what is left to guard is the metric bookkeeping.
"""

from datetime import UTC, datetime

import pytest
from unittest.mock import patch

from insights.temporal.usage_report.activities import enqueue_pointer_message
from insights.temporal.usage_report.types import AggregateResult, EnqueuePointerInputs, WorkflowContext


def _ctx() -> WorkflowContext:
    return WorkflowContext(
        run_id="run-test",
        workflow_started_at=datetime(2026, 5, 5, 1, 45, 0, tzinfo=UTC),
        period_start=datetime(2026, 5, 4, 0, 0, 0, tzinfo=UTC),
        period_end=datetime(2026, 5, 4, 23, 59, 59, 999999, tzinfo=UTC),
        date_str="2026-05-04",
        report_completeness="complete",
    )


def _agg() -> AggregateResult:
    return AggregateResult(
        chunk_keys=[
            "tasks/billing/usage_reports/2026-05-04/run-test/chunks/chunk_0000.jsonl.gz",
            "tasks/billing/usage_reports/2026-05-04/run-test/chunks/chunk_0001.jsonl.gz",
        ],
        manifest_key="tasks/billing/usage_reports/2026-05-04/run-test/manifest.json",
        total_orgs=12345,
        total_orgs_with_usage=678,
    )


@pytest.mark.asyncio
async def test_metric_failure_does_not_fail_activity(activity_environment) -> None:
    """A metric-layer failure must not fail the activity.

    The chunks and manifest are already written at that point — if the activity
    raised, Temporal would retry it and redo the whole aggregation.
    """
    with (
        patch("insights.temporal.usage_report.activities.settings") as mock_settings,
        patch("insights.temporal.usage_report.activities.bucket", return_value="insights"),
        patch("insights.temporal.usage_report.activities.get_instance_region", return_value="US"),
        patch(
            "insights.temporal.usage_report.activities.record_aggregate_output",
            side_effect=RuntimeError("metrics backend down"),
        ) as record_aggregate,
    ):
        mock_settings.EE_AVAILABLE = True
        mock_settings.SITE_URL = "https://us.hanzo.ai"

        await activity_environment.run(
            enqueue_pointer_message,
            EnqueuePointerInputs(ctx=_ctx(), aggregate=_agg()),
        )

    # The failing call was reached, and its exception did not bubble out.
    record_aggregate.assert_called_once()
