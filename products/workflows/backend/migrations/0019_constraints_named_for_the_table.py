from django.db import migrations, models

# The workflows half of the same story as cdp 0005: `hogflow_templates` is
# `insights_flow_templates` now, but Postgres named its primary key and its
# twelve NOT NULLs after the table it was created as. Django tracks neither,
# so the database moves alone; the new name is what Postgres would generate
# for this table today.
RENAME_TABLE_CONSTRAINTS = """
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT c.conname AS old_name,
               'insights_flow_templates' || substring(c.conname from length('hogflow_templates') + 1) AS new_name
        FROM pg_constraint c
        WHERE c.conrelid = to_regclass('insights_flow_templates')
          AND left(c.conname, length('hogflow_templates')) = 'hogflow_templates'
    LOOP
        EXECUTE format(
            'ALTER TABLE insights_flow_templates RENAME CONSTRAINT %I TO %I', r.old_name, r.new_name
        );
    END LOOP;
END $$;
"""

# This one is Django's, so state moves with the database.
RENAME_REVISION_CONSTRAINT = """
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = to_regclass('workflows_insightsflowrevision')
          AND conname = 'unique_hogflow_revision_version'
    ) THEN
        ALTER TABLE workflows_insightsflowrevision
            RENAME CONSTRAINT unique_hogflow_revision_version TO unique_flow_revision_version;
    END IF;
END $$;
"""


class Migration(migrations.Migration):
    dependencies = [("workflows", "0018_tables_named_for_the_model")]

    operations = [
        migrations.RunSQL(RENAME_TABLE_CONSTRAINTS, migrations.RunSQL.noop),
        migrations.SeparateDatabaseAndState(
            database_operations=[migrations.RunSQL(RENAME_REVISION_CONSTRAINT, migrations.RunSQL.noop)],
            state_operations=[
                migrations.RemoveConstraint(
                    model_name="insightsflowrevision",
                    name="unique_hogflow_revision_version",
                ),
                migrations.AddConstraint(
                    model_name="insightsflowrevision",
                    constraint=models.UniqueConstraint(
                        fields=("insights_flow", "version"),
                        name="unique_flow_revision_version",
                    ),
                ),
            ],
        ),
    ]
