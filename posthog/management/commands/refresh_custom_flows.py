import time

from django.core.management.base import BaseCommand
from django.core.paginator import Paginator
from django.test import RequestFactory

import structlog

from posthog.api.custom_flow import CustomFlowSerializer
from posthog.models.custom_flow.custom_flow import CustomFlow

logger = structlog.get_logger(__name__)


def remove_event_filters_from_conditionals(actions):
    updated_actions = []
    for action in actions:
        conditions = action.get("config", {}).get("conditions", [])
        if conditions:
            for condition in conditions:
                filters = condition.get("filters", {})
                if "events" in filters:
                    del filters["events"]

        updated_actions.append(action)

    return updated_actions


class Command(BaseCommand):
    help = "Refresh CustomFlows (all statuses) by re-saving them to trigger reload on workers"

    def add_arguments(self, parser):
        parser.add_argument(
            "--team-id", type=int, help="Team ID to refresh CustomFlows for (if not provided, processes all teams)"
        )
        parser.add_argument(
            "--hog-flow-id",
            type=str,
            help="Specific CustomFlow ID to refresh (if provided, only this flow is processed)",
        )
        parser.add_argument(
            "--page-size",
            type=int,
            default=1000,
            help="Number of flows to process per page (default: 1000)",
        )

    def handle(self, *args, **options):
        start_time = time.time()
        total_processed = 0
        total_updated = 0
        error_count = 0

        team_id = options.get("team_id")
        custom_flow_id = options.get("custom_flow_id")
        page_size = options.get("page_size", 1000)

        self.stdout.write("Starting CustomFlow refresh...")

        queryset = CustomFlow.objects.select_related("team")

        if custom_flow_id:
            queryset = queryset.filter(id=custom_flow_id)
            self.stdout.write(f"Processing single CustomFlow: {custom_flow_id}")
        elif team_id:
            queryset = queryset.filter(team_id=team_id)
            self.stdout.write(f"Processing CustomFlows for team: {team_id}")
        else:
            self.stdout.write("Processing CustomFlows for all teams")

        total_count = queryset.count()
        self.stdout.write(f"Found {total_count} CustomFlows to process")

        if total_count == 0:
            self.stdout.write(self.style.WARNING("No CustomFlows found matching criteria"))
            return

        paginator = Paginator(queryset.order_by("id"), page_size)

        for page_num in paginator.page_range:
            page = paginator.page(page_num)

            self.stdout.write(f"Processing page {page_num}/{paginator.num_pages} ({len(page.object_list)} flows)...")

            for custom_flow in page.object_list:
                try:
                    total_processed += 1

                    # Create a mock request context for the serializer
                    request = RequestFactory().post("/")
                    if custom_flow.created_by:
                        request.user = custom_flow.created_by

                    def get_team_func(flow=custom_flow):
                        return flow.team

                    serializer_context = {
                        "request": request,
                        "team_id": custom_flow.team_id,
                        "get_team": get_team_func,
                    }

                    # Get the current data from the CustomFlow
                    data = {
                        "name": custom_flow.name,
                        "description": custom_flow.description,
                        "status": custom_flow.status,
                        "trigger": custom_flow.trigger,
                        "trigger_masking": custom_flow.trigger_masking,
                        "conversion": custom_flow.conversion,
                        "exit_condition": custom_flow.exit_condition,
                        "edges": custom_flow.edges,
                        "actions": custom_flow.actions,
                        "variables": custom_flow.variables,
                    }

                    data["actions"] = remove_event_filters_from_conditionals(custom_flow.actions)

                    # Process through serializer to regenerate bytecode
                    serializer = CustomFlowSerializer(
                        instance=custom_flow, data=data, context=serializer_context, partial=True
                    )

                    if serializer.is_valid():
                        serializer.save()
                        total_updated += 1
                        logger.info(
                            "Successfully refreshed CustomFlow",
                            custom_flow_id=str(custom_flow.id),
                            team_id=custom_flow.team_id,
                            status=custom_flow.status,
                            name=custom_flow.name,
                            version=custom_flow.version,
                        )
                    else:
                        raise Exception(f"Serializer validation failed: {serializer.errors}")

                except Exception as e:
                    error_count += 1
                    logger.error(
                        "Error refreshing CustomFlow",
                        custom_flow_id=str(custom_flow.id),
                        team_id=custom_flow.team_id,
                        status=custom_flow.status,
                        name=custom_flow.name,
                        error=str(e),
                        exc_info=True,
                    )
                    self.stdout.write(self.style.ERROR(f"Error processing flow {custom_flow.id}: {str(e)}"))

        # Output summary
        duration = time.time() - start_time
        self.stdout.write(
            self.style.SUCCESS(
                f"\nRefresh completed in {duration:.2f}s.\n"
                f"Processed: {total_processed}\n"
                f"Updated: {total_updated}\n"
                f"Errors: {error_count}"
            )
        )

        if error_count > 0:
            self.stdout.write(self.style.WARNING(f"Check logs for details on {error_count} errors encountered"))
