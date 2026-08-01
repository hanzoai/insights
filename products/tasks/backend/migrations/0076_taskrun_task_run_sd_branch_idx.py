import django.db.models.fields.json
from django.db import migrations, models

from insights.migration_helpers import SafeAddIndexConcurrently


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("insights", "1270_untrack_provisioning_auth_columns"),
        ("tasks", "0075_task_pin"),
    ]

    operations = [
        SafeAddIndexConcurrently(
            model_name="taskrun",
            index=models.Index(
                django.db.models.fields.json.KeyTransform("self_driving_head_branch", "state"),
                name="task_run_sd_branch_idx",
                condition=models.Q(state__self_driving_head_branch__isnull=False),
            ),
        ),
    ]
