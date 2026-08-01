import typing
from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

from insights.temporal.common.base import InsightsWorkflow

from .activities import RelaySlackMessageInput, relay_slack_message


@workflow.defn(name="insights-code-agent-relay")
class InsightsCodeAgentRelayWorkflow(InsightsWorkflow):
    @staticmethod
    def parse_inputs(inputs: list[str]) -> typing.Any:
        raise NotImplementedError("InsightsCodeAgentRelayWorkflow is not intended to be started via CLI")

    @workflow.run
    async def run(self, input: RelaySlackMessageInput) -> None:
        await workflow.execute_activity(
            relay_slack_message,
            input,
            start_to_close_timeout=timedelta(minutes=1),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )
