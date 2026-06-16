from django.test import TestCase

from insights.celery import app
from insights.tasks.scheduled import setup_periodic_tasks


class TestScheduledTasks(TestCase):
    def test_scheduled_tasks(self) -> None:
        """
        `setup_periodic_tasks` may fail silently. This test ensures that it doesn't.
        """
        try:
            setup_periodic_tasks(app)
        except Exception as exc:
            assert exc is None, exc
