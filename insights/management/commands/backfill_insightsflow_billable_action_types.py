import time
import logging

from django.core.management.base import BaseCommand
from django.core.paginator import Paginator
from django.db import transaction

from insights.models.insights_flow.insights_flow import BILLABLE_ACTION_TYPES, InsightsFlow

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Backfill billable_action_types field for existing InsightsFlows by extracting billable action types defined in BILLABLE_ACTION_TYPES"

    def add_arguments(self, parser):
        parser.add_argument(
            "--page-size",
            type=int,
            default=500,
            help="Number of InsightsFlows to process per page (default: 500)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run without making any changes to the database",
        )
        parser.add_argument(
            "--team-id",
            type=int,
            help="Team ID to backfill InsightsFlows for (if not provided, processes all teams)",
        )
        parser.add_argument(
            "--insights-flow-id",
            type=str,
            help="Specific InsightsFlow ID to backfill (if provided, only this flow is processed)",
        )

    def handle(self, *args, **options):
        start_time = time.time()
        page_size = options["page_size"]
        dry_run = options["dry_run"]
        team_id = options.get("team_id")
        insights_flow_id = options.get("insights_flow_id")

        if dry_run:
            self.stdout.write(self.style.WARNING("Running in DRY RUN mode - no changes will be made"))

        self.stdout.write("Starting InsightsFlow billable_action_types backfill...")

        # Build queryset - process all InsightsFlows
        queryset = InsightsFlow.objects.all()

        # Apply filters
        if insights_flow_id:
            queryset = queryset.filter(id=insights_flow_id)
            self.stdout.write(f"Processing single InsightsFlow: {insights_flow_id}")
        elif team_id:
            queryset = queryset.filter(team_id=team_id)
            self.stdout.write(f"Processing InsightsFlows for team: {team_id}")
        else:
            self.stdout.write("Processing InsightsFlows for all teams")

        total_count = queryset.count()
        self.stdout.write(f"Found {total_count} InsightsFlows to process")

        if total_count == 0:
            self.stdout.write(self.style.WARNING("No InsightsFlows found matching criteria"))
            return

        paginator = Paginator(queryset.order_by("id"), page_size)
        updated_count = 0
        error_count = 0

        for page_num in paginator.page_range:
            page = paginator.page(page_num)

            self.stdout.write(f"Processing page {page_num}/{paginator.num_pages} ({len(page.object_list)} flows)...")

            flows_to_update = []

            for flow in page.object_list:
                try:
                    if flow.actions:
                        # Extract unique billable action types from the actions list
                        # Using centralized BILLABLE_ACTION_TYPES constant
                        billable_action_types = sorted(
                            {
                                action.get("type", "")
                                for action in flow.actions
                                if isinstance(action, dict) and action.get("type") in BILLABLE_ACTION_TYPES
                            }
                        )
                    else:
                        # Set to empty list if no actions
                        billable_action_types = []

                    # Only update if the computed value differs from the current value (compare as sets since order doesn't matter)
                    if set(flow.billable_action_types or []) != set(billable_action_types):
                        flow.billable_action_types = billable_action_types
                        flows_to_update.append(flow)

                except Exception as e:
                    error_count += 1
                    logger.error(
                        f"Error processing InsightsFlow id={flow.id}, team_id={flow.team_id}: {e}",
                        exc_info=True,
                    )

            # Bulk update for better performance
            if flows_to_update and not dry_run:
                with transaction.atomic():
                    InsightsFlow.objects.bulk_update(flows_to_update, ["billable_action_types"], batch_size=page_size)
                    updated_count += len(flows_to_update)

            elif dry_run:
                updated_count += len(flows_to_update)

            if updated_count > 0 and updated_count % 1000 == 0:
                self.stdout.write(self.style.SUCCESS(f"Progress: {updated_count} InsightsFlows updated..."))

        # Output summary
        duration = time.time() - start_time

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\nDRY RUN completed in {duration:.2f}s.\n"
                    f"Would have updated {updated_count} out of {total_count} InsightsFlows\n"
                    f"Errors: {error_count}"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\nBackfill completed in {duration:.2f}s.\n"
                    f"Processed: {total_count}\n"
                    f"Updated: {updated_count}\n"
                    f"Errors: {error_count}"
                )
            )

        if error_count > 0:
            self.stdout.write(self.style.WARNING(f"Check logs for details on {error_count} errors encountered"))
