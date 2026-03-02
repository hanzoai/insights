"""Temporal workflow definition for sentiment classification."""

from datetime import timedelta
from typing import Any

import temporalio
from temporalio.common import RetryPolicy

from insights.temporal.common.base import InsightsWorkflow
from insights.temporal.llm_analytics.sentiment.activities import classify_sentiment_activity
from insights.temporal.llm_analytics.sentiment.constants import ACTIVITY_TIMEOUT_SECONDS, MAX_RETRY_ATTEMPTS
from insights.temporal.llm_analytics.sentiment.schema import ClassifySentimentInput


# Must match constants.WORKFLOW_NAME
@temporalio.workflow.defn(name="llma-sentiment-classify")
class ClassifySentimentWorkflow(InsightsWorkflow):
    @staticmethod
    def parse_inputs(inputs: list[str]) -> ClassifySentimentInput:
        return ClassifySentimentInput(
            team_id=int(inputs[0]),
            trace_ids=inputs[1:],
        )

    @temporalio.workflow.run
    async def run(self, input: ClassifySentimentInput) -> dict[str, dict[str, Any]]:
        return await temporalio.workflow.execute_activity(
            classify_sentiment_activity,
            input,
            start_to_close_timeout=timedelta(seconds=ACTIVITY_TIMEOUT_SECONDS),
            retry_policy=RetryPolicy(maximum_attempts=MAX_RETRY_ATTEMPTS),
        )
