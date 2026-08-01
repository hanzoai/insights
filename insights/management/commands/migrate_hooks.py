from django.core.management.base import BaseCommand
from django.core.paginator import Paginator

from insights.plugins.plugin_server_api import reload_all_insights_functions_on_workers
from insights.settings.ee import EE_AVAILABLE

from products.cdp.backend.models.insights_functions.insights_function import InsightsFunction


def migrate_hooks(hook_ids: list[str], team_ids: list[int], dry_run: bool = False):
    if not EE_AVAILABLE:
        print("This command is only available in Insights EE")  # noqa: T201
        return

    from products.cdp.backend.api.hooks import create_zapier_insights_function
    from products.cdp.backend.models.hook import Hook

    if hook_ids and team_ids:
        print("Please provide either hook_ids or team_ids, not both")  # noqa: T201
        return

    query = Hook.objects.select_related("team").order_by("id")

    if team_ids:
        print("Migrating all hooks for teams:", team_ids)  # noqa: T201
        query = query.filter(team_id__in=team_ids)
    elif hook_ids:
        print("Migrating hooks:", hook_ids)  # noqa: T201
        query = query.filter(id__in=hook_ids)
    else:
        print(f"Migrating all hooks")  # noqa T201

    paginator = Paginator(query.all(), 100)

    hook_ids_to_delete = []

    for page_number in paginator.page_range:
        page = paginator.page(page_number)
        insights_functions: list[InsightsFunction] = []

        for hook in page.object_list:
            try:
                insights_function = create_zapier_insights_function(
                    hook,
                    {
                        "user": hook.user,
                        "get_team": lambda hook=hook: hook.team,
                        "is_create": True,
                    },
                    from_migration=True,
                )
                insights_functions.append(insights_function)
            except Exception as e:
                print(f"Error migrating hook {hook.id}: {e}")  # noqa: T201
                continue

        if not dry_run:
            InsightsFunction.objects.bulk_create(insights_functions)
            hook_ids_to_delete.extend([hook.id for hook in page.object_list])
        else:
            print("Would have created the following InsightsFunctions:")  # noqa: T201
            for insights_function in insights_functions:
                print(insights_function)  # noqa: T201

    if not dry_run:
        query.filter(id__in=hook_ids_to_delete).delete()
        reload_all_insights_functions_on_workers()


class Command(BaseCommand):
    help = "Migrate zapier hooks to InsightsFunctions"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            type=bool,
            help="If set, will not actually perform the migration, but will print out what would have been done",
        )
        parser.add_argument("--hook-ids", type=str, help="Comma separated list of hook ids to sync")
        parser.add_argument("--team-ids", type=str, help="Comma separated list of team ids to sync")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        hook_ids = options["hook_ids"]
        team_ids = options["team_ids"]

        if hook_ids and team_ids:
            print("Please provide either hook_ids or team_ids, not both")  # noqa: T201
            return

        migrate_hooks(
            hook_ids=hook_ids.split(",") if hook_ids else [],
            team_ids=[int(x) for x in team_ids.split(",")] if team_ids else [],
            dry_run=dry_run,
        )
