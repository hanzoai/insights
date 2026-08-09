from django.db import migrations

from insights.migration_helpers import CreateTableIfNotExists


class Migration(migrations.Migration):
    """Build the three Streamlit tables the ledger already claims were built.

    `0001_initial` is a plain `CreateModel` for all three. It is recorded as applied
    in production and none of the tables exists, so its DDL never ran. A migration
    recorded as applied cannot run again and `migrate --check` reads the same ledger,
    so nothing reports it.

    All three in one migration deliberately: an app points at its live version and a
    version points back at its app, so the FKs form a cycle. Django defers
    foreign-key DDL to the end of a migration's schema editor, so the tables are
    created first and the constraints added afterwards — the only order that
    satisfies a cycle, and the one a fresh install already gets.

    `StreamlitApp.team`/`created_by` and `StreamlitAppVersion.created_by` are FKs to
    `insights_team` and `insights_user` that carry a real constraint, so creating
    these tables takes a brief SHARE ROW EXCLUSIVE lock on each parent — exactly what
    a fresh install takes. Acknowledged in `hot_table_acknowledged_migrations.txt`.
    """

    dependencies = [
        ("streamlit_apps", "0003_alter_streamlitapp_options_and_more"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[],
            database_operations=[
                CreateTableIfNotExists(model_name="streamlitapp"),
                CreateTableIfNotExists(model_name="streamlitappversion"),
                CreateTableIfNotExists(model_name="streamlitappsandbox"),
            ],
        ),
    ]
