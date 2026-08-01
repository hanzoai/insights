import structlog
from temporalio import activity

from insights.temporal.ai.slack_app.types import InsightsSlackInboxOnboardingInputs

logger = structlog.get_logger(__name__)


@activity.defn
def run_insights_slack_inbox_onboarding_activity(inputs: InsightsSlackInboxOnboardingInputs) -> None:
    run_insights_slack_inbox_onboarding(inputs.integration_id)


def run_insights_slack_inbox_onboarding(integration_id: int) -> None:
    """Create #insights-inbox and DM the installer for a fresh Slack install. Plain function so it's
    callable outside the Temporal worker (and unit-testable without an activity environment)."""
    from insights.models.integration import Integration

    from products.slack_app.backend.onboarding import run_install_onboarding

    try:
        integration = Integration.objects.select_related("team", "team__organization").get(
            id=integration_id, kind="slack"
        )
    except Integration.DoesNotExist:
        logger.info("slack_app_inbox_onboarding_integration_gone", integration_id=integration_id)
        return
    run_install_onboarding(integration)
