"""Does the database actually have what the models declare?

`migrate --check` answers a different question than the one that matters. It compares the
migration ledger to the migration tree, so it passes whenever every migration is *recorded*
as applied -- including migrations whose rows were faked past a failure. Production carried
eleven model tables that did not exist while `migrate` reported nothing to do, `migrate
--check` exited 0, and `showmigrations` listed every one as applied. All three read
`django_migrations`; none of them read the schema.

This reads the schema.
"""

from django.apps import apps
from django.core.management.base import BaseCommand, CommandError
from django.db import connection


def drift() -> tuple[list[str], list[tuple[str, str]]]:
    """Tables the models declare and the database lacks, and columns likewise.

    Only managed models: an unmanaged model names a table Django never promises to create,
    so its absence is a deployment fact rather than a defect.
    """
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'"
        )
        present: dict[str, set[str]] = {}
        for table, column in cursor.fetchall():
            present.setdefault(table, set()).add(column)

    absent_tables: list[str] = []
    absent_columns: list[tuple[str, str]] = []
    for model in apps.get_models():
        if not model._meta.managed:
            continue
        table = model._meta.db_table
        if table not in present:
            absent_tables.append(table)
            continue
        for field in model._meta.concrete_fields:
            if field.column not in present[table]:
                absent_columns.append((table, field.column))
    return sorted(set(absent_tables)), sorted(set(absent_columns))


class Command(BaseCommand):
    help = "Compare the models against the database's own schema, and fail if the database is missing anything."

    def handle(self, *args: object, **options: object) -> None:
        absent_tables, absent_columns = drift()
        if not absent_tables and not absent_columns:
            self.stdout.write("schema matches the models: no absent tables, no absent columns")
            return

        for table in absent_tables:
            self.stdout.write(f"absent table   {table}")
        for table, column in absent_columns:
            self.stdout.write(f"absent column  {table}.{column}")
        raise CommandError(
            f"{len(absent_tables)} absent table(s) and {len(absent_columns)} absent column(s). "
            "A migration recorded as applied cannot run again, so repair these with the "
            "adopting operations in insights/migration_helpers/absent.py."
        )
