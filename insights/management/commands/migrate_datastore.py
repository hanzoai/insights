# ruff: noqa: T201 allow print statements

import datetime
from textwrap import indent

from django.conf import settings
from django.core.management.base import BaseCommand

from cachetools import cached
from datastore_orm import Database
from datastore_orm.migrations import MigrationHistory
from datastore_orm.utils import import_submodules

from insights.datastore.client.connection import default_client
from insights.settings import DATASTORE_DATABASE, DATASTORE_HTTP_URL, DATASTORE_PASSWORD, DATASTORE_USER
from insights.settings.data_stores import DATASTORE_MIGRATIONS_CLUSTER

MIGRATIONS_PACKAGE_NAME = "insights.datastore.migrations"

# Every package name this migrations module has ever been called. The history
# table keys on package_name, so a rename makes every prior row invisible: the
# runner sees zero applied migrations, replays from 0001, and dies partway (0026
# raises NameError under a modern Python). That is not hypothetical — it is what
# the posthog -> insights rename did, and it silently blocked EVERY datastore
# migration until the rows were re-keyed by hand.
#
# Renaming the package is the normal thing to want to do. Re-keying the ledger
# by hand at 3am is not. So the rename carries its own fixup: adopt() runs before
# any migration and claims prior names, which makes this list the one place a
# future rename has to touch.
LEGACY_PACKAGE_NAMES = ("insights.clickhouse.migrations", "posthog.clickhouse.migrations")


class Command(BaseCommand):
    help = "Migrate Hanzo Datastore"

    def add_arguments(self, parser):
        parser.add_argument(
            "--upto",
            default=99_999,
            type=int,
            help="Database state will be brought to the state after that migration.",
        )
        parser.add_argument(
            "--fake",
            action="store_true",
            help="Mark migrations as run without actually running them.",
        )
        parser.add_argument(
            "--check",
            action="store_true",
            help="Exits with a non-zero status if unapplied migrations exist.",
        )
        parser.add_argument(
            "--plan",
            action="store_true",
            help="Shows a list of the migration actions that will be performed.",
        )
        parser.add_argument(
            "--print-sql",
            action="store_true",
            help="Only use with --plan. Also prints SQL for each migration to be applied.",
        )

    def handle(self, *args, **options):
        self.migrate(DATASTORE_HTTP_URL, options)

    def migrate(self, host, options):
        # Infi only creates the DB in one node, but not the rest. Create it before running migrations.
        self._create_database_if_not_exists(DATASTORE_DATABASE, DATASTORE_MIGRATIONS_CLUSTER)
        database = Database(
            DATASTORE_DATABASE,
            db_url=host,
            username=DATASTORE_USER,
            password=DATASTORE_PASSWORD,
            cluster=DATASTORE_MIGRATIONS_CLUSTER,
            verify_ssl_cert=False,
            randomize_replica_paths=settings.TEST or settings.E2E_TESTING,
        )

        if options["plan"] or options["check"]:
            print("List of datastore migrations to be applied:")
            migrations = list(self.get_migrations(database, options["upto"]))
            for migration_name, operations in migrations:
                print(f"Migration would get applied: {migration_name}")
                for op in operations:
                    sql = getattr(op, "_sql", None)
                    if options["print_sql"] and sql is not None:
                        if isinstance(sql, str):
                            print(indent(sql, "    "))
                        else:
                            print(indent("\n\n".join(sql), "    "))
            applied = self.get_applied_migrations(database)
            if len(applied) > 0:
                last = max(applied)
                print(f"\nDatastore most recent applied migration: {last}")
            if len(migrations) == 0:
                print("Datastore migrations up to date!")
            elif options["check"]:
                exit(1)
        elif options["fake"]:
            for migration_name, _ in self.get_migrations(database, options["upto"]):
                print(f"Faked migration: {migration_name}")
                database.insert(
                    [
                        MigrationHistory(
                            package_name=MIGRATIONS_PACKAGE_NAME,
                            module_name=migration_name,
                            applied=datetime.date.today(),
                        )
                    ]
                )
            print("Migrations done")
        else:
            self.adopt_legacy_history(database)
            database.migrate(MIGRATIONS_PACKAGE_NAME, options["upto"], replicated=True)
            print("✅ Migration successful")

    def adopt_legacy_history(self, database):
        """Re-key history rows written under a previous package name.

        Idempotent and additive: rows already under the current name are left
        alone and the legacy rows stay put, so this is safe to run on every
        invocation and on a fresh database, where it is a no-op.
        """
        legacy = ", ".join(f"'{name}'" for name in LEGACY_PACKAGE_NAMES)
        adopted = database.raw(
            f"""INSERT INTO {DATASTORE_DATABASE}.migrations
                    (package_name, module_name, applied)
                SELECT '{MIGRATIONS_PACKAGE_NAME}', module_name, applied
                FROM {DATASTORE_DATABASE}.migrations
                WHERE package_name IN ({legacy})
                  AND module_name NOT IN (
                    SELECT module_name
                    FROM {DATASTORE_DATABASE}.migrations
                    WHERE package_name = '{MIGRATIONS_PACKAGE_NAME}')"""
        )
        if adopted:
            print(f"Adopted migration history from {legacy}")

    def get_migrations(self, database, upto):
        modules = import_submodules(MIGRATIONS_PACKAGE_NAME)
        applied_migrations = self.get_applied_migrations(database)
        unapplied_migrations = set(modules.keys()) - applied_migrations

        for migration_name in sorted(unapplied_migrations):
            yield migration_name, modules[migration_name].operations

            if int(migration_name[:4]) >= upto:
                break

    @cached(cache={})
    def get_applied_migrations(self, database) -> set[str]:
        return database._get_applied_migrations(MIGRATIONS_PACKAGE_NAME, replicated=True)

    def _create_database_if_not_exists(self, database: str, cluster: str):
        if settings.TEST or settings.E2E_TESTING:
            with default_client() as client:
                client.execute(
                    f"CREATE DATABASE IF NOT EXISTS {database} ON CLUSTER {cluster}",
                )
