from insights.temporal.ai.slack_app import SLACK_APP_ACTIVITIES
from insights.temporal.ai.slack_app.insights_code_slack_interactivity import (
    InsightsCodeSlackTerminateTaskWorkflow,
    process_insights_code_terminate_task_activity,
)
from insights.temporal.ai.slack_app.insights_code_slack_mention import InsightsCodeSlackMentionWorkflow
from insights.temporal.ai.slack_app.insights_code_slack_mention_command import InsightsCodeSlackMentionCommandWorkflow
from insights.temporal.ai.slack_app.insights_slack_inbox_onboarding import InsightsSlackInboxOnboardingWorkflow
from insights.temporal.ai.slack_app.slack_app_mention import SlackAppMentionWorkflow

# Insights Desktop Slack workflows live on TASKS_TASK_QUEUE alongside ProcessTaskWorkflow,
# the worker they hand off to once a repo is picked. The subset is kept exported so
# start_temporal_worker can register it on that queue without pulling in unrelated AI
# workflows.
INSIGHTS_CODE_SLACK_WORKFLOWS = [
    InsightsCodeSlackMentionWorkflow,
    SlackAppMentionWorkflow,
    InsightsCodeSlackMentionCommandWorkflow,
    InsightsCodeSlackTerminateTaskWorkflow,
    InsightsSlackInboxOnboardingWorkflow,
]

INSIGHTS_CODE_SLACK_ACTIVITIES = [
    *SLACK_APP_ACTIVITIES,
    process_insights_code_terminate_task_activity,
]

# The AI task queue carries no workflows in this build. Registration still happens here and
# only here, so a worker for that queue starts and idles instead of failing, and anything
# added later joins these two lists rather than a second registration path.
AI_WORKFLOWS: list = []

AI_ACTIVITIES: list = []
