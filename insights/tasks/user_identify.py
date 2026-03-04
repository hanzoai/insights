import hanzoanalytics
from celery import shared_task

from insights.models import User


@shared_task(ignore_result=True)
def identify_task(user_id: int) -> None:
    user = User.objects.get(id=user_id)
    hanzoanalytics.capture(
        distinct_id=user.distinct_id,
        event="update user properties",
        properties={"$set": user.get_analytics_metadata()},
    )
