from collections.abc import Callable

from posthog.insightsql.ast import ArrayType, BooleanType, StringType
from posthog.insightsql.base import UnknownType

from .core import InsightsQLFunctionMeta

COMBINATORS = {
    "If": {"allowedSuffixes": [], "argMap": lambda min, max: [min + 1, max + 1]},
    "Array": {"allowedSuffixes": ["If", "OrDefault", "OrNull"], "argMap": lambda min, max: [min, max]},
    "Map": {"allowedSuffixes": ["If", "OrDefault", "OrNull"], "argMap": lambda min, max: [min, max]},
    "State": {"allowedSuffixes": ["If", "OrDefault", "OrNull"], "argMap": lambda min, max: [min, max]},
    "Merge": {"allowedSuffixes": ["If", "OrDefault", "OrNull"], "argMap": lambda min, max: [min, max]},
    "ForEach": {"allowedSuffixes": ["If", "OrDefault", "OrNull"], "argMap": lambda min, max: [min, max]},
    "OrDefault": {"allowedSuffixes": ["If"], "argMap": lambda min, max: [min, max]},
    "OrNull": {"allowedSuffixes": ["If"], "argMap": lambda min, max: [min, max]},
    "ArgMin": {"allowedSuffixes": ["If", "OrDefault", "OrNull"], "argMap": lambda min, max: [min + 1, max + 1]},
    "ArgMax": {"allowedSuffixes": ["If", "OrDefault", "OrNull"], "argMap": lambda min, max: [min + 1, max + 1]},
}

COMBINATOR_AGGREGATIONS = {
    "avg": InsightsQLFunctionMeta("avg", 1, 1, aggregate=True),
    "sum": InsightsQLFunctionMeta("sum", 1, 1, aggregate=True),
    "min": InsightsQLFunctionMeta("min", 1, 1, aggregate=True),
    "max": InsightsQLFunctionMeta("max", 1, 1, aggregate=True),
    "count": InsightsQLFunctionMeta("count", 0, 1, aggregate=True),
    "countDistinct": InsightsQLFunctionMeta("countDistinct", 1, 1, aggregate=True),
    "median": InsightsQLFunctionMeta("median", 1, 1, aggregate=True),
}


def _generate_suffix_combinations(
    base_name: str, base_meta: InsightsQLFunctionMeta, current_suffixes: list[str] | None = None
):
    result = {}

    if current_suffixes is None:
        current_suffixes = []

    if current_suffixes:
        func_name = base_name + "".join(current_suffixes)
        # Calculate new parameter ranges based on suffix rules
        min_params, max_params = base_meta.min_args, base_meta.max_args
        for suffix in current_suffixes:
            if suffix in COMBINATORS:
                arg_map: Callable[[int, int | None], list[int]] = COMBINATORS[suffix]["argMap"]  # type: ignore
                min_params, max_params = arg_map(min_params, max_params)

        result[func_name] = InsightsQLFunctionMeta(func_name, min_params, max_params, aggregate=True)

    if not current_suffixes:
        available_suffixes = list(COMBINATORS.keys())
    else:
        last_suffix = current_suffixes[-1]
        allowed_suffixes: list[str] = COMBINATORS.get(last_suffix, {}).get("allowedSuffixes", [])  # type: ignore
        available_suffixes = allowed_suffixes

    for suffix in available_suffixes:
        if suffix not in current_suffixes:
            nested_result = _generate_suffix_combinations(base_name, base_meta, [*current_suffixes, suffix])
            result.update(nested_result)

    return result


def generate_combinator_suffix_combinations():
    result = {}

    for base_name, base_meta in COMBINATOR_AGGREGATIONS.items():
        combinations = _generate_suffix_combinations(base_name, base_meta)
        result.update(combinations)

    return result


# Permitted InsightsQL aggregations
# Keep in sync with the posthog.com repository: contents/docs/sql/aggregations.mdx
INSIGHTSQL_AGGREGATIONS: dict[str, InsightsQLFunctionMeta] = {
    # Generated combinator functions
    **generate_combinator_suffix_combinations(),
    # Standard aggregate functions
    "count": InsightsQLFunctionMeta("count", 0, 1, aggregate=True, case_sensitive=False),
    "countIf": InsightsQLFunctionMeta("countIf", 1, 2, aggregate=True),
    "countState": InsightsQLFunctionMeta("countState", 0, 1, aggregate=True),
    "countMerge": InsightsQLFunctionMeta("countMerge", 1, 1, aggregate=True),
    "countStateIf": InsightsQLFunctionMeta("countStateIf", 1, 2, aggregate=True),
    "countDistinctIf": InsightsQLFunctionMeta("countDistinctIf", 1, 2, aggregate=True),
    "countMapIf": InsightsQLFunctionMeta("countMapIf", 2, 3, aggregate=True),
    "min": InsightsQLFunctionMeta("min", 1, 1, aggregate=True, case_sensitive=False),
    "minIf": InsightsQLFunctionMeta("minIf", 2, 2, aggregate=True),
    "max": InsightsQLFunctionMeta("max", 1, 1, aggregate=True, case_sensitive=False),
    "maxIf": InsightsQLFunctionMeta("maxIf", 2, 2, aggregate=True),
    "sum": InsightsQLFunctionMeta("sum", 1, 1, aggregate=True, case_sensitive=False),
    "sumForEach": InsightsQLFunctionMeta("sumForEach", 1, 1, aggregate=True),
    "minForEach": InsightsQLFunctionMeta("minForEach", 1, 1, aggregate=True),
    "sumIf": InsightsQLFunctionMeta("sumIf", 2, 2, aggregate=True),
    "avg": InsightsQLFunctionMeta("avg", 1, 1, aggregate=True, case_sensitive=False),
    "avgIf": InsightsQLFunctionMeta("avgIf", 2, 2, aggregate=True),
    "avgMap": InsightsQLFunctionMeta("avgMap", 1, 1, aggregate=True),
    "avgMapIf": InsightsQLFunctionMeta("avgMapIf", 2, 3, aggregate=True),
    "avgMapState": InsightsQLFunctionMeta("avgMapState", 2, 3, aggregate=True),
    "avgMapMerge": InsightsQLFunctionMeta("avgMapMerge", 1, 1, aggregate=True),
    "avgMapMergeIf": InsightsQLFunctionMeta("avgMapMergeIf", 2, 2, aggregate=True),
    "any": InsightsQLFunctionMeta("any", 1, 1, aggregate=True),
    "anyIf": InsightsQLFunctionMeta("anyIf", 2, 2, aggregate=True),
    "stddevPop": InsightsQLFunctionMeta("stddevPop", 1, 1, aggregate=True),
    "stddevPopIf": InsightsQLFunctionMeta("stddevPopIf", 2, 2, aggregate=True),
    "stddevSamp": InsightsQLFunctionMeta("stddevSamp", 1, 1, aggregate=True),
    "stddevSampIf": InsightsQLFunctionMeta("stddevSampIf", 2, 2, aggregate=True),
    "varPop": InsightsQLFunctionMeta("varPop", 1, 1, aggregate=True),
    "varPopIf": InsightsQLFunctionMeta("varPopIf", 2, 2, aggregate=True),
    "varSamp": InsightsQLFunctionMeta("varSamp", 1, 1, aggregate=True),
    "varSampIf": InsightsQLFunctionMeta("varSampIf", 2, 2, aggregate=True),
    "covarPop": InsightsQLFunctionMeta("covarPop", 2, 2, aggregate=True),
    "covarPopIf": InsightsQLFunctionMeta("covarPopIf", 3, 3, aggregate=True),
    "covarSamp": InsightsQLFunctionMeta("covarSamp", 2, 2, aggregate=True),
    "covarSampIf": InsightsQLFunctionMeta("covarSampIf", 3, 3, aggregate=True),
    "corr": InsightsQLFunctionMeta("corr", 2, 2, aggregate=True),
    # PostgreSQL-style aggregate functions
    **{
        name: InsightsQLFunctionMeta(
            "groupArray",
            1,
            1,
            aggregate=True,
            signatures=[((UnknownType(),), ArrayType(item_type=UnknownType()))],
        )
        for name in ["array_agg", "groupArray"]
    },
    "json_agg": InsightsQLFunctionMeta(
        "toJSONString(groupArray({}))",
        1,
        1,
        aggregate=True,
        signatures=[((UnknownType(),), StringType())],
        using_placeholder_arguments=True,
    ),
    "string_agg": InsightsQLFunctionMeta(
        "arrayStringConcat(groupArray({}), {})",
        2,
        2,
        aggregate=True,
        signatures=[((StringType(), StringType()), StringType())],
        using_placeholder_arguments=True,
    ),
    "every": InsightsQLFunctionMeta(
        "toBool(min({}))",
        1,
        1,
        aggregate=True,
        signatures=[((UnknownType(),), BooleanType())],
        using_placeholder_arguments=True,
    ),
    # ClickHouse-specific aggregate functions
    "anyHeavy": InsightsQLFunctionMeta("anyHeavy", 1, 1, aggregate=True),
    "anyHeavyIf": InsightsQLFunctionMeta("anyHeavyIf", 2, 2, aggregate=True),
    "anyLast": InsightsQLFunctionMeta("anyLast", 1, 1, aggregate=True),
    "anyLastIf": InsightsQLFunctionMeta("anyLastIf", 2, 2, aggregate=True),
    "argMin": InsightsQLFunctionMeta("argMin", 2, 2, aggregate=True),
    "argMinIf": InsightsQLFunctionMeta("argMinIf", 3, 3, aggregate=True),
    "argMax": InsightsQLFunctionMeta("argMax", 2, 2, aggregate=True),
    "argMaxIf": InsightsQLFunctionMeta("argMaxIf", 3, 3, aggregate=True),
    "argMinMerge": InsightsQLFunctionMeta("argMinMerge", 1, 1, aggregate=True),
    "argMaxMerge": InsightsQLFunctionMeta("argMaxMerge", 1, 1, aggregate=True),
    "avgState": InsightsQLFunctionMeta("avgState", 1, 1, aggregate=True),
    "avgStateIf": InsightsQLFunctionMeta("avgStateIf", 2, 2, aggregate=True),
    "avgMerge": InsightsQLFunctionMeta("avgMerge", 1, 1, aggregate=True),
    "avgMergeIf": InsightsQLFunctionMeta("avgMergeIf", 2, 2, aggregate=True),
    "avgWeighted": InsightsQLFunctionMeta("avgWeighted", 2, 2, aggregate=True),
    "avgWeightedIf": InsightsQLFunctionMeta("avgWeightedIf", 3, 3, aggregate=True),
    "avgArray": InsightsQLFunctionMeta("avgArrayOrNull", 1, 1, aggregate=True),
    "topK": InsightsQLFunctionMeta("topK", 1, 1, min_params=1, max_params=1, aggregate=True),
    # "topKIf": InsightsQLFunctionMeta("topKIf", 2, 2, aggregate=True),
    # "topKWeighted": InsightsQLFunctionMeta("topKWeighted", 1, 1, aggregate=True),
    # "topKWeightedIf": InsightsQLFunctionMeta("topKWeightedIf", 2, 2, aggregate=True),
    "groupArrayIf": InsightsQLFunctionMeta("groupArrayIf", 2, 2, aggregate=True),
    # "groupArrayLast": InsightsQLFunctionMeta("groupArrayLast", 1, 1, aggregate=True),
    # "groupArrayLastIf": InsightsQLFunctionMeta("groupArrayLastIf", 2, 2, aggregate=True),
    "groupUniqArray": InsightsQLFunctionMeta("groupUniqArray", 1, 1, aggregate=True),
    "groupUniqArrayIf": InsightsQLFunctionMeta("groupUniqArrayIf", 2, 2, aggregate=True),
    "groupArrayInsertAt": InsightsQLFunctionMeta("groupArrayInsertAt", 2, 2, aggregate=True),
    "groupArrayInsertAtIf": InsightsQLFunctionMeta("groupArrayInsertAtIf", 3, 3, aggregate=True),
    "groupArrayMovingAvg": InsightsQLFunctionMeta("groupArrayMovingAvg", 1, 1, aggregate=True),
    "groupArrayMovingAvgIf": InsightsQLFunctionMeta("groupArrayMovingAvgIf", 2, 2, aggregate=True),
    "groupArrayMovingSum": InsightsQLFunctionMeta("groupArrayMovingSum", 1, 1, aggregate=True),
    "groupArrayMovingSumIf": InsightsQLFunctionMeta("groupArrayMovingSumIf", 2, 2, aggregate=True),
    "groupArraySample": InsightsQLFunctionMeta(
        "groupArraySample",
        1,
        1,
        min_params=1,
        max_params=2,
        aggregate=True,
        signatures=[((UnknownType(),), ArrayType(item_type=UnknownType()))],
    ),
    "groupArraySampleIf": InsightsQLFunctionMeta(
        "groupArraySampleIf",
        2,
        2,
        min_params=1,
        max_params=2,
        aggregate=True,
        signatures=[((UnknownType(), BooleanType()), ArrayType(item_type=UnknownType()))],
    ),
    "groupBitAnd": InsightsQLFunctionMeta("groupBitAnd", 1, 1, aggregate=True),
    "groupBitAndIf": InsightsQLFunctionMeta("groupBitAndIf", 2, 2, aggregate=True),
    "groupBitOr": InsightsQLFunctionMeta("groupBitOr", 1, 1, aggregate=True),
    "groupBitOrIf": InsightsQLFunctionMeta("groupBitOrIf", 2, 2, aggregate=True),
    "groupBitXor": InsightsQLFunctionMeta("groupBitXor", 1, 1, aggregate=True),
    "groupBitXorIf": InsightsQLFunctionMeta("groupBitXorIf", 2, 2, aggregate=True),
    "groupBitmap": InsightsQLFunctionMeta("groupBitmap", 1, 1, aggregate=True),
    "groupBitmapIf": InsightsQLFunctionMeta("groupBitmapIf", 2, 2, aggregate=True),
    "groupBitmapState": InsightsQLFunctionMeta("groupBitmapState", 1, 1, aggregate=True),
    "groupBitmapAnd": InsightsQLFunctionMeta("groupBitmapAnd", 1, 1, aggregate=True),
    "groupBitmapAndIf": InsightsQLFunctionMeta("groupBitmapAndIf", 2, 2, aggregate=True),
    "groupBitmapAndState": InsightsQLFunctionMeta("groupBitmapAndState", 1, 1, aggregate=True),
    "groupBitmapOr": InsightsQLFunctionMeta("groupBitmapOr", 1, 1, aggregate=True),
    "groupBitmapOrIf": InsightsQLFunctionMeta("groupBitmapOrIf", 2, 2, aggregate=True),
    "groupBitmapOrState": InsightsQLFunctionMeta("groupBitmapOrState", 1, 1, aggregate=True),
    "groupBitmapXor": InsightsQLFunctionMeta("groupBitmapXor", 1, 1, aggregate=True),
    "groupBitmapXorIf": InsightsQLFunctionMeta("groupBitmapXorIf", 2, 2, aggregate=True),
    "sumWithOverflow": InsightsQLFunctionMeta("sumWithOverflow", 1, 1, aggregate=True),
    "sumWithOverflowIf": InsightsQLFunctionMeta("sumWithOverflowIf", 2, 2, aggregate=True),
    "deltaSum": InsightsQLFunctionMeta("deltaSum", 1, 1, aggregate=True),
    "deltaSumIf": InsightsQLFunctionMeta("deltaSumIf", 2, 2, aggregate=True),
    "deltaSumTimestamp": InsightsQLFunctionMeta("deltaSumTimestamp", 2, 2, aggregate=True),
    "deltaSumTimestampIf": InsightsQLFunctionMeta("deltaSumTimestampIf", 3, 3, aggregate=True),
    "sumMap": InsightsQLFunctionMeta("sumMap", 1, 2, aggregate=True),
    "sumMapIf": InsightsQLFunctionMeta("sumMapIf", 2, 3, aggregate=True),
    "sumMapMerge": InsightsQLFunctionMeta("sumMapMerge", 1, 1, aggregate=True),
    "sumMapMergeIf": InsightsQLFunctionMeta("sumMapMergeIf", 2, 2, aggregate=True),
    "minMap": InsightsQLFunctionMeta("minMap", 1, 2, aggregate=True),
    "minMapIf": InsightsQLFunctionMeta("minMapIf", 2, 3, aggregate=True),
    "maxMap": InsightsQLFunctionMeta("maxMap", 1, 2, aggregate=True),
    "maxMapIf": InsightsQLFunctionMeta("maxMapIf", 2, 3, aggregate=True),
    "sumMerge": InsightsQLFunctionMeta("sumMerge", 1, 1, aggregate=True),
    "sumMergeIf": InsightsQLFunctionMeta("sumMergeIf", 2, 2, aggregate=True),
    "sumState": InsightsQLFunctionMeta("sumState", 1, 1, aggregate=True),
    "sumStateIf": InsightsQLFunctionMeta("sumStateIf", 2, 2, aggregate=True),
    "medianArray": InsightsQLFunctionMeta("medianArrayOrNull", 1, 1, aggregate=True),
    "skewSamp": InsightsQLFunctionMeta("skewSamp", 1, 1, aggregate=True),
    "skewSampIf": InsightsQLFunctionMeta("skewSampIf", 2, 2, aggregate=True),
    "skewPop": InsightsQLFunctionMeta("skewPop", 1, 1, aggregate=True),
    "skewPopIf": InsightsQLFunctionMeta("skewPopIf", 2, 2, aggregate=True),
    "kurtSamp": InsightsQLFunctionMeta("kurtSamp", 1, 1, aggregate=True),
    "kurtSampIf": InsightsQLFunctionMeta("kurtSampIf", 2, 2, aggregate=True),
    "kurtPop": InsightsQLFunctionMeta("kurtPop", 1, 1, aggregate=True),
    "kurtPopIf": InsightsQLFunctionMeta("kurtPopIf", 2, 2, aggregate=True),
    "uniq": InsightsQLFunctionMeta("uniq", 1, None, aggregate=True),
    "uniqIf": InsightsQLFunctionMeta("uniqIf", 2, None, aggregate=True),
    "uniqExact": InsightsQLFunctionMeta("uniqExact", 1, None, aggregate=True),
    "uniqExactState": InsightsQLFunctionMeta("uniqExactState", 1, None, aggregate=True),
    "uniqExactMerge": InsightsQLFunctionMeta("uniqExactMerge", 1, None, aggregate=True),
    "uniqExactIf": InsightsQLFunctionMeta("uniqExactIf", 2, None, aggregate=True),
    # "uniqCombined": InsightsQLFunctionMeta("uniqCombined", 1, 1, aggregate=True),
    # "uniqCombinedIf": InsightsQLFunctionMeta("uniqCombinedIf", 2, 2, aggregate=True),
    # "uniqCombined64": InsightsQLFunctionMeta("uniqCombined64", 1, 1, aggregate=True),
    # "uniqCombined64If": InsightsQLFunctionMeta("uniqCombined64If", 2, 2, aggregate=True),
    "uniqHLL12": InsightsQLFunctionMeta("uniqHLL12", 1, None, aggregate=True),
    "uniqHLL12If": InsightsQLFunctionMeta("uniqHLL12If", 2, None, aggregate=True),
    "uniqTheta": InsightsQLFunctionMeta("uniqTheta", 1, None, aggregate=True),
    "uniqThetaIf": InsightsQLFunctionMeta("uniqThetaIf", 2, None, aggregate=True),
    "uniqMerge": InsightsQLFunctionMeta("uniqMerge", 1, 1, aggregate=True),
    "uniqMergeIf": InsightsQLFunctionMeta("uniqMergeIf", 2, 2, aggregate=True),
    "uniqMap": InsightsQLFunctionMeta("uniqMap", 1, 1, aggregate=True),
    "uniqMapMerge": InsightsQLFunctionMeta("uniqMapMerge", 1, 1, aggregate=True),
    "uniqMapMergeIf": InsightsQLFunctionMeta("uniqMapMergeIf", 2, 2, aggregate=True),
    "uniqState": InsightsQLFunctionMeta("uniqState", 1, 1, aggregate=True),
    "uniqStateIf": InsightsQLFunctionMeta("uniqStateIf", 2, 2, aggregate=True),
    "uniqUpToMerge": InsightsQLFunctionMeta("uniqUpToMerge", 1, 1, 1, 1, aggregate=True),
    "median": InsightsQLFunctionMeta("median", 1, 1, aggregate=True),
    "medianIf": InsightsQLFunctionMeta("medianIf", 2, 2, aggregate=True),
    "medianExact": InsightsQLFunctionMeta("medianExact", 1, 1, aggregate=True),
    "medianExactIf": InsightsQLFunctionMeta("medianExactIf", 2, 2, aggregate=True),
    "medianExactLow": InsightsQLFunctionMeta("medianExactLow", 1, 1, aggregate=True),
    "medianExactLowIf": InsightsQLFunctionMeta("medianExactLowIf", 2, 2, aggregate=True),
    "medianExactHigh": InsightsQLFunctionMeta("medianExactHigh", 1, 1, aggregate=True),
    "medianExactHighIf": InsightsQLFunctionMeta("medianExactHighIf", 2, 2, aggregate=True),
    "medianExactWeighted": InsightsQLFunctionMeta("medianExactWeighted", 1, 1, aggregate=True),
    "medianExactWeightedIf": InsightsQLFunctionMeta("medianExactWeightedIf", 2, 2, aggregate=True),
    "medianTiming": InsightsQLFunctionMeta("medianTiming", 1, 1, aggregate=True),
    "medianTimingIf": InsightsQLFunctionMeta("medianTimingIf", 2, 2, aggregate=True),
    "medianTimingWeighted": InsightsQLFunctionMeta("medianTimingWeighted", 1, 1, aggregate=True),
    "medianTimingWeightedIf": InsightsQLFunctionMeta("medianTimingWeightedIf", 2, 2, aggregate=True),
    "medianDeterministic": InsightsQLFunctionMeta("medianDeterministic", 1, 1, aggregate=True),
    "medianDeterministicIf": InsightsQLFunctionMeta("medianDeterministicIf", 2, 2, aggregate=True),
    "medianTDigest": InsightsQLFunctionMeta("medianTDigest", 1, 1, aggregate=True),
    "medianTDigestIf": InsightsQLFunctionMeta("medianTDigestIf", 2, 2, aggregate=True),
    "medianTDigestWeighted": InsightsQLFunctionMeta("medianTDigestWeighted", 1, 1, aggregate=True),
    "medianTDigestWeightedIf": InsightsQLFunctionMeta("medianTDigestWeightedIf", 2, 2, aggregate=True),
    "medianBFloat16": InsightsQLFunctionMeta("medianBFloat16", 1, 1, aggregate=True),
    "medianBFloat16If": InsightsQLFunctionMeta("medianBFloat16If", 2, 2, aggregate=True),
    "quantile": InsightsQLFunctionMeta("quantile", 1, 1, min_params=1, max_params=1, aggregate=True),
    "quantileIf": InsightsQLFunctionMeta("quantileIf", 2, 2, min_params=1, max_params=1, aggregate=True),
    "quantiles": InsightsQLFunctionMeta("quantiles", 1, None, aggregate=True),
    "quantilesIf": InsightsQLFunctionMeta("quantilesIf", 2, 2, min_params=1, max_params=1, aggregate=True),
    # "quantileExact": InsightsQLFunctionMeta("quantileExact", 1, 1, aggregate=True),
    # "quantileExactIf": InsightsQLFunctionMeta("quantileExactIf", 2, 2, aggregate=True),
    # "quantileExactLow": InsightsQLFunctionMeta("quantileExactLow", 1, 1, aggregate=True),
    # "quantileExactLowIf": InsightsQLFunctionMeta("quantileExactLowIf", 2, 2, aggregate=True),
    # "quantileExactHigh": InsightsQLFunctionMeta("quantileExactHigh", 1, 1, aggregate=True),
    # "quantileExactHighIf": InsightsQLFunctionMeta("quantileExactHighIf", 2, 2, aggregate=True),
    # "quantileExactWeighted": InsightsQLFunctionMeta("quantileExactWeighted", 1, 1, aggregate=True),
    # "quantileExactWeightedIf": InsightsQLFunctionMeta("quantileExactWeightedIf", 2, 2, aggregate=True),
    # "quantileTiming": InsightsQLFunctionMeta("quantileTiming", 1, 1, aggregate=True),
    # "quantileTimingIf": InsightsQLFunctionMeta("quantileTimingIf", 2, 2, aggregate=True),
    # "quantileTimingWeighted": InsightsQLFunctionMeta("quantileTimingWeighted", 1, 1, aggregate=True),
    # "quantileTimingWeightedIf": InsightsQLFunctionMeta("quantileTimingWeightedIf", 2, 2, aggregate=True),
    # "quantileDeterministic": InsightsQLFunctionMeta("quantileDeterministic", 1, 1, aggregate=True),
    # "quantileDeterministicIf": InsightsQLFunctionMeta("quantileDeterministicIf", 2, 2, aggregate=True),
    # "quantileTDigest": InsightsQLFunctionMeta("quantileTDigest", 1, 1, aggregate=True),
    # "quantileTDigestIf": InsightsQLFunctionMeta("quantileTDigestIf", 2, 2, aggregate=True),
    # "quantileTDigestWeighted": InsightsQLFunctionMeta("quantileTDigestWeighted", 1, 1, aggregate=True),
    # "quantileTDigestWeightedIf": InsightsQLFunctionMeta("quantileTDigestWeightedIf", 2, 2, aggregate=True),
    # "quantileBFloat16": InsightsQLFunctionMeta("quantileBFloat16", 1, 1, aggregate=True),
    # "quantileBFloat16If": InsightsQLFunctionMeta("quantileBFloat16If", 2, 2, aggregate=True),
    # "quantileBFloat16Weighted": InsightsQLFunctionMeta("quantileBFloat16Weighted", 1, 1, aggregate=True),
    # "quantileBFloat16WeightedIf": InsightsQLFunctionMeta("quantileBFloat16WeightedIf", 2, 2, aggregate=True),
    "simpleLinearRegression": InsightsQLFunctionMeta("simpleLinearRegression", 2, 2, aggregate=True),
    "simpleLinearRegressionIf": InsightsQLFunctionMeta("simpleLinearRegressionIf", 3, 3, aggregate=True),
    # "stochasticLinearRegression": InsightsQLFunctionMeta("stochasticLinearRegression", 1, 1, aggregate=True),
    # "stochasticLinearRegressionIf": InsightsQLFunctionMeta("stochasticLinearRegressionIf", 2, 2, aggregate=True),
    # "stochasticLogisticRegression": InsightsQLFunctionMeta("stochasticLogisticRegression", 1, 1, aggregate=True),
    # "stochasticLogisticRegressionIf": InsightsQLFunctionMeta("stochasticLogisticRegressionIf", 2, 2, aggregate=True),
    # "categoricalInformationValue": InsightsQLFunctionMeta("categoricalInformationValue", 1, 1, aggregate=True),
    # "categoricalInformationValueIf": InsightsQLFunctionMeta("categoricalInformationValueIf", 2, 2, aggregate=True),
    "contingency": InsightsQLFunctionMeta("contingency", 2, 2, aggregate=True),
    "contingencyIf": InsightsQLFunctionMeta("contingencyIf", 3, 3, aggregate=True),
    "cramersV": InsightsQLFunctionMeta("cramersV", 2, 2, aggregate=True),
    "cramersVIf": InsightsQLFunctionMeta("cramersVIf", 3, 3, aggregate=True),
    "cramersVBiasCorrected": InsightsQLFunctionMeta("cramersVBiasCorrected", 2, 2, aggregate=True),
    "cramersVBiasCorrectedIf": InsightsQLFunctionMeta("cramersVBiasCorrectedIf", 3, 3, aggregate=True),
    "theilsU": InsightsQLFunctionMeta("theilsU", 2, 2, aggregate=True),
    "theilsUIf": InsightsQLFunctionMeta("theilsUIf", 3, 3, aggregate=True),
    "maxIntersections": InsightsQLFunctionMeta("maxIntersections", 2, 2, aggregate=True),
    "maxIntersectionsIf": InsightsQLFunctionMeta("maxIntersectionsIf", 3, 3, aggregate=True),
    "maxIntersectionsPosition": InsightsQLFunctionMeta("maxIntersectionsPosition", 2, 2, aggregate=True),
    "maxIntersectionsPositionIf": InsightsQLFunctionMeta("maxIntersectionsPositionIf", 3, 3, aggregate=True),
    "windowFunnel": InsightsQLFunctionMeta("windowFunnel", 1, 99, aggregate=True),
    "md5": InsightsQLFunctionMeta("hex(MD5({}))", 1, 1, aggregate=True, using_placeholder_arguments=True),
}
