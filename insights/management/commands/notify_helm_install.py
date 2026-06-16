# ruff: noqa: T201 allow print statements
# ruff: noqa: T203 allow pprint statements

import os
from pprint import pprint

from django.conf import settings
from django.core.management.base import BaseCommand

import hanzo_insights

from insights.utils import get_helm_info_env, get_machine_id


class Command(BaseCommand):
    help = "Notify that helm install/upgrade has happened"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", type=bool, help="Print information instead of sending it")

    def handle(self, *args, **options):
        report = get_helm_info_env()
        report["deployment"] = os.getenv("DEPLOYMENT", "unknown")

        print(f"Report for {get_machine_id()}:")
        pprint(report)

        if not options["dry_run"]:
            hanzo_insights.api_key = "sTMFPsFhdP1Ssg"
            disabled = hanzo_insights.disabled
            hanzo_insights.disabled = False
            hanzo_insights.capture(
                distinct_id=get_machine_id(),
                event="helm_install",
                properties=report,
                groups={"instance": settings.SITE_URL},
            )
            hanzo_insights.disabled = disabled
