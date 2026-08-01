from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("workflows", "0015_delete_emailreputationsnapshot"),
    ]

    # 0015 removed EmailReputationSnapshot from Django state via SeparateDatabaseAndState but left
    # the Postgres table and its FK to insights_hogflow in place. Because the reverse relation is
    # gone from state, InsightsFlow.delete() no longer cascade-cleans snapshot rows, and the FK blocks
    # InsightsFlow deletion for any team that still has snapshot data. Drop the FK now so InsightsFlow
    # deletes go through; the table itself is dropped in a follow-up migration once this one has
    # finished rolling out (per the safe-migrations two-phase drop pattern).
    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[],
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        'ALTER TABLE "insights_emailreputationsnapshot" '
                        "DROP CONSTRAINT IF EXISTS "
                        '"insights_emailreputat_hog_flow_id_bebb6dee_fk_insights_h";'
                    ),
                    reverse_sql=(
                        'ALTER TABLE "insights_emailreputationsnapshot" '
                        'ADD CONSTRAINT "insights_emailreputat_hog_flow_id_bebb6dee_fk_insights_h" '
                        'FOREIGN KEY ("hog_flow_id") REFERENCES "insights_hogflow" ("id") '
                        "DEFERRABLE INITIALLY DEFERRED;"
                    ),
                ),
            ],
        ),
    ]
