from django.db import migrations, models

from insights.migration_helpers import SafeAddIndexConcurrently


class Migration(migrations.Migration):
    # Concurrent index builds cannot run inside a transaction. Lives in its own
    # migration per Insights policy (don't mix CONCURRENTLY operations with regular DDL).
    atomic = False
    dependencies = [("warehouse_sources", "0093_externaldatajob_latest_run_idx")]

    operations = [
        SafeAddIndexConcurrently(
            model_name="externaldatajob",
            index=models.Index(
                fields=["updated_at"],
                name="idx_extdatajob_updated_at",
            ),
        ),
    ]
