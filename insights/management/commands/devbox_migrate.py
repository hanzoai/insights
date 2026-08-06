from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Run all migrations (Django, persons, Datastore) in a single process"

    def handle(self, *args, **options):
        self.stdout.write("Running Django migrations...")
        call_command("migrate", "--noinput")

        self.stdout.write("Running persons migrations...")
        call_command("apply_persons_migrations", "--ensure-database")

        self.stdout.write("Running Datastore migrations...")
        call_command("migrate_datastore")

        self.stdout.write(self.style.SUCCESS("All migrations complete"))
