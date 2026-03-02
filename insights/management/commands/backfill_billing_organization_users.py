import csv

from django.core.management import BaseCommand

import structlog

from insights.models.organization import Organization, OrganizationMembership


logger = structlog.get_logger(__name__)


class Command(BaseCommand):
    """
    Used to sync organization_users with billing
    """

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str)
        parser.add_argument("--offset", type=int, default=0)

    def handle(self, *args, **options):
        logger.info("Billing backfill is a no-op. EE billing has been removed.")
        return
