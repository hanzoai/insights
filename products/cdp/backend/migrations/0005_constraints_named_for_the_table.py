from django.db import migrations, models

# 0004 renamed `insights_hogfunction` to `insights_function` and
# `insights_hogfunctiontemplate` to `insights_function_template`. Postgres
# names a table's own constraints after it at creation and never revisits
# them, so both tables kept a full set spelling the old name -- two primary
# keys, a check constraint and twenty-one NOT NULLs.
#
# Django does not track any of those names: it derives a primary key and a
# NOT NULL from the column, and the check comes with PositiveSmallIntegerField.
# So this is a database-only rename, and the new name is the one Postgres
# would pick today -- which is the point. A constraint named for a table that
# no longer exists is a name nothing can resolve.
#
# The rule, once, over the catalogue: on these two tables, a constraint still
# carrying the old table's name takes the current one. A fresh database never
# had the old names and the loop finds nothing, so this converges from either
# starting point instead of failing on one.
RENAME_TABLE_CONSTRAINTS = """
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT c.conrelid::regclass::text AS tbl,
               c.conname                  AS old_name,
               p.new_prefix || substring(c.conname from length(p.old_prefix) + 1) AS new_name
        FROM (VALUES
            ('insights_hogfunctiontemplate', 'insights_function_template'),
            ('insights_hogfunction',         'insights_function')
        ) AS p(old_prefix, new_prefix)
        JOIN pg_constraint c
          ON c.conrelid = to_regclass(p.new_prefix)
         AND left(c.conname, length(p.old_prefix)) = p.old_prefix
    LOOP
        EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I', r.tbl, r.old_name, r.new_name);
    END LOOP;
END $$;
"""

# The revision table's unique constraint is Django's, so state has to move
# with the database. A rename keeps the index: dropping and re-adding the
# constraint would rebuild it to change a string.
RENAME_REVISION_CONSTRAINT = """
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = to_regclass('cdp_insightsfunctionrevision')
          AND conname = 'unique_hogfunction_revision_version'
    ) THEN
        ALTER TABLE cdp_insightsfunctionrevision
            RENAME CONSTRAINT unique_hogfunction_revision_version TO unique_function_revision_version;
    END IF;
END $$;
"""


class Migration(migrations.Migration):
    dependencies = [("cdp", "0004_tables_named_for_the_model")]

    operations = [
        migrations.RunSQL(RENAME_TABLE_CONSTRAINTS, migrations.RunSQL.noop),
        migrations.SeparateDatabaseAndState(
            database_operations=[migrations.RunSQL(RENAME_REVISION_CONSTRAINT, migrations.RunSQL.noop)],
            state_operations=[
                migrations.RemoveConstraint(
                    model_name="insightsfunctionrevision",
                    name="unique_hogfunction_revision_version",
                ),
                migrations.AddConstraint(
                    model_name="insightsfunctionrevision",
                    constraint=models.UniqueConstraint(
                        fields=("insights_function", "version"),
                        name="unique_function_revision_version",
                    ),
                ),
            ],
        ),
    ]
