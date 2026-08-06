import os
import sys
import subprocess

# The InsightsQL parser and AST layer must import and run without django.setup() — no Django ORM
# or app-model coupling. That is what lets these modules (and the corpus/fuzzing scripts built
# on them) run standalone in workers, CLIs, and tooling without paying the Django startup tax.
# If someone adds a `from insights.models import ...` (or any ORM import) into one of these,
# importing it in a fresh interpreter raises AppRegistryNotReady and this test fails.
DJANGO_FREE_MODULES = [
    "insights.uuidt",
    "insights.exchange_rate_constants",
    "insights.raw_sessions_v3_ad_ids",
    "insights.datastore.events_json",
    "insights.property_columns",
    "insights.week_start_day",
    "products.event_definitions.backend.property_type",
    "insights.insightsql.ast",
    "insights.insightsql.base",
    "insights.insightsql.visitor",
    "insights.insightsql.errors",
    "insights.insightsql.timings",
    "insights.insightsql.placeholders",
    "insights.insightsql.escape_sql",
    "insights.insightsql.functions.mapping",
    "insights.insightsql.database.models",
    "insights.insightsql.parser",
    # database.database transitively imports every schema table module, so importing it here
    # guards the whole schema layer; the resolver is the headline Seam 0 win (parse -> resolve
    # -> AST with no django.setup()).
    "insights.insightsql.database.database",
    "insights.insightsql.resolver",
    "insights.insightsql.property_metadata",
    "insights.datastore.materialized_column_types",
    "insights.insightsql.property_planner",
    "insights.insightsql.transforms.property_types",
    "insights.insightsql.transforms.lazy_tables",
    "insights.insightsql.transforms.in_cohort",
    # datastore_property_resolution before printer, deliberately in the cold-start order that used
    # to deadlock: cpr pulls in printer.base/printer.datastore (triggering the package init), and
    # printer/utils defers its cpr import to the call site precisely so this standalone import works.
    # The printer package init imports every dialect printer plus utils, so that one import then
    # guards the whole printer layer.
    "insights.insightsql.transforms.datastore_property_resolution",
    "insights.insightsql.printer",
]

_CHILD = f"""
import importlib
for mod in {DJANGO_FREE_MODULES!r}:
    importlib.import_module(mod)
from insights.insightsql import ast
from insights.insightsql.parser import parse_expr, parse_select
from insights.insightsql.database.database import Database
assert isinstance(parse_select("select 1"), ast.SelectQuery)
assert isinstance(parse_expr("1 + 1"), ast.Expr)
# The static table catalog builds without Django — no team, no ORM.
assert Database(include_insights_tables=True).has_table("events")

# End-to-end compile: parse -> resolve -> prepare -> print to Datastore SQL, with every
# Django-side load either pre-seeded on the context or stubbed at its declared boundary.
# Anything on the compile path that reaches the ORM outside those boundaries crashes here.
from unittest.mock import patch
from insights.insightsql.context import InsightsQLContext
from insights.insightsql.printer import prepare_and_print_ast
from insights.insightsql.property_metadata import PropertyMetadata

context = InsightsQLContext(team_id=1, enable_select_queries=True)
context.database = Database(include_insights_tables=True)  # else Database.create_for hits the ORM
context.restricted_properties = set()  # else the access-control load hits the ORM
context.use_new_events_schema = False  # else the lazy instance-setting read hits the ORM
context.apply_events_retention_floor = False  # backend opt-out; else the retention load hits the ORM
# The unaliased count() exercises the resolver's lazy printer import for implicit-alias derivation.
node = parse_select("select count() from events where properties.$browser = 'Chrome'")
with patch(
    "insights.insightsql.transforms.property_types.load_property_metadata", return_value=PropertyMetadata()
):
    sql, _ = prepare_and_print_ast(node, context, "datastore")
assert sql and "FROM events" in sql, sql
assert "count()" in sql, sql
assert any(v == "Chrome" for v in context.values.values()), context.values
print("DJANGO_FREE_OK")
"""


def test_insightsql_parser_and_ast_import_without_django() -> None:
    # Fresh interpreter, no django.setup(), and DJANGO_SETTINGS_MODULE stripped so we also
    # exercise the parser's settings-free fallback. Any Django-app/ORM import surfaces as
    # AppRegistryNotReady in the child.
    env = {k: v for k, v in os.environ.items() if k != "DJANGO_SETTINGS_MODULE"}
    proc = subprocess.run(
        [sys.executable, "-c", _CHILD],
        env=env,
        capture_output=True,
        text=True,
        timeout=120,
    )
    assert proc.returncode == 0 and "DJANGO_FREE_OK" in proc.stdout, (
        "InsightsQL parser/AST layer no longer imports without django.setup().\n"
        f"stdout:\n{proc.stdout}\nstderr:\n{proc.stderr}"
    )
    assert "AppRegistryNotReady" not in proc.stderr, proc.stderr
