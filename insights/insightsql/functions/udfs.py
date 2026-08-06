from insights.cloud_utils import is_ci, is_cloud

from .core import InsightsQLFunctionMeta

UDFS: dict[str, InsightsQLFunctionMeta] = {
    # RowBinary path (default since v12).
    "aggregate_funnel": InsightsQLFunctionMeta("aggregate_funnel", 7, 7, aggregate=False),
    "aggregate_funnel_array": InsightsQLFunctionMeta("aggregate_funnel_array", 7, 7, aggregate=False),
    "aggregate_funnel_cohort": InsightsQLFunctionMeta("aggregate_funnel_cohort", 7, 7, aggregate=False),
    "aggregate_funnel_trends": InsightsQLFunctionMeta("aggregate_funnel_trends", 8, 8, aggregate=False),
    "aggregate_funnel_array_trends": InsightsQLFunctionMeta("aggregate_funnel_array_trends", 8, 8, aggregate=False),
    "aggregate_funnel_cohort_trends": InsightsQLFunctionMeta("aggregate_funnel_cohort_trends", 8, 8, aggregate=False),
    # JSONEachRow mirrors, retained for manual benchmark comparison against the RowBinary path.
    "aggregate_funnel_json": InsightsQLFunctionMeta("aggregate_funnel_json", 7, 7, aggregate=False),
    "aggregate_funnel_array_json": InsightsQLFunctionMeta("aggregate_funnel_array_json", 7, 7, aggregate=False),
    "aggregate_funnel_cohort_json": InsightsQLFunctionMeta("aggregate_funnel_cohort_json", 7, 7, aggregate=False),
    "aggregate_funnel_trends_json": InsightsQLFunctionMeta("aggregate_funnel_trends_json", 8, 8, aggregate=False),
    "aggregate_funnel_array_trends_json": InsightsQLFunctionMeta(
        "aggregate_funnel_array_trends_json", 8, 8, aggregate=False
    ),
    "aggregate_funnel_cohort_trends_json": InsightsQLFunctionMeta(
        "aggregate_funnel_cohort_trends_json", 8, 8, aggregate=False
    ),
    # Python-script debug UDFs.
    "aggregate_funnel_test": InsightsQLFunctionMeta("aggregate_funnel_test", 7, 7, aggregate=False),
    "aggregate_funnel_array_trends_test": InsightsQLFunctionMeta(
        "aggregate_funnel_array_trends_test", 8, 8, aggregate=False
    ),
}

# JSONDropKeys is an executable UDF like the funnel UDFs, but it is printer-internal (restricted-property blob
# stripping), not InsightsQL-exposed, so it lives outside UDFS. Its deployed name is versioned the same way.
JSON_DROP_KEYS_DATASTORE_NAME = "JSONDropKeys"

# We want CI to fail if there is a breaking change and the version hasn't been incremented
if is_cloud() or is_ci():
    from insights.udf_versioner import augment_function_name

    for v in UDFS.values():
        v.datastore_name = augment_function_name(v.datastore_name)
    JSON_DROP_KEYS_DATASTORE_NAME = augment_function_name(JSON_DROP_KEYS_DATASTORE_NAME)
