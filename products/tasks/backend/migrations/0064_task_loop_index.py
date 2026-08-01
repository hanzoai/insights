from django.db import migrations, models

from insights.migration_helpers import SafeAddIndexConcurrently


class Migration(migrations.Migration):
    # insights_task is large enough that a plain CREATE INDEX would hold an ACCESS EXCLUSIVE
    # lock for the whole build. CONCURRENTLY cannot run inside a transaction.
    atomic = False

    dependencies = [
        ("tasks", "0063_loop_looptrigger_loopfire"),
    ]

    operations = [
        SafeAddIndexConcurrently(
            model_name="task",
            index=models.Index(fields=["loop"], name="insights_task_loop_idx"),
        ),
    ]
