"""The scheduler's end of the standing questions.

Two tasks, because one asking must not decide the fate of the others: the tick
only picks what is due and hands each to its own task, so a question that sits at
its wall clock delays nothing but itself.

Neither task decides whether it is allowed to run — `runner.claim` does, once,
for every caller. A task that raced another, or a team out of budget, simply
finds the claim declined.
"""

from celery import shared_task
from structlog import get_logger

from products.insights_ai.backend import runner
from products.insights_ai.backend.models import Question

logger = get_logger(__name__)


@shared_task(ignore_result=True)
def ask_due_questions() -> None:
    """Hand every question whose cadence has come round to its own task."""
    for question_id in runner.due().values_list("id", flat=True):
        ask_question.delay(str(question_id))


@shared_task(ignore_result=True)
def ask_question(question_id: str) -> None:
    """Ask one standing question. Silent on a question that has since gone."""
    question = Question.objects.filter(pk=question_id).select_related("team").first()
    if question is None:
        return
    runner.ask(question)
