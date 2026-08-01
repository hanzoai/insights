# Print compatibility table
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Print a Script/InsightsQL STL compatibility table"

    def handle(self, *args, **options):
        from insights.insightsql.functions.mapping import INSIGHTSQL_DATASTORE_FUNCTIONS, INSIGHTSQL_COMPARISON_MAPPING

        insightsql_functions = set(INSIGHTSQL_COMPARISON_MAPPING.keys()).union(set(INSIGHTSQL_DATASTORE_FUNCTIONS.keys()))

        from common.scriptvm.python.stl import STL
        from common.scriptvm.python.stl.bytecode import BYTECODE_STL

        insights_functions = set(STL.keys()).union(set(BYTECODE_STL.keys()))

        insightsql_functions = {
            fn
            if fn not in {f.lower() for f in insights_functions}
            else next((f for f in insights_functions if f.lower() == fn), fn)
            for fn in insightsql_functions
        }

        all_functions = sorted(insights_functions.union(insightsql_functions))
        max_length = max(len(fn) for fn in all_functions)

        for fn in all_functions:
            print(  # noqa: T201
                fn.ljust(max_length),
                "InsightsQL" if fn in insightsql_functions else "     ",
                "Script" if fn in insights_functions else "   ",
            )
