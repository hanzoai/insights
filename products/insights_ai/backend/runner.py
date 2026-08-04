"""Asking a standing question, with nobody watching.

The unattended counterpart to the conversation API. Same gateway, same project,
but no request to fail into and no person to give up: a scheduler tick is the
caller, so everything a human would have bounded by losing patience has to be
bounded here.

Three things this owns, and nothing else does:

CLAIM. A question is asked by one worker at a time. The claim is the `Run` row
itself, taken under a row lock on the question, so a slow asking cannot stack up
behind itself when the next tick arrives — the second worker finds the row and
leaves. A worker that dies leaves a run that never settles, so a claim expires:
past the wall clock it is taken to be dead and settled as such, or one crash
would silence a question permanently.

SPEND. Runs per team per rolling day, checked before the claim is taken so a
refusal costs nothing at the gateway.

WALL CLOCK. `assistant.answer` is a blocking call to a metered endpoint. It runs
on its own thread and is collected until the deadline; past it the run fails and
settles rather than holding the worker for as long as the gateway feels like.

Delivery is deliberately outside the run's own success: the finding is durable
before anyone is told about it, so a mail problem loses the email, not the answer.
"""

import threading
from datetime import timedelta

from django.conf import settings
from django.db import DatabaseError, transaction
from django.db.models import Q
from django.utils import timezone

import structlog

from products.insights_ai.backend import assistant, delivery
from products.insights_ai.backend.models import INTERVALS, Question, Run

logger = structlog.get_logger(__name__)

TIMED_OUT = "Timed out."


class TimedOut(Exception):
    """The asking outlived its wall clock."""


def due(now=None):
    """Enabled questions whose cadence has come round, oldest-waiting first.

    Deliberately not a per-question `due_at()` loop: this is the scheduler's
    query and runs on every tick, so it is expressed once, in the database.
    """
    now = now or timezone.now()
    elapsed = Q(last_run_at__isnull=True)
    for interval, delta in INTERVALS.items():
        elapsed |= Q(interval=interval, last_run_at__lte=now - delta)
    return Question.objects.filter(Q(enabled=True) & elapsed).order_by("last_run_at")


def claim(question) -> "Run | None":
    """Take the right to ask this question, or decline.

    Returns the run to fill in, or None if this asking must not start: the
    question is gone or switched off, another worker holds it, one is already in
    flight, or the team is out of budget for the day.

    The lock is `nowait`: a worker that cannot have the row immediately is by
    definition racing another that already has it, and the answer to that is to
    leave rather than to queue up behind it.
    """
    now = timezone.now()
    try:
        with transaction.atomic():
            locked = Question.objects.select_for_update(nowait=True).filter(pk=question.pk).first()
            if locked is None or not locked.enabled:
                return None

            _settle_abandoned(locked, now)

            if _in_flight(locked, now):
                logger.info("insights_ai.question_already_running", question_id=str(locked.pk))
                return None

            if _spent(locked.team_id, now):
                logger.warning(
                    "insights_ai.question_over_daily_cap",
                    question_id=str(locked.pk),
                    team_id=locked.team_id,
                    cap=settings.INSIGHTS_AI_QUESTION_RUNS_PER_DAY,
                )
                return None

            run = Run.objects.create(question=locked)
            # Set from the claim, not from the answer: the cadence measures
            # askings, so a question that fails still waits its interval out
            # instead of being retried on every tick.
            Question.objects.filter(pk=locked.pk).update(last_run_at=now, updated_at=now)
            return run
    except DatabaseError:
        # Another worker holds the row and is asking this question right now.
        logger.info("insights_ai.question_locked", question_id=str(question.pk))
        return None


def ask(question) -> "Run | None":
    """Ask it, record what came back, and tell someone.

    Returns the settled run, or None if the claim was declined. Never raises for
    a failed generation: an unattended caller has nowhere to put an exception,
    and the failure is already on the row.
    """
    run = claim(question)
    if run is None:
        return None

    try:
        answer = _within_deadline(question, settings.INSIGHTS_AI_QUESTION_TIMEOUT_SECONDS)
    except Exception as error:
        logger.exception("insights_ai.question_failed", question_id=str(question.pk), run_id=str(run.pk))
        return _settle(run, Run.Status.FAILED, error=str(error) or error.__class__.__name__)

    run = _settle(run, Run.Status.DONE, answer=answer)

    try:
        delivery.deliver(run)
    except Exception:
        # The finding is already durable and readable over the API. A mail
        # problem must not turn a good answer into a failed run.
        logger.exception("insights_ai.question_delivery_failed", run_id=str(run.pk))

    return run


# Internals


def _within_deadline(question, seconds: int) -> str:
    """`assistant.answer`, given a wall clock it does not have of its own.

    The call is synchronous and speaks to a metered endpoint, so it is run on a
    daemon thread and collected until the deadline. Past that the thread is
    abandoned rather than waited on — it holds no lock and its own client has a
    timeout, and the alternative is a worker pinned for as long as the gateway
    takes.

    Both arguments are resolved before the thread starts. Django connections are
    thread-local, so touching a lazy foreign key in there would open a second
    connection that an abandoned thread then leaves behind.
    """
    prompt, team = question.prompt, question.team
    outcome: dict = {}

    def call() -> None:
        try:
            outcome["answer"] = assistant.answer(prompt, team=team)
        except BaseException as error:
            outcome["error"] = error

    worker = threading.Thread(target=call, name=f"insights-ai-question-{question.pk}", daemon=True)
    worker.start()
    worker.join(seconds)

    if worker.is_alive():
        raise TimedOut(TIMED_OUT)
    if "error" in outcome:
        raise outcome["error"]
    return outcome.get("answer") or ""


def _settle(run, status, *, answer: str = "", error: str = "") -> Run:
    """Close the run out. The only place a run stops being RUNNING."""
    finished = timezone.now()
    Run.objects.filter(pk=run.pk).update(status=status, finished_at=finished, answer=answer, error=error)
    run.refresh_from_db()
    return run


def _expiry(now):
    return now - timedelta(seconds=settings.INSIGHTS_AI_QUESTION_TIMEOUT_SECONDS)


def _in_flight(question, now) -> bool:
    return Run.objects.filter(question=question, status=Run.Status.RUNNING, started_at__gt=_expiry(now)).exists()


def _settle_abandoned(question, now) -> None:
    """Fail runs whose worker died holding the claim.

    Without this a killed worker leaves a row that is forever about to finish,
    and the question is never asked again.
    """
    Run.objects.filter(question=question, status=Run.Status.RUNNING, started_at__lte=_expiry(now)).update(
        status=Run.Status.FAILED, finished_at=now, error=TIMED_OUT
    )


def _spent(team_id, now) -> bool:
    """Whether this team has used its askings for the rolling day."""
    used = Run.objects.filter(question__team_id=team_id, started_at__gte=now - timedelta(days=1)).count()
    return used >= settings.INSIGHTS_AI_QUESTION_RUNS_PER_DAY
