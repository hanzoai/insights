from django.db import migrations


class Migration(migrations.Migration):
    """Rename the two cdp tables off the pre-Insights names.

    The models are InsightsFunction and InsightsFunctionTemplate and both pinned
    `db_table` to the old name so the rename would not need a migration. This is
    that migration.

    It is not a plain AlterModelTable, because the destination names are already
    taken. Production carries BOTH sides of a rename someone started and did not
    finish, and the measurement is what decides which is which:

        insights_hogfunction            0 rows
        insights_function               0 rows, 4 outbound FKs
        insights_hogfunctiontemplate   79 rows, latest write 2026-08-09 18:04
        insights_function_template     54 rows, latest write 2026-08-08 12:46

    Zero id overlap between the 79 and the 54 — they are two populations, not a
    copy. The hog-named pair is what the running code reads and what is still
    being written to; the new-named pair has been untouched for a day and is
    reachable from nothing outside itself (its only inbound FK is its own
    insights_function). So the new-named pair is the abandoned half, and it is
    what gets dropped, freeing the names for the tables in use.

    The 54 rows were dumped before this was written. Restoring them is
    `psql < stale_tables_backup.sql` against the pre-rename schema, so this is
    reversible in the sense that matters even though the reverse below only
    restores the names.
    """

    dependencies = [
        ("cdp", "0003_insights_function_drafts"),
    ]

    operations = [
        # Order matters: insights_function holds the FK, so it goes first.
        migrations.RunSQL(
            sql=[
                "DROP TABLE IF EXISTS insights_function CASCADE;",
                "DROP TABLE IF EXISTS insights_function_template CASCADE;",
            ],
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.AlterModelTable(
            name="insightsfunction",
            table="insights_function",
        ),
        migrations.AlterModelTable(
            name="insightsfunctiontemplate",
            table="insights_function_template",
        ),
    ]
