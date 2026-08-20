from django.db import migrations


class Migration(migrations.Migration):
    """Tell Django the two flow tables are already renamed.

    STATE ONLY, for the same reason as cdp/0004: nothing in this deploy applies
    migrations, so the schema half was run by hand and this records it.

        ALTER TABLE insights_hogflow  RENAME TO insights_flow;
        ALTER TABLE hogflow_templates RENAME TO insights_flow_templates;
        CREATE VIEW insights_hogflow  AS SELECT * FROM insights_flow;
        CREATE VIEW hogflow_templates AS SELECT * FROM insights_flow_templates;

    insights_flow carries four inbound foreign keys — from
    workflows_insightsflow{batchjob,schedule,revision} and
    replay_vision_visionaction. They followed the rename without being touched,
    because a foreign key references the table, not its name.
    """

    dependencies = [
        ("workflows", "0017_absent_tables"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterModelTable(name="insightsflow", table="insights_flow"),
                migrations.AlterModelTable(name="insightsflowtemplate", table="insights_flow_templates"),
            ],
        ),
    ]
