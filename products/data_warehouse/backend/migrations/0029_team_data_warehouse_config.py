from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("insights", "1043_add_15_minute_interval_to_batch_exports"),
        ("data_warehouse", "0028_datawarehousesavedquery_updated_at"),
    ]

    operations = [
        migrations.CreateModel(
            name="TeamDataWarehouseConfig",
            fields=[
                (
                    "team",
                    models.OneToOneField(
                        on_delete=models.CASCADE,
                        primary_key=True,
                        serialize=False,
                        to="insights.team",
                    ),
                ),
                (
                    "overview_dashboards",
                    models.ManyToManyField(
                        blank=True,
                        related_name="+",
                        to="insights.dashboard",
                    ),
                ),
            ],
            options={
                "app_label": "data_warehouse",
            },
        ),
    ]
