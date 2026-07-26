from insights.test.base import reset_datastore_database

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Resets the Datastore database for the test environment"

    # NOTE: This commands enables `TEST=1` environment variable via a hack
    # in insights/settings/base_variables.py where we pattern match against the command name
    # If you change the command name, you need to update the pattern match.
    def handle(self, *args, **kwargs):
        self.stdout.write("Resetting Datastore database...")
        reset_datastore_database()
        self.stdout.write(self.style.SUCCESS("Successfully reset Datastore database"))
