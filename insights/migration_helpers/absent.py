"""Build what the ledger already claims was built.

`django_migrations` is a record of intent, not of outcome. A migration marked
applied whose DDL never ran — `migrate --fake`, or a row inserted by hand to get
past a failure — leaves Django certain the table exists. Nothing notices: the
migration cannot run again, `migrate` reports nothing to do, and `migrate --check`
passes, because both read the ledger rather than the schema. The table is simply
absent, and every query against the model raises `UndefinedTable`.

`CreateTableIfNotExists` and `AddColumnIfNotExists` close that gap. They create the
table, or the column, for a model the state already carries, and do nothing when it
is there — so the same migration is a repair on a database that was faked past and
a no-op on a fresh one, where the original operation already did the work:

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[],
            database_operations=[
                CreateTableIfNotExists(model_name="canvas"),
                AddColumnIfNotExists(model_name="canvas", name="draft"),
            ],
        ),
    ]

Neither takes a field definition. The fields, indexes and constraints come from the
model as migration state describes it at this point in the graph, which is the same
source the original `CreateModel` or `AddField` was written from — so what they
build matches what a fresh install gets, and cannot drift from it by transcription.

The same pair is the right instrument whenever a column may already have been added
by hand: `AddColumnIfNotExists` adopts it, where a plain `AddField` fails with
`column ... already exists` and `--fake` skips it on the databases that lack it.

It is state-neutral by construction: the model is already in state, and adding it
again would be a duplicate. Wrap it in `SeparateDatabaseAndState` with empty
`state_operations`, as above.

Idempotent, because `bin/migrate` re-runs a whole migration on failure.

Not reversible. The forward direction creates a table only when one is missing, so
the reverse would have to drop a table this migration may not have created — and
dropping a table is not recoverable by re-running anything.

**Foreign keys to hot tables.** The table is created exactly as the model declares
it, so a `ForeignKey` to `insights_team` or `insights_user` without
`db_constraint=False` builds a real FK constraint, taking a brief
`SHARE ROW EXCLUSIVE` lock on that parent — the same lock the original `CreateModel`
takes on a fresh install. `HotTableAlterPolicy` reads operations statically and
cannot see through to this model's fields, so it will not flag that for you: if the
model has such an FK, acknowledge the migration in
`hot_table_acknowledged_migrations.txt` yourself.
"""

from django.db.migrations.operations.base import Operation

import structlog

logger = structlog.get_logger(__name__)


class CreateTableIfNotExists(Operation):
    """Create a model's table when the database is missing it."""

    reduces_to_sql = True
    reversible = False
    atomic = True

    def __init__(self, model_name: str):
        self.model_name = model_name

    def deconstruct(self):
        return (self.__class__.__qualname__, [], {"model_name": self.model_name})

    def state_forwards(self, app_label, state):
        """No state change: the model is already there, which is the whole problem."""

    def database_forwards(self, app_label, schema_editor, from_state, to_state):
        model = to_state.apps.get_model(app_label, self.model_name)
        if not self.allow_migrate_model(schema_editor.connection.alias, model):
            return

        table = model._meta.db_table
        with schema_editor.connection.cursor() as cursor:
            existing = schema_editor.connection.introspection.table_names(cursor)
        if table in existing:
            logger.info("absent_table.present", table=table, app_label=app_label)
            return

        logger.warn("absent_table.creating", table=table, app_label=app_label)
        schema_editor.create_model(model)

    def database_backwards(self, app_label, schema_editor, from_state, to_state):
        raise NotImplementedError(
            f"{self.describe()} cannot be reversed: it creates a table only when one is missing, "
            "so reversing it would drop a table it may not have created."
        )

    def describe(self):
        return f"Create table for {self.model_name} if the database does not have it"

    @property
    def migration_name_fragment(self):
        return f"create_table_{self.model_name.lower()}_if_not_exists"


class AddColumnIfNotExists(Operation):
    """Add a model field's column when the database is missing it."""

    reduces_to_sql = True
    reversible = False
    atomic = True

    def __init__(self, model_name: str, name: str):
        self.model_name = model_name
        self.name = name

    def deconstruct(self):
        return (self.__class__.__qualname__, [], {"model_name": self.model_name, "name": self.name})

    def state_forwards(self, app_label, state):
        """No state change: the field is already there, which is the whole problem."""

    def database_forwards(self, app_label, schema_editor, from_state, to_state):
        model = to_state.apps.get_model(app_label, self.model_name)
        if not self.allow_migrate_model(schema_editor.connection.alias, model):
            return

        field = model._meta.get_field(self.name)
        table = model._meta.db_table
        with schema_editor.connection.cursor() as cursor:
            present = {c.name for c in schema_editor.connection.introspection.get_table_description(cursor, table)}
        if field.column in present:
            logger.info("absent_column.present", table=table, column=field.column, app_label=app_label)
            return

        logger.warn("absent_column.adding", table=table, column=field.column, app_label=app_label)
        schema_editor.add_field(model, field)

    def database_backwards(self, app_label, schema_editor, from_state, to_state):
        raise NotImplementedError(
            f"{self.describe()} cannot be reversed: it adds a column only when one is missing, "
            "so reversing it would drop a column it may not have added."
        )

    def describe(self):
        return f"Add {self.model_name}.{self.name} if the database does not have it"

    @property
    def migration_name_fragment(self):
        return f"add_column_{self.model_name.lower()}_{self.name.lower()}_if_not_exists"
