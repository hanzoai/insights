import structlog

logger = structlog.get_logger(__name__)


def process_insights_code_task_termination(payload: dict) -> None:
    """Backwards-compatible wrapper for terminate handling."""
    from insights.temporal.ai.slack_app.insights_code_slack_interactivity import (
        process_insights_code_task_termination_payload,
    )

    process_insights_code_task_termination_payload(payload)
