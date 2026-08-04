"""Putting a finding in front of a person.

Nobody is watching the run, so an answer that only lands in the database has not
actually been delivered. This is the same path the alerting product uses to tell
someone their alert fired: an `EmailMessage` with a template, sent to the people
who can see the project.

Not the activity log: `MyNotificationsViewSet` only returns items the reading
user themselves created or edited, so a row written by the scheduler is invisible
in the bell. Not Slack either — the Dagster alert path returns early unless
`CLOUD_DEPLOYMENT` is set, which it is not here.
"""

import structlog

from insights.email import EmailMessage, is_email_available

logger = structlog.get_logger(__name__)

# What the mail carries of the answer. The whole thing is on the run and one
# click away; an unbounded body is a mail that bounces for size.
MAX_EMAILED_CHARS = 20000


def deliver(run) -> bool:
    """Email the finding to everyone with access to the project.

    Returns whether a message went out. False — never an exception — when email
    is switched off or nobody can see the project, because neither is a fault of
    the run.
    """
    question = run.question
    team = question.team

    if not is_email_available(with_absolute_urls=True):
        logger.info("insights_ai.delivery_skipped_no_email", run_id=str(run.pk))
        return False

    recipients = list(team.all_users_with_access())
    if not recipients:
        logger.info("insights_ai.delivery_skipped_no_recipients", run_id=str(run.pk))
        return False

    message = EmailMessage(
        # Permanently unique: `MessagingRecord` dedups on this key forever, so a
        # reused one is silently dropped. The run id is minted per asking, which
        # also makes a retried send idempotent rather than a second copy.
        campaign_key=f"insights-ai-question-{run.pk}",
        subject=f"{question.name} — {team.name}",
        template_name="insights_ai_question",
        template_context={
            # Strings only: `sanitize_email_properties` raises on a datetime.
            "question_name": question.name,
            "prompt": question.prompt,
            "answer": run.answer[:MAX_EMAILED_CHARS],
            "truncated": len(run.answer) > MAX_EMAILED_CHARS,
            "asked_at": run.started_at.strftime("%Y-%m-%d %H:%M UTC"),
            "project_name": team.name,
            "questions_url": f"/project/{team.pk}/assistant/questions",
        },
    )
    for user in recipients:
        message.add_user_recipient(user)

    message.send()
    logger.info("insights_ai.delivered", run_id=str(run.pk), recipients=len(recipients))
    return True
