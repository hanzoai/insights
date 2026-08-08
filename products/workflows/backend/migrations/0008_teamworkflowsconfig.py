import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("insights", "0001_initial"),
        ("workflows", "0007_migrate_insights_flow_models"),
    ]

    operations = [
        migrations.CreateModel(
            name="TeamWorkflowsConfig",
            fields=[
                (
                    "team",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        serialize=False,
                        to="insights.team",
                    ),
                ),
                ("capture_workflows_engagement_events", models.BooleanField(default=False)),
            ],
        ),
    ]
