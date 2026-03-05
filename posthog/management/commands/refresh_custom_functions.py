import time

from django.core.management.base import BaseCommand
from django.core.paginator import Paginator

import structlog

from posthog.models.custom_functions.custom_function import CustomFunction

logger = structlog.get_logger(__name__)


class Command(BaseCommand):
    help = "Refresh CustomFunctions (both enabled and disabled) by re-saving them to trigger filter recompilation"

    def add_arguments(self, parser):
        parser.add_argument(
            "--team-id", type=int, help="Team ID to refresh CustomFunctions for (if not provided, processes all teams)"
        )
        parser.add_argument(
            "--custom-function-id",
            type=str,
            help="Specific CustomFunction ID to refresh (if provided, only this function is processed)",
        )

    def handle(self, *args, **options):
        start_time = time.time()
        total_processed = 0
        total_updated = 0
        error_count = 0

        team_id = options.get("team_id")
        custom_function_id = options.get("custom_function_id")
        page_size = 1000

        self.stdout.write("Starting CustomFunction refresh...")

        queryset = CustomFunction.objects.filter(deleted=False, type__in=["destination"]).select_related("team")

        if custom_function_id:
            queryset = queryset.filter(id=custom_function_id)
            self.stdout.write(f"Processing single CustomFunction: {custom_function_id}")
        elif team_id:
            queryset = queryset.filter(team_id=team_id)
            self.stdout.write(f"Processing CustomFunctions for team: {team_id}")
        else:
            self.stdout.write("Processing CustomFunctions for all teams")

        total_count = queryset.count()
        self.stdout.write(f"Found {total_count} CustomFunctions to process (includes both enabled and disabled functions)")

        if total_count == 0:
            self.stdout.write(self.style.WARNING("No CustomFunctions found matching criteria"))
            return

        paginator = Paginator(queryset.order_by("id"), page_size)

        for page_num in paginator.page_range:
            page = paginator.page(page_num)

            self.stdout.write(
                f"Processing page {page_num}/{paginator.num_pages} ({len(page.object_list)} functions)..."
            )

            for custom_function in page.object_list:
                try:
                    total_processed += 1
                    custom_function.save()
                    total_updated += 1
                except Exception as e:
                    error_count += 1
                    logger.error(
                        "Error refreshing CustomFunction",
                        custom_function_id=custom_function.id,
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
