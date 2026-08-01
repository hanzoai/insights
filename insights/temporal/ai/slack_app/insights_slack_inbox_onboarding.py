import json
from datetime import timedelta

import structlog
from temporalio import workflow
from temporalio.common import RetryPolicy

from insights.temporal.ai.slack_app.activities.onboarding import run_insights_slack_inbox_onboarding_activity
from insights.temporal.ai.slack_app.types import InsightsSlackInboxOnboardingInputs
from insights.temporal.common.base import InsightsWorkflow

POSTFN_SLACK_INBOX_ONBOARDING_TIMEOUT_SECONDS = 5 * 60
logger = structlog.get_logger(__name__)


@workflow.defn(name="insights-slack-inbox-onboarding")
class InsightsSlackInboxOnboardingWorkflow(InsightsWorkflow):
    @staticmethod
    def parse_inputs(inputs: list[str]) -> InsightsSlackInboxOnboardingInputs:
        loaded = json.loads(inputs[0])
        return InsightsSlackInboxOnboardingInputs(**loaded)

    @workflow.run
    async def run(self, inputs: InsightsSlackInboxOnboardingInputs) -> None:
        await workflow.execute_activity(
            run_insights_slack_inbox_onboarding_activity,
            args=(inputs,),
            start_to_close_timeout=timedelta(seconds=POSTFN_SLACK_INBOX_ONBOARDING_TIMEOUT_SECONDS),
            # Single attempt: the onboarding DM isn't idempotent, so a retry after a post-then-crash
            # would re-DM the installer. Onboarding is best-effort, so we accept "no retry" over a dup DM.
            retry_policy=RetryPolicy(maximum_attempts=1),
        )
