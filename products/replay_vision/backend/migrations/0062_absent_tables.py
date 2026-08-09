from django.db import migrations

from insights.migration_helpers import CreateTableIfNotExists


class Migration(migrations.Migration):
    """Build the two vision-action tables the ledger already claims were built.

    Both are created by plain `CreateModel`s that are recorded as applied in
    production while neither table exists, so the DDL never ran. A migration recorded
    as applied cannot run again and `migrate --check` reads the same ledger, so
    nothing reports it.

    `VisionAction` points at `InsightsFlow`, whose table is missing for the same
    reason, so this migration depends on the workflows repair rather than on the
    workflows leaf — the FK has to have something to reference.

    `VisionAction.team`/`created_by` and `VisionActionRun.team` are FKs to
    `insights_team` and `insights_user` that carry a real constraint, so creating
    these tables takes a brief SHARE ROW EXCLUSIVE lock on each parent — exactly what
    a fresh install takes. Acknowledged in `hot_table_acknowledged_migrations.txt`.
    """

    dependencies = [
        ("replay_vision", "0061_replayscanner_drop_legacy_name_constraint"),
        ("workflows", "0017_absent_tables"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[],
            database_operations=[
                CreateTableIfNotExists(model_name="visionaction"),
                CreateTableIfNotExists(model_name="visionactionrun"),
            ],
        ),
    ]
