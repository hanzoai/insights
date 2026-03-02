import json
import logging
import dataclasses
from datetime import timedelta

import structlog
from temporalio import activity, common, workflow

from insights.exceptions_capture import capture_exception
from insights.sync import database_sync_to_async
from insights.temporal.common.base import InsightsWorkflow
from insights.temporal.common.heartbeat import Heartbeater

logger = structlog.get_logger()
logging.basicConfig(level=logging.INFO)


@dataclasses.dataclass
class RunQuotaLimitingInputs:
    pass


@dataclasses.dataclass
class RunQuotaLimitingAllOrgsInputs:
    pass


@activity.defn(name="run-quota-limiting-all-orgs")
async def run_quota_limiting_all_orgs(
    _inputs: RunQuotaLimitingAllOrgsInputs,
) -> None:
    pass


@workflow.defn(name="run-quota-limiting")
class RunQuotaLimitingWorkflow(InsightsWorkflow):
    @staticmethod
    def parse_inputs(inputs: list[str]) -> RunQuotaLimitingInputs:
        """Parse inputs from the management command CLI."""
        loaded = json.loads(inputs[0])
        return RunQuotaLimitingInputs(**loaded)

    @workflow.run
    async def run(self, _inputs: RunQuotaLimitingInputs) -> None:
        try:
            await workflow.execute_activity(
                run_quota_limiting_all_orgs,
                RunQuotaLimitingAllOrgsInputs(),
                start_to_close_timeout=timedelta(hours=12),
                retry_policy=common.RetryPolicy(
                    maximum_attempts=1,
                ),
                heartbeat_timeout=timedelta(minutes=2),
            )

        except Exception as e:
            capture_exception(e)
            raise
