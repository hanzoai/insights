"""Tests for standing questions: the assistant asking with nobody watching.

`assistant.answer` is faked throughout. Every live generation on this deployment
answers 402 — the org wallet is empty — so the gateway leg is unproven here on
purpose, and what is proven is everything that decides WHETHER and HOW OFTEN that
call is made: the claim, the caps, the settling, and the delivery.

The fakes are patched onto the real attribute, so a renamed or removed seam fails
these tests rather than silently inventing one.
"""

import time
import threading
from datetime import timedelta

from insights.test.base import APIBaseTest, NonAtomicBaseTest
from unittest import mock

from django.db import connection, transaction
from django.test import override_settings
from django.utils import timezone

from rest_framework import status

from products.insights_ai.backend import assistant, delivery, runner
from products.insights_ai.backend.models import Question, Run


def fake_answer(text="Signups are up 12% week on week.", *, delay=0.0, fail=None):
    """A stand-in for the gateway call, optionally slow or broken."""

    def answer(prompt, *, team):
        if delay:
            time.sleep(delay)
        if fail:
            raise fail
        return text

    return answer


def patched(**kwargs):
    return mock.patch.object(assistant, "answer", fake_answer(**kwargs))


class TestRunner(APIBaseTest):
    def setUp(self):
        super().setUp()
        self.question = Question.objects.create(
            team=self.team,
            created_by=self.user,
            name="Weekly signups",
            prompt="How did signups do this week?",
        )

    # Persistence

    def test_asking_persists_the_answer(self):
        with patched(text="Signups are up 12%."), mock.patch.object(delivery, "deliver"):
            run = runner.ask(self.question)

        assert run is not None
        stored = Run.objects.get(pk=run.pk)
        assert stored.status == Run.Status.DONE
        assert stored.answer == "Signups are up 12%."
        assert stored.error == ""
        assert stored.finished_at is not None
        assert stored.question_id == self.question.pk

    def test_a_failed_asking_persists_the_failure(self):
        with patched(fail=RuntimeError("gateway said 402")), mock.patch.object(delivery, "deliver"):
            run = runner.ask(self.question)

        assert run is not None
        stored = Run.objects.get(pk=run.pk)
        assert stored.status == Run.Status.FAILED
        assert "402" in stored.error
        assert stored.answer == ""
        assert stored.finished_at is not None

    def test_asking_marks_the_question_run(self):
        assert self.question.last_run_at is None

        with patched(), mock.patch.object(delivery, "deliver"):
            runner.ask(self.question)

        self.question.refresh_from_db()
        assert self.question.last_run_at is not None

    def test_a_failed_asking_still_waits_out_its_cadence(self):
        """A failing question must not be retried on every tick."""
        with patched(fail=RuntimeError("boom")), mock.patch.object(delivery, "deliver"):
            runner.ask(self.question)

        self.question.refresh_from_db()
        assert self.question.last_run_at is not None
        assert self.question not in list(runner.due())

    # One run at a time

    def test_a_second_run_does_not_start_while_one_is_in_flight(self):
        Run.objects.create(question=self.question, status=Run.Status.RUNNING)

        with patched(), mock.patch.object(delivery, "deliver"):
            second = runner.ask(self.question)

        assert second is None
        # The point is not that claim() returned None, it is that nothing was
        # asked and nothing was written.
        assert Run.objects.filter(question=self.question).count() == 1

    def test_an_abandoned_run_does_not_block_the_question_forever(self):
        """A worker killed mid-run leaves a RUNNING row. It must expire."""
        dead = Run.objects.create(question=self.question, status=Run.Status.RUNNING)
        Run.objects.filter(pk=dead.pk).update(started_at=timezone.now() - timedelta(seconds=settings_timeout() + 60))

        with patched(), mock.patch.object(delivery, "deliver"):
            run = runner.ask(self.question)

        assert run is not None
        dead.refresh_from_db()
        assert dead.status == Run.Status.FAILED
        assert dead.error == runner.TIMED_OUT

    def test_a_disabled_question_is_never_asked(self):
        self.question.enabled = False
        self.question.save()

        with patched(), mock.patch.object(delivery, "deliver"):
            assert runner.ask(self.question) is None

        assert Run.objects.filter(question=self.question).count() == 0

    # Bounds

    @override_settings(INSIGHTS_AI_QUESTION_TIMEOUT_SECONDS=1)
    def test_an_asking_that_outlives_its_wall_clock_fails(self):
        started = time.monotonic()
        with patched(delay=30), mock.patch.object(delivery, "deliver"):
            run = runner.ask(self.question)
        elapsed = time.monotonic() - started

        assert run is not None
        assert run.status == Run.Status.FAILED
        assert run.error == runner.TIMED_OUT
        # The cap is the point: the runner did not wait the full 30 seconds.
        assert elapsed < 10

    @override_settings(INSIGHTS_AI_QUESTION_RUNS_PER_DAY=2)
    def test_a_team_out_of_budget_is_not_asked(self):
        for _ in range(2):
            Run.objects.create(question=self.question, status=Run.Status.DONE)

        with patched(), mock.patch.object(delivery, "deliver"):
            assert runner.ask(self.question) is None

        assert Run.objects.filter(question=self.question).count() == 2

    @override_settings(INSIGHTS_AI_QUESTION_RUNS_PER_DAY=2)
    def test_the_budget_is_per_team_across_all_its_questions(self):
        other = Question.objects.create(team=self.team, name="Churn", prompt="How is churn?")
        for _ in range(2):
            Run.objects.create(question=other, status=Run.Status.DONE)

        with patched(), mock.patch.object(delivery, "deliver"):
            assert runner.ask(self.question) is None

    @override_settings(INSIGHTS_AI_QUESTION_RUNS_PER_DAY=2)
    def test_the_budget_is_a_rolling_day(self):
        for _ in range(2):
            spent = Run.objects.create(question=self.question, status=Run.Status.DONE)
            Run.objects.filter(pk=spent.pk).update(started_at=timezone.now() - timedelta(days=2))

        with patched(), mock.patch.object(delivery, "deliver"):
            assert runner.ask(self.question) is not None

    @override_settings(INSIGHTS_AI_QUESTION_RUNS_PER_DAY=1)
    def test_the_budget_does_not_leak_across_teams(self):
        Run.objects.create(question=self.question, status=Run.Status.DONE)
        other_team = self.organization.teams.create(name="Other")
        elsewhere = Question.objects.create(team=other_team, name="Elsewhere", prompt="How is it?")

        with patched(), mock.patch.object(delivery, "deliver"):
            assert runner.ask(elsewhere) is not None

    # Cadence

    def test_a_question_never_asked_is_due(self):
        assert self.question in list(runner.due())

    def test_a_question_asked_within_its_interval_is_not_due(self):
        Question.objects.filter(pk=self.question.pk).update(last_run_at=timezone.now())
        assert self.question not in list(runner.due())

    def test_a_question_past_its_interval_is_due_again(self):
        Question.objects.filter(pk=self.question.pk).update(last_run_at=timezone.now() - timedelta(days=2))
        assert self.question in list(runner.due())

    def test_an_hourly_question_is_due_sooner_than_a_daily_one(self):
        Question.objects.filter(pk=self.question.pk).update(
            interval=Question.Interval.HOURLY, last_run_at=timezone.now() - timedelta(hours=2)
        )
        assert self.question in list(runner.due())

    def test_a_disabled_question_is_never_due(self):
        Question.objects.filter(pk=self.question.pk).update(enabled=False)
        assert self.question not in list(runner.due())

    # Delivery

    def test_the_finding_is_emailed(self):
        with patched(text="Churn is flat."), mock.patch.object(delivery, "is_email_available", return_value=True):
            with mock.patch.object(delivery, "EmailMessage") as message:
                runner.ask(self.question)

        assert message.called
        context = message.call_args.kwargs["template_context"]
        assert context["answer"] == "Churn is flat."
        # A datetime here raises inside sanitize_email_properties.
        assert isinstance(context["asked_at"], str)
        message.return_value.send.assert_called_once()

    def test_the_campaign_key_is_unique_per_run(self):
        """It is a permanent dedup key: a reused one is silently dropped."""
        keys = []
        with patched(), mock.patch.object(delivery, "is_email_available", return_value=True):
            with mock.patch.object(delivery, "EmailMessage") as message:
                runner.ask(self.question)
                Question.objects.filter(pk=self.question.pk).update(last_run_at=None)
                runner.ask(self.question)
                keys = [call.kwargs["campaign_key"] for call in message.call_args_list]

        assert len(keys) == 2
        assert keys[0] != keys[1]

    def test_delivery_failure_does_not_fail_the_run(self):
        with patched(text="Still true."), mock.patch.object(delivery, "deliver", side_effect=RuntimeError("smtp")):
            run = runner.ask(self.question)

        assert run.status == Run.Status.DONE
        assert run.answer == "Still true."

    def test_nothing_is_emailed_when_email_is_off(self):
        with patched(), mock.patch.object(delivery, "is_email_available", return_value=False):
            with mock.patch.object(delivery, "EmailMessage") as message:
                run = runner.ask(self.question)

        assert run.status == Run.Status.DONE
        assert not message.called


class TestConcurrency(NonAtomicBaseTest):
    """Two workers, two real database connections, one question."""

    # Each test is flushed rather than rolled back, so the project has to be
    # built per test rather than once for the class.
    CLASS_DATA_LEVEL_SETUP = False

    def setUp(self):
        super().setUp()
        self.question = Question.objects.create(team=self.team, name="Signups", prompt="How are signups?")

    def test_a_worker_that_cannot_take_the_lock_does_not_ask(self):
        """The claim is `nowait`: a racing worker leaves rather than queues."""
        refused = []

        def other_worker():
            try:
                refused.append(runner.claim(self.question))
            finally:
                connection.close()

        with transaction.atomic():
            # Hold the question row, exactly as a mid-claim worker would.
            Question.objects.select_for_update().get(pk=self.question.pk)

            worker = threading.Thread(target=other_worker)
            worker.start()
            worker.join(timeout=15)
            assert not worker.is_alive(), "the second worker blocked instead of leaving"

        assert refused == [None]
        assert Run.objects.filter(question=self.question).count() == 0

    def test_only_one_of_two_simultaneous_askings_runs(self):
        """Both workers arrive at once; exactly one asks, and one run is written."""
        entered = threading.Event()
        release = threading.Event()
        outcomes = []

        def slow_answer(prompt, *, team):
            entered.set()
            release.wait(timeout=15)
            return "Signups are up."

        def worker():
            try:
                outcomes.append(runner.ask(self.question))
            finally:
                connection.close()

        with mock.patch.object(assistant, "answer", slow_answer):
            with mock.patch.object(delivery, "deliver"):
                first = threading.Thread(target=worker)
                first.start()
                assert entered.wait(timeout=15), "the first worker never reached the gateway call"

                # The first is now mid-asking with its claim committed.
                second = threading.Thread(target=worker)
                second.start()
                second.join(timeout=15)

                release.set()
                first.join(timeout=15)

        assert not first.is_alive() and not second.is_alive()
        started, declined = [o for o in outcomes if o is not None], [o for o in outcomes if o is None]
        assert len(started) == 1, f"expected exactly one asking, got {outcomes}"
        assert len(declined) == 1
        assert Run.objects.filter(question=self.question).count() == 1
        assert Run.objects.get(question=self.question).status == Run.Status.DONE


class TestQuestionApi(APIBaseTest):
    def url(self, suffix=""):
        return f"/v1/projects/{self.team.pk}/assistant/questions{suffix}"

    def test_creating_a_question(self):
        response = self.client.post(
            self.url(), {"name": "Weekly signups", "prompt": "How did signups do?", "interval": "weekly"}
        )

        assert response.status_code == status.HTTP_201_CREATED, response.json()
        stored = Question.objects.get(pk=response.json()["id"])
        assert stored.team == self.team
        assert stored.created_by == self.user
        assert stored.interval == "weekly"
        assert stored.enabled is True

    def test_listing_questions(self):
        Question.objects.create(team=self.team, name="Mine", prompt="How is it?")

        response = self.client.get(self.url())

        assert response.status_code == status.HTTP_200_OK
        assert [q["name"] for q in response.json()["results"]] == ["Mine"]

    def test_another_projects_questions_are_not_listed(self):
        other_team = self.organization.teams.create(name="Other")
        Question.objects.create(team=other_team, name="Theirs", prompt="How is it?")
        Question.objects.create(team=self.team, name="Mine", prompt="How is it?")

        response = self.client.get(self.url())

        assert [q["name"] for q in response.json()["results"]] == ["Mine"]

    def test_another_projects_question_is_not_readable(self):
        other_team = self.organization.teams.create(name="Other")
        theirs = Question.objects.create(team=other_team, name="Theirs", prompt="How is it?")

        response = self.client.get(self.url(f"/{theirs.pk}"))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_reading_the_runs(self):
        question = Question.objects.create(team=self.team, name="Mine", prompt="How is it?")
        Run.objects.create(question=question, status=Run.Status.DONE, answer="Up 12%.")

        response = self.client.get(self.url(f"/{question.pk}/runs"))

        assert response.status_code == status.HTTP_200_OK
        results = response.json()["results"]
        assert len(results) == 1
        assert results[0]["answer"] == "Up 12%."
        assert results[0]["status"] == "done"

    def test_another_projects_runs_are_not_readable(self):
        other_team = self.organization.teams.create(name="Other")
        theirs = Question.objects.create(team=other_team, name="Theirs", prompt="How is it?")
        Run.objects.create(question=theirs, status=Run.Status.DONE, answer="Secret.")

        response = self.client.get(self.url(f"/{theirs.pk}/runs"))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_switching_a_question_off(self):
        question = Question.objects.create(team=self.team, name="Mine", prompt="How is it?")

        response = self.client.patch(self.url(f"/{question.pk}"), {"enabled": False})

        assert response.status_code == status.HTTP_200_OK
        question.refresh_from_db()
        assert question.enabled is False

    def test_an_empty_prompt_is_refused(self):
        response = self.client.post(self.url(), {"name": "Empty", "prompt": "   "})

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_an_oversized_prompt_is_refused(self):
        response = self.client.post(self.url(), {"name": "Huge", "prompt": "x" * (assistant.MAX_CONTENT_LENGTH + 1)})

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @override_settings(INSIGHTS_AI_MAX_QUESTIONS=2)
    def test_a_project_may_not_keep_unlimited_questions(self):
        for index in range(2):
            Question.objects.create(team=self.team, name=f"Q{index}", prompt="How is it?")

        response = self.client.post(self.url(), {"name": "One too many", "prompt": "How is it?"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Question.objects.filter(team=self.team).count() == 2

    def test_the_read_surface_is_not_under_api(self):
        """`/v1/`, never `/api/`."""
        response = self.client.get(f"/api/projects/{self.team.pk}/assistant/questions")
        assert response.status_code == status.HTTP_404_NOT_FOUND


def settings_timeout() -> int:
    from django.conf import settings

    return settings.INSIGHTS_AI_QUESTION_TIMEOUT_SECONDS
