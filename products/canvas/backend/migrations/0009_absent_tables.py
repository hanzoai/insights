from django.db import migrations

from insights.migration_helpers import CreateTableIfNotExists


class Migration(migrations.Migration):
    """Build the three canvas tables the ledger already claims were built.

    `0001_initial` is a plain `CreateModel` for `insights_canvas`,
    `insights_canvas_source_version` and `insights_canvas_build`. It is recorded as
    applied in production and none of the three tables exists, so its DDL never ran.
    A migration recorded as applied cannot run again, and `migrate --check` reads the
    same ledger, so nothing reports this — meanwhile every canvas query raises
    `UndefinedTable`.

    All three in one migration deliberately: the models reference each other in a
    cycle (a canvas points at its current source version and latest build; both point
    back at the canvas). Django defers foreign-key DDL to the end of a migration's
    schema editor, so every table is created first and the constraints are added
    afterwards, which is the only order that can satisfy a cycle — and the order a
    fresh install already gets from `0001`.

    Every FK to `insights_team` and `insights_user` here already carries
    `db_constraint=False`, so this takes no lock on either hot table.
    """

    dependencies = [
        ("canvas", "0008_remove_home_canvas"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[],
            database_operations=[
                CreateTableIfNotExists(model_name="canvas"),
                CreateTableIfNotExists(model_name="canvassourceversion"),
                CreateTableIfNotExists(model_name="canvasbuild"),
            ],
        ),
    ]
