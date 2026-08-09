from django.db import migrations

from insights.migration_helpers import AddColumnIfNotExists, CreateTableIfNotExists


class Migration(migrations.Migration):
    """Build the three workflow tables the ledger already claims were built.

    `insights_hogflow`, `workflows_insightsflowschedule` and
    `workflows_insightsflowrevision` are created by `0007`, `0003` and `0011` — plain
    `CreateModel`s, no `SeparateDatabaseAndState`. All three migrations are recorded
    as applied in production and none of the three tables is there, so the DDL never
    ran: the rows were faked past a failure.

    Nothing catches that on its own. A migration recorded as applied cannot run
    again, `migrate` reports nothing to do, and `migrate --check` passes — all three
    read the ledger, not the schema. Meanwhile every query against these models
    raises `UndefinedTable`, which is why workflows are dead in production.

    `CreateTableIfNotExists` builds each table from the model as state describes it,
    and skips one that is already there — so this migration repairs a database that
    was faked past and is a no-op on a fresh one, where `0003`/`0007`/`0011` already
    did the work.

    All three in one migration deliberately: `InsightsFlowRevision` and
    `InsightsFlowSchedule` both point at `InsightsFlow`. Django defers foreign-key
    DDL to the end of a migration's schema editor, so every table is created first
    and the constraints are added afterwards — the same order a fresh install gets.

    `InsightsFlow.team`/`created_by` and `InsightsFlowSchedule.team` are FKs to
    `insights_team` and `insights_user` that carry a real constraint, so creating
    these tables takes a brief SHARE ROW EXCLUSIVE lock on each of those parents —
    exactly what a fresh install takes. Acknowledged in
    `hot_table_acknowledged_migrations.txt`.
    """

    dependencies = [
        ("workflows", "0016_drop_emailreputationsnapshot_fk"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[],
            database_operations=[
                # `insights_flow` is this model's table under another name, and it has
                # to be renamed before the table below can be built at all.
                #
                # The squashed `insights.0001_initial` creates `InsightsFlow` with
                # `db_table = "insights_flow"`; `0007_migrate_insights_flow_models`
                # then adopts the model into this app declaring
                # `db_table = "insights_hogflow"`, and adopts it state-only, so
                # nothing ever renames the table. That leaves an empty `insights_flow`
                # nothing reads — every reader, including the nodejs workflow tests,
                # uses `insights_hogflow` — holding the index and constraint names the
                # real table needs, so creating `insights_hogflow` fails with
                # `relation "unique_version_per_flow" already exists`.
                #
                # A fresh install lands in exactly the same state, so this is not a
                # production-only repair. Renaming carries the indexes across, which is
                # why it is right where dropping and recreating would be merely
                # possible: those indexes are the ones the model asks for.
                #
                # Guarded both ways, so it is a no-op once the rename has happened and
                # on any database that already has the table.
                migrations.RunSQL(
                    sql="""
                    DO $$
                    BEGIN
                        IF to_regclass('public.insights_hogflow') IS NULL
                           AND to_regclass('public.insights_flow') IS NOT NULL THEN
                            ALTER TABLE insights_flow RENAME TO insights_hogflow;
                        END IF;
                    END $$;
                    """,
                    reverse_sql=migrations.RunSQL.noop,
                ),
                CreateTableIfNotExists(model_name="insightsflow"),
                CreateTableIfNotExists(model_name="insightsflowschedule"),
                CreateTableIfNotExists(model_name="insightsflowrevision"),
                # The renamed table arrives with the shape the baseline gave it, which
                # predates five columns later migrations added — those migrations are
                # recorded as applied, so nothing will add them now. Skipped where the
                # table was built fresh above and already has them.
                AddColumnIfNotExists(model_name="insightsflow", name="encrypted_inputs"),
                AddColumnIfNotExists(model_name="insightsflow", name="draft"),
                AddColumnIfNotExists(model_name="insightsflow", name="draft_updated_at"),
                AddColumnIfNotExists(model_name="insightsflow", name="draft_encrypted_inputs"),
                AddColumnIfNotExists(model_name="insightsflow", name="action_redirects"),
            ],
        ),
    ]
