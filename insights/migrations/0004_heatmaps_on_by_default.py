from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Heatmaps default to on for NEW teams.

    `default=True` is a Django-level default applied when a Team is instantiated;
    Postgres keeps no column default for it, so this migration alters model state
    only and rewrites no rows. EXISTING teams keep `heatmaps_opt_in = NULL`, which
    `RemoteConfig` reads as off (`insights/models/remote_config.py`), so they are
    unaffected until deliberately backfilled.
    """

    dependencies = [
        ("insights", "0003_special_indexes"),
    ]

    operations = [
        migrations.AlterField(
            model_name="team",
            name="heatmaps_opt_in",
            field=models.BooleanField(blank=True, default=True, null=True),
        ),
    ]
