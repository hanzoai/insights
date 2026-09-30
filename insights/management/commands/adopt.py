"""Carry a database built by the squashed graph onto the converged one.

The 1.52 line built its database from one squashed `0001_initial` per app. The
converged tree carries upstream's own graph for every product app and the fork's
graph for `insights`. The tables are the same tables; the ledger names different
migrations. `migrate` on such a database re-runs upstream's `CreateModel` against
tables that exist and stops, so the ledger has to be carried across first.

`adopt` does that once, in one transaction:

1. Records every first-party migration (code under BASE_DIR) the ledger lacks
   as applied. The squashed graph's rows stay beside them: neither graph reads
   the other's names, so the image being replaced still finds its own ledger
   complete and a rollback needs no ledger surgery. Third-party apps' unapplied
   migrations run for real, in graph order.
2. Builds, from the final migration state, every table, column, index and
   constraint the first-party models declare and the database lacks. The schema
   editor writes the same DDL a fresh install runs, so the two cannot drift.
3. Drops NOT NULL from columns the models no longer write (the column and its
   rows stay), and from columns a model now declares nullable, so an insert from
   the new models cannot fail on a column it does not know.

Nothing is dropped or rewritten. It runs only on a squashed ledger: one that has
`insights.0002_managed_tables` and lacks `insights.0005_user_integration_and_push_token`.
Anywhere else it reports nothing to do and exits 0, so it can sit in front of
`migrate` on every deploy.

    manage.py adopt           adopt, then report what was built
    manage.py adopt --plan    report what adopting would do, change nothing
"""

from __future__ import annotations

import sys
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import DEFAULT_DB_ALIAS, connections, transaction
from django.db.migrations.executor import MigrationExecutor
from django.db.migrations.operations import RunPython, RunSQL
from django.db.migrations.recorder import MigrationRecorder

SQUASHED = ("insights", "0002_managed_tables")
CONVERGED = ("insights", "0005_user_integration_and_push_token")


def first_party(loader) -> set[str]:
    """App labels whose migrations live in this tree rather than in site-packages."""
    base = Path(settings.BASE_DIR).resolve()
    labels = set()
    for (label, _), migration in loader.disk_migrations.items():
        path = Path(sys.modules[type(migration).__module__].__file__).resolve()
        if path.is_relative_to(base) and "site-packages" not in path.parts:
            labels.add(label)
    return labels


def squashed(applied: set[tuple[str, str]]) -> bool:
    return SQUASHED in applied and CONVERGED not in applied


def data_steps(migration) -> list[str]:
    """Operations a fake skips that the schema pass cannot rebuild."""
    out = []

    def walk(ops):
        for op in ops:
            if isinstance(op, RunPython | RunSQL):
                out.append(type(op).__name__)
            for attr in ("database_operations", "operations"):
                walk(getattr(op, attr, []) or [])

    walk(migration.operations)
    return out


class Schema:
    """What the database has, read once and kept current as adopt builds."""

    def __init__(self, connection):
        self.connection = connection
        with connection.cursor() as c:
            c.execute(
                "SELECT table_name, column_name, is_nullable, column_default "
                "FROM information_schema.columns WHERE table_schema = current_schema()"
            )
            self.columns: dict[str, dict[str, tuple[bool, str | None]]] = {}
            for table, column, nullable, default in c.fetchall():
                self.columns.setdefault(table, {})[column] = (nullable == "YES", default)

    def constraints(self, table: str) -> dict:
        with self.connection.cursor() as c:
            return self.connection.introspection.get_constraints(c, table)


def build(schema_editor, schema: Schema, models, report) -> None:
    """Create what the models declare and the database lacks."""
    created = set()
    for model in models:
        table = model._meta.db_table
        if table in schema.columns:
            continue
        schema_editor.create_model(model)
        created.add(table)
        schema.columns[table] = {f.column: (True, None) for f in model._meta.local_concrete_fields}
        report("table", table)

    for model in models:
        table = model._meta.db_table
        if table in created:
            continue
        for field in model._meta.local_concrete_fields:
            if field.column not in schema.columns[table]:
                schema_editor.add_field(model, field)
                schema.columns[table][field.column] = (field.null, None)
                report("column", f"{table}.{field.column}")

    for model in models:
        table = model._meta.db_table
        if table in created:
            continue
        have = schema.constraints(table)
        names = set(have)
        uniques = {tuple(c["columns"]) for c in have.values() if c["unique"]}
        indexed = {tuple(c["columns"]) for c in have.values() if c["index"] or c["unique"]}

        for index in model._meta.indexes:
            if index.name not in names:
                schema_editor.add_index(model, index)
                report("index", f"{table}.{index.name}")
        for constraint in model._meta.constraints:
            if constraint.name not in names:
                schema_editor.add_constraint(model, constraint)
                report("constraint", f"{table}.{constraint.name}")
        for fields in model._meta.unique_together:
            columns = tuple(model._meta.get_field(f).column for f in fields)
            if columns not in uniques:
                schema_editor.execute(
                    schema_editor._create_unique_sql(model, [model._meta.get_field(f) for f in fields])
                )
                report("unique", f"{table}({', '.join(columns)})")
        for field in model._meta.local_concrete_fields:
            if field.primary_key:
                continue
            if field.unique and (field.column,) not in uniques:
                schema_editor.execute(schema_editor._create_unique_sql(model, [field]))
                report("unique", f"{table}({field.column})")
            elif field.db_index and not field.unique and (field.column,) not in indexed:
                for statement in schema_editor._field_indexes_sql(model, field):
                    schema_editor.execute(statement)
                report("index", f"{table}({field.column})")


def relax(schema_editor, schema: Schema, models, report) -> None:
    """NOT NULL off wherever the models will not write a value."""
    quote = schema_editor.quote_name
    for model in models:
        table = model._meta.db_table
        fields = {f.column: f for f in model._meta.local_concrete_fields}
        for column, (nullable, default) in sorted(schema.columns.get(table, {}).items()):
            if nullable or default is not None:
                continue
            field = fields.get(column)
            if field is None or (field.null and not field.primary_key):
                schema_editor.execute(f"ALTER TABLE {quote(table)} ALTER COLUMN {quote(column)} DROP NOT NULL")
                schema.columns[table][column] = (True, default)
                report("nullable", f"{table}.{column}" + ("" if field else " (no longer in the model)"))


class Command(BaseCommand):
    help = "Carry a database built by the squashed graph onto the converged one, once."

    def add_arguments(self, parser):
        parser.add_argument("--plan", action="store_true", help="report, change nothing")
        parser.add_argument("--database", default=DEFAULT_DB_ALIAS)

    def handle(self, *args, **options):
        connection = connections[options["database"]]
        executor = MigrationExecutor(connection)
        loader = executor.loader
        applied = set(loader.applied_migrations)
        if not squashed(applied):
            self.stdout.write("adopt: ledger is not the squashed graph; nothing to do")
            return

        ours = first_party(loader)
        # Plan as if no first-party migration had run, so the state is built from
        # the tree's own graph; record only what the ledger does not already hold.
        loader.applied_migrations = {k: v for k, v in loader.applied_migrations.items() if k[0] not in ours}
        plan = executor.migration_plan(loader.graph.leaf_nodes())
        fake = [m for m, _ in plan if m.app_label in ours and (m.app_label, m.name) not in applied]
        real = [m for m, _ in plan if m.app_label not in ours]
        skipped = [(m, s) for m in fake if (s := data_steps(m))]

        self.stdout.write(
            f"adopt: {len(ours)} first-party apps; {len(fake)} migrations recorded, "
            f"{len(real)} third-party migrations run"
        )
        for m in real:
            self.stdout.write(f"  run    {m.app_label}.{m.name}")
        for m, steps in skipped:
            self.stdout.write(f"  skip   {m.app_label}.{m.name}: {', '.join(steps)}")
        if options["plan"]:
            return

        built: list[tuple[str, str]] = []
        report = lambda kind, what: built.append((kind, what))  # noqa: E731
        recorder = MigrationRecorder(connection)
        with transaction.atomic(using=connection.alias):
            state = executor._create_project_state(with_applied_migrations=True)
            for migration, _ in plan:
                if migration.app_label in ours:
                    state = migration.mutate_state(state, preserve=False)
                    if (migration.app_label, migration.name) not in applied:
                        executor.record_migration(migration)
                else:
                    state = executor.apply_migration(state, migration)

            models = [
                m
                for m in state.apps.get_models(include_auto_created=True)
                if m._meta.app_label in ours and m._meta.managed and not m._meta.proxy
            ]
            schema = Schema(connection)
            with connection.schema_editor(atomic=False) as schema_editor:
                build(schema_editor, schema, models, report)
                relax(schema_editor, schema, models, report)

            left = recorder.applied_migrations()
            missing = [k for k in loader.graph.nodes if k not in left]
            if missing:
                raise CommandError(f"adopt: {len(missing)} migrations still unrecorded, e.g. {missing[:5]}")

        for kind, what in built:
            self.stdout.write(f"  {kind:<10} {what}")
        self.stdout.write(
            f"adopt: done; built {len(built)} objects, ledger carries all {len(loader.graph.nodes)} migrations"
        )
