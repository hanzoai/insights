from typing import Any

from posthog.temporal.common.base import InsightsWorkflow


class AgentBaseWorkflow(InsightsWorkflow):
    """Base temporal workflow for processing agents asynchronously."""

    async def run(self, inputs: Any) -> None:
        """Execute the agent workflow."""
        raise NotImplementedError
