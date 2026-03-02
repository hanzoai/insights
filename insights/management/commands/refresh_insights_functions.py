import time

from django.core.management.base import BaseCommand
from django.core.paginator import Paginator

import structlog

from insights.models.insights_functions.insights_function import InsightsFunction

logger = structlog.get_logger(__name__)


class Command(BaseCommand):
    help = "Refresh InsightsFunctions (both enabled and disabled) by re-saving them to trigger filter recompilation"

    def add_arguments(self, parser):
        parser.add_argument(
            "--team-id", type=int, help="Team ID to refresh InsightsFunctions for (if not provided, processes all teams)"
        )
        parser.add_argument(
            "--insights-function-id",
            type=str,
            help="Specific InsightsFunction ID to refresh (if provided, only this function is processed)",
        )

    def handle(self, *args, **options):
        start_time = time.time()
        total_processed = 0
        total_updated = 0
        error_count = 0

        team_id = options.get("team_id")
        insights_function_id = options.get("insights_function_id")
        page_size = 1000

        self.stdout.write("Starting InsightsFunction refresh...")

        queryset = InsightsFunction.objects.filter(deleted=False, type__in=["destination"]).select_related("team")

        if insights_function_id:
            queryset = queryset.filter(id=insights_function_id)
            self.stdout.write(f"Processing single InsightsFunction: {insights_function_id}")
        elif team_id:
            queryset = queryset.filter(team_id=team_id)
            self.stdout.write(f"Processing InsightsFunctions for team: {team_id}")
        else:
            self.stdout.write("Processing InsightsFunctions for all teams")

        total_count = queryset.count()
        self.stdout.write(f"Found {total_count} InsightsFunctions to process (includes both enabled and disabled functions)")

        if total_count == 0:
            self.stdout.write(self.style.WARNING("No InsightsFunctions found matching criteria"))
            return

        paginator = Paginator(queryset.order_by("id"), page_size)

        for page_num in paginator.page_range:
            page = paginator.page(page_num)

            self.stdout.write(
                f"Processing page {page_num}/{paginator.num_pages} ({len(page.object_list)} functions)..."
            )

            for insights_function in page.object_list:
                try:
                    total_processed += 1
                    insights_function.save()
                    total_updated += 1
                except Exception as e:
                    error_count += 1
                    logger.error(
                        "Error refreshing InsightsFunction",
                        insights_function_id=insights_function.id,
                        error=str(e),
                        exc_info=True,
                    )

        # Output summary
        duration = time.time() - start_time
        self.stdout.write(
            self.style.SUCCESS(
                f"Refresh completed in {duration:.2f}s. "
                f"Processed: {total_processed}, "
                f"Updated: {total_updated}, "
                f"Errors: {error_count}"
            )
        )
