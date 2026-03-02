# Print compatibility table
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Print a Hog/InsightsQL STL compatibility table"

    def handle(self, *args, **options):
        from posthog.insightsql.functions.mapping import INSIGHTSQL_CLICKHOUSE_FUNCTIONS, INSIGHTSQL_COMPARISON_MAPPING

        insightsql_functions = set(INSIGHTSQL_COMPARISON_MAPPING.keys()).union(set(INSIGHTSQL_CLICKHOUSE_FUNCTIONS.keys()))

        from common.hogvm.python.stl import STL
        from common.hogvm.python.stl.bytecode import BYTECODE_STL

        custom_functions = set(STL.keys()).union(set(BYTECODE_STL.keys()))

        insightsql_functions = {
            fn
            if fn not in {f.lower() for f in custom_functions}
            else next((f for f in custom_functions if f.lower() == fn), fn)
            for fn in insightsql_functions
        }

        all_functions = sorted(custom_functions.union(insightsql_functions))
        max_length = max(len(fn) for fn in all_functions)

        for fn in all_functions:
            print(  # noqa: T201
                fn.ljust(max_length),
                "InsightsQL" if fn in insightsql_functions else "     ",
                "Hog" if fn in custom_functions else "   ",
            )
