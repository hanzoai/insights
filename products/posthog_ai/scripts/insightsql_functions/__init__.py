from __future__ import annotations


def insightsql_functions() -> list[str]:
    """Return sorted list of all public InsightsQL function names.

    Excludes underscore-prefixed internals, UDFs, and *If combinator variants
    (e.g. countIf, sumIf) where the base function also exists.
    """
    from posthog.insightsql.functions.aggregations import INSIGHTSQL_AGGREGATIONS
    from posthog.insightsql.functions.mapping import INSIGHTSQL_CLICKHOUSE_FUNCTIONS
    from posthog.insightsql.functions.udfs import UDFS

    all_names: set[str] = set()
    for name in INSIGHTSQL_CLICKHOUSE_FUNCTIONS:
        if not name.startswith("_") and name not in UDFS:
            all_names.add(name)
    for name in INSIGHTSQL_AGGREGATIONS:
        if not name.startswith("_"):
            all_names.add(name)

    def _is_if_combinator(name: str) -> bool:
        return name.endswith("If") and name[:-2] in all_names

    return sorted((n for n in all_names if not _is_if_combinator(n)), key=str.lower)
