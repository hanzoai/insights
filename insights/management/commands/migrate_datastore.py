# ruff: noqa: T201 allow print statements

import datetime
from textwrap import indent

from django.conf import settings
from django.core.management.base import BaseCommand

from cachetools import cached
from infi.datastore_orm import Database
from infi.datastore_orm.migrations import MigrationHistory
from infi.datastore_orm.utils import import_submodules

from insights.datastore.client.connection import default_client
from insights.settings import DATASTORE_DATABASE, DATASTORE_HTTP_URL, DATASTORE_PASSWORD, DATASTORE_USER
from insights.settings.data_stores import DATASTORE_MIGRATIONS_CLUSTER

MIGRATIONS_PACKAGE_NAME = "insights.datastore.migrations"


class Command(BaseCommand):
    help = "Migrate datastore"

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
        self._create_migration_tracking_tables_if_not_exist(DATASTORE_DATABASE, DATASTORE_MIGRATIONS_CLUSTER)
        database = Database(
            DATASTORE_DATABASE,
            db_url=host,
            username=DATASTORE_USER,
            password=DATASTORE_PASSWORD,
            cluster=DATASTORE_MIGRATIONS_CLUSTER,
            verify_ssl_cert=False,
            randomize_replica_paths=settings.TEST or settings.E2E_TESTING,
            # don't use the egress proxy, datastore is internal
            trust_env=False,
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
            database.migrate(MIGRATIONS_PACKAGE_NAME, options["upto"], replicated=True)
            print("✅ Migration successful")

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
        # MULTINODE_DATASTORE: infi.datastore_orm creates the Distributed
        # migration-tracking table across the migrations cluster before the
        # first migration runs, so the database has to exist on every node up
        # front — otherwise the CREATE TABLE fans out to satellites that have
        # no `insights` database yet and fails with UNKNOWN_DATABASE.
        if settings.TEST or settings.E2E_TESTING or settings.MULTINODE_DATASTORE:
            with default_client() as client:
                client.execute(
                    f"CREATE DATABASE IF NOT EXISTS {database} ON CLUSTER {cluster}",
                )

    def _create_migration_tracking_tables_if_not_exist(self, database: str, cluster: str):
        # MULTINODE_DATASTORE only: infi.datastore_orm's auto-create path
        # issues `CREATE TABLE` without `ON CLUSTER`, so the underlying
        # ReplicatedMergeTree only lands on the migrations host. With a real
        # multi-node `insights_migrations` cluster, the Distributed tracking
        # table fans out to every shard and trips UNKNOWN_TABLE on satellites
        # that never received the local replica. Pre-create both tables on
        # the cluster so the very first SELECT in infi's migrate() succeeds
        # and the auto-create branch never runs.
        #
        # Schema (`package_name String, module_name String, applied Date`) and
        # the ZK path mirror `infi.datastore_orm.migrations.MigrationHistory`
        # / `MigrationHistoryReplicated`. If `infi` ever changes those, this
        # pre-create will silently diverge — keep the two in sync.
        if not settings.MULTINODE_DATASTORE:
            return
        with default_client() as client:
            client.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {database}.infi_datastore_orm_migrations
                ON CLUSTER {cluster} (
                    package_name String,
                    module_name String,
                    applied Date
                )
                ENGINE = ReplicatedMergeTree(
                    '/datastore/prod/tables/noshard/{{database}}/{{table}}',
                    '{{replica}}-{{shard}}'
                )
                PARTITION BY toYYYYMM(applied)
                ORDER BY (package_name, module_name)
                SETTINGS index_granularity = 8192
                """
            )
            client.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {database}.infi_datastore_orm_migrations_distributed
                ON CLUSTER {cluster} (
                    package_name String,
                    module_name String,
                    applied Date
                )
                ENGINE = Distributed({cluster}, {database}, infi_datastore_orm_migrations, rand())
                """
            )
