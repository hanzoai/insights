from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("workflows", "0005_remove_insightsflowbatchjob_scheduled_at"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[],
            database_operations=[
                # `workflows_hogflowbatchjob` is what this table was called when this migration
                # ran, and no database has it under that name now: `0001` creates
                # `workflows_insightsflowbatchjob`, which is what the model asks for and what
                # production carries. Only a fresh build ever runs this again, and it died at
                # `relation "workflows_hogflowbatchjob" does not exist`, one migration after
                # `0005` removed the field from state and left the column for this to drop.
                migrations.RunSQL(
                    sql='ALTER TABLE "workflows_insightsflowbatchjob" DROP COLUMN IF EXISTS "scheduled_at"',
                    reverse_sql='ALTER TABLE "workflows_insightsflowbatchjob" ADD COLUMN "scheduled_at" timestamptz NULL',
                ),
            ],
        ),
    ]
