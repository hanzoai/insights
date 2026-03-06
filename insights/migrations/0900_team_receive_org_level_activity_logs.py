from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("insights", "0899_add_cohort_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="team",
            name="receive_org_level_activity_logs",
            field=models.BooleanField(blank=True, default=False, null=True),
        ),
    ]
