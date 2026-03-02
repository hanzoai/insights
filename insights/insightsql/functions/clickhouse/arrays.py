from insights.insightsql.ast import (
    ArrayType,
    BooleanType,
    DateTimeType,
    DateType,
    DecimalType,
    FloatType,
    IntegerType,
    IntervalType,
    StringType,
    UUIDType,
)

from ..core import InsightsQLFunctionMeta

# arrays and strings common
# Keep in sync with the posthog.com repository: contents/docs/sql/clickhouse-functions.mdx
ARRAY_STRING_COMMON_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "empty": InsightsQLFunctionMeta(
        "empty",
        1,
        1,
        signatures=[
            ((ArrayType(),), IntegerType()),
            ((StringType(),), IntegerType()),
            ((UUIDType(),), IntegerType()),
        ],
    ),
    "notEmpty": InsightsQLFunctionMeta(
        "notEmpty",
        1,
        1,
        signatures=[
            ((ArrayType(),), IntegerType()),
            ((StringType(),), IntegerType()),
            ((UUIDType(),), IntegerType()),
        ],
    ),
    "length": InsightsQLFunctionMeta(
        "length",
        1,
        1,
        case_sensitive=False,
        signatures=[
            ((ArrayType(),), IntegerType()),
            ((StringType(),), IntegerType()),
        ],
    ),
    "reverse": InsightsQLFunctionMeta("reverse", 1, 1, case_sensitive=False),
}

# arrays
# Keep in sync with the posthog.com repository: contents/docs/sql/clickhouse-functions.mdx
ARRAY_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "array": InsightsQLFunctionMeta("array", 0, None),
    "range": InsightsQLFunctionMeta("range", 1, 3),
    "arrayConcat": InsightsQLFunctionMeta("arrayConcat", 2, None),
    "arrayElement": InsightsQLFunctionMeta("arrayElement", 2, 2),
    "has": InsightsQLFunctionMeta("has", 2, 2),
    "hasAll": InsightsQLFunctionMeta("hasAll", 2, 2),
    "hasAny": InsightsQLFunctionMeta("hasAny", 2, 2),
    "hasSubstr": InsightsQLFunctionMeta("hasSubstr", 2, 2),
    "indexOf": InsightsQLFunctionMeta(
        "indexOf",
        2,
        2,
        signatures=[
            (
                (
                    ArrayType(),
                    StringType(),
                ),
                IntegerType(),
            ),
            (
                (
                    ArrayType(),
                    BooleanType(),
                ),
                IntegerType(),
            ),
            (
                (
                    ArrayType(),
                    DateType(),
                ),
                IntegerType(),
            ),
            (
                (
                    ArrayType(),
                    DateTimeType(),
                ),
                IntegerType(),
            ),
            (
                (
                    ArrayType(),
                    UUIDType(),
                ),
                IntegerType(),
            ),
            (
                (
                    ArrayType(),
                    ArrayType(),
                ),
                IntegerType(),
            ),
            (
                (
                    ArrayType(),
                    DecimalType(),
                ),
                IntegerType(),
            ),
            (
                (
                    ArrayType(),
                    IntegerType(),
                ),
                IntegerType(),
            ),
            (
                (
                    ArrayType(),
                    FloatType(),
                ),
                IntegerType(),
            ),
            (
                (
                    ArrayType(),
                    IntervalType(),
                ),
                IntegerType(),
            ),
        ],
    ),
    "arrayCount": InsightsQLFunctionMeta("arrayCount", 1, None),
    "countEqual": InsightsQLFunctionMeta("countEqual", 2, 2),
    "arrayEnumerate": InsightsQLFunctionMeta("arrayEnumerate", 1, 1),
    "arrayEnumerateUniq": InsightsQLFunctionMeta("arrayEnumerateUniq", 2, None),
    "arrayPopBack": InsightsQLFunctionMeta("arrayPopBack", 1, 1),
    "arrayPopFront": InsightsQLFunctionMeta("arrayPopFront", 1, 1),
    "arrayPushBack": InsightsQLFunctionMeta("arrayPushBack", 2, 2),
    "arrayPushFront": InsightsQLFunctionMeta("arrayPushFront", 2, 2),
    "arrayResize": InsightsQLFunctionMeta("arrayResize", 2, 3),
    "arraySlice": InsightsQLFunctionMeta("arraySlice", 2, 3),
    "arraySort": InsightsQLFunctionMeta("arraySort", 1, None),
    "arrayReverseSort": InsightsQLFunctionMeta("arraySort", 1, None),
    "arrayUniq": InsightsQLFunctionMeta("arrayUniq", 1, None),
    "arrayJoin": InsightsQLFunctionMeta("arrayJoin", 1, 1),
    "arrayDifference": InsightsQLFunctionMeta("arrayDifference", 1, 1),
    "arrayDistinct": InsightsQLFunctionMeta("arrayDistinct", 1, 1),
    "arrayEnumerateDense": InsightsQLFunctionMeta("arrayEnumerateDense", 1, 1),
    "arrayIntersect": InsightsQLFunctionMeta("arrayIntersect", 1, None),
    "arrayReduce": InsightsQLFunctionMeta("arrayReduce", 2, None, parametric_first_arg=True),
    # "arrayReduceInRanges": InsightsQLFunctionMeta("arrayReduceInRanges", 3,None),  # takes a "parametric function" as first arg, is that safe?
    "arrayReverse": InsightsQLFunctionMeta("arrayReverse", 1, 1),
    "arrayFilter": InsightsQLFunctionMeta("arrayFilter", 2, None),
    "arrayFlatten": InsightsQLFunctionMeta("arrayFlatten", 1, 1),
    "arrayCompact": InsightsQLFunctionMeta("arrayCompact", 1, 1),
    "arrayZip": InsightsQLFunctionMeta("arrayZip", 2, None),
    "arrayAUC": InsightsQLFunctionMeta("arrayAUC", 2, 2),
    "arrayMap": InsightsQLFunctionMeta("arrayMap", 2, None),
    "arrayFill": InsightsQLFunctionMeta("arrayFill", 2, None),
    "arrayFold": InsightsQLFunctionMeta("arrayFold", 3, None),
    "arrayWithConstant": InsightsQLFunctionMeta("arrayWithConstant", 2, 2),
    "arraySplit": InsightsQLFunctionMeta("arraySplit", 2, None),
    "arrayReverseFill": InsightsQLFunctionMeta("arrayReverseFill", 2, None),
    "arrayReverseSplit": InsightsQLFunctionMeta("arrayReverseSplit", 2, None),
    "arrayRotateLeft": InsightsQLFunctionMeta("arrayRotateLeft", 2, 2),
    "arrayRotateRight": InsightsQLFunctionMeta("arrayRotateRight", 2, 2),
    "arrayExists": InsightsQLFunctionMeta("arrayExists", 1, None),
    "arrayAll": InsightsQLFunctionMeta("arrayAll", 1, None),
    "arrayFirst": InsightsQLFunctionMeta("arrayFirst", 2, None),
    "arrayLast": InsightsQLFunctionMeta("arrayLast", 2, None),
    "arrayFirstIndex": InsightsQLFunctionMeta("arrayFirstIndex", 2, None),
    "arrayLastIndex": InsightsQLFunctionMeta("arrayLastIndex", 2, None),
    "arrayMin": InsightsQLFunctionMeta("arrayMin", 1, 2),
    "arrayMax": InsightsQLFunctionMeta("arrayMax", 1, 2),
    "arraySum": InsightsQLFunctionMeta("arraySum", 1, 2),
    "arrayAvg": InsightsQLFunctionMeta("arrayAvg", 1, 2),
    "arrayCumSum": InsightsQLFunctionMeta("arrayCumSum", 1, None),
    "arrayCumSumNonNegative": InsightsQLFunctionMeta("arrayCumSumNonNegative", 1, None),
    "arrayProduct": InsightsQLFunctionMeta("arrayProduct", 1, 1),
    "arrayStringConcat": InsightsQLFunctionMeta("arrayStringConcat", 1, 2),
    # table functions
    "generateSeries": InsightsQLFunctionMeta("generate_series", 3, 3),
}

# Combined arrays and strings functions
ARRAYS_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    **ARRAY_STRING_COMMON_FUNCTIONS,
    **ARRAY_FUNCTIONS,
}
