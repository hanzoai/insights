from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Migrate zapier hooks to InsightsFunctions (no-op, EE removed)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            type=bool,
            help="If set, will not actually perform the migration",
        )
        parser.add_argument("--hook-ids", type=str, help="Comma separated list of hook ids to sync")
        parser.add_argument("--team-ids", type=str, help="Comma separated list of team ids to sync")

    def handle(self, *args, **options):
        self.stdout.write("This command is a no-op. EE hooks migration has been removed.")
