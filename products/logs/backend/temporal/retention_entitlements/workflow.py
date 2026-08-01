from datetime import timedelta

from temporalio import common, workflow

from insights.temporal.common.base import InsightsWorkflow

with workflow.unsafe.imports_passed_through():
    from products.logs.backend.temporal.retention_entitlements.activities import enforce_logs_retention_entitlements
    from products.logs.backend.temporal.retention_entitlements.types import (
        EnforceLogsRetentionEntitlementsInput,
        EnforceLogsRetentionEntitlementsOutput,
    )


@workflow.defn(name="enforce-logs-retention-entitlements")
class EnforceLogsRetentionEntitlementsWorkflow(InsightsWorkflow):
    """Manual reconciliation workflow for Logs retention entitlements.

    This workflow is registered for explicit runs via Temporal management commands,
    but is not added to `insights.temporal.schedule.schedules`.
    """

    inputs_cls = EnforceLogsRetentionEntitlementsInput

    @workflow.run
    async def run(self, input: EnforceLogsRetentionEntitlementsInput) -> EnforceLogsRetentionEntitlementsOutput:
        return await workflow.execute_activity(
            enforce_logs_retention_entitlements,
            input,
            start_to_close_timeout=timedelta(minutes=15),
            retry_policy=common.RetryPolicy(
                maximum_attempts=2,
                initial_interval=timedelta(minutes=1),
            ),
            heartbeat_timeout=timedelta(minutes=5),
        )
