from django.db import migrations


class Migration(migrations.Migration):
    """Rename the two flow tables off the pre-Insights names.

    Same shape as cdp/0004: the models are InsightsFlow and InsightsFlowTemplate,
    and both pinned `db_table` to the old name to avoid exactly this migration.

    0017_absent_tables adopted insights_hogflow state-only — it declared the
    table to Django without creating it, because it already existed. That makes
    this rename the first operation to actually touch it, so the state and the
    database have to agree before it runs; they do, and `manage.py migrate --plan`
    is where to confirm that rather than here.

    AlterModelTable is a catalog rename in Postgres: no rewrite, and foreign keys
    follow the table. Reversible.

    ⚠ nodejs names insights_hogflow in raw SQL (workflows-e2e.test.ts). That moves
    in the same commit.
    """

    dependencies = [
        ("workflows", "0017_absent_tables"),
    ]

    operations = [
        migrations.AlterModelTable(
            name="insightsflow",
            table="insights_flow",
        ),
        migrations.AlterModelTable(
            name="insightsflowtemplate",
            table="insights_flow_templates",
        ),
    ]
