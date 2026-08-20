from django.db import migrations


class Migration(migrations.Migration):
    """Tell Django the two cdp tables are already renamed.

    STATE ONLY. The database side is done — applied by hand, because nothing in
    this deploy runs migrations: deploy.yml has no migrate step, there is no
    migration Job or CronJob, and no initContainer. A migration that changed the
    schema here would sit unapplied while the image that needs it rolled, which
    is exactly how an earlier attempt at this rename took production down.

    What was run:

        DROP TABLE insights_function CASCADE;          -- 0 rows, abandoned
        DROP TABLE insights_function_template CASCADE; -- 54 rows, dumped first
        ALTER TABLE insights_hogfunction         RENAME TO insights_function;
        ALTER TABLE insights_hogfunctiontemplate RENAME TO insights_function_template;
        CREATE VIEW insights_hogfunction         AS SELECT * FROM insights_function;
        CREATE VIEW insights_hogfunctiontemplate AS SELECT * FROM insights_function_template;

    The views are what make this safe to land whenever: they are auto-updatable
    (single table, no aggregate — information_schema reports is_updatable YES),
    so an image still naming the old tables keeps working until it rolls. They
    come out once every image names the new ones.

    Which half was abandoned was measured, not assumed: 0 and 54 rows against 0
    and 79 in use, zero id overlap, and the surviving pair had not been written
    to in two days while the live one was written minutes earlier.
    """

    dependencies = [
        ("cdp", "0003_insights_function_drafts"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterModelTable(name="insightsfunction", table="insights_function"),
                migrations.AlterModelTable(name="insightsfunctiontemplate", table="insights_function_template"),
            ],
        ),
    ]
