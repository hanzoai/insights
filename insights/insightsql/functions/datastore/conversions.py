from insights.insightsql import ast
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
from insights.insightsql.base import UnknownType

from ..core import InsightsQLFunctionMeta

# type conversions
# Keep in sync with the hanzo.ai repository: contents/docs/sql/datastore-functions.mdx
TYPE_CONVERSION_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "hex": InsightsQLFunctionMeta("hex", 1, 1),
    "unhex": InsightsQLFunctionMeta("unhex", 1, 1),
    # instead of just "reinterpret" we use specific list of "reinterpretAs*"" functions
    # that we know are safe to use to minimize the security risk
    "reinterpretAsUInt8": InsightsQLFunctionMeta("reinterpretAsUInt8", 1, 1),
    "reinterpretAsUInt16": InsightsQLFunctionMeta("reinterpretAsUInt16", 1, 1),
    "reinterpretAsUInt32": InsightsQLFunctionMeta("reinterpretAsUInt32", 1, 1),
    "reinterpretAsUInt64": InsightsQLFunctionMeta("reinterpretAsUInt64", 1, 1),
    "reinterpretAsUInt128": InsightsQLFunctionMeta("reinterpretAsUInt128", 1, 1),
    "reinterpretAsUInt256": InsightsQLFunctionMeta("reinterpretAsUInt256", 1, 1),
    "reinterpretAsInt8": InsightsQLFunctionMeta("reinterpretAsInt8", 1, 1),
    "reinterpretAsInt16": InsightsQLFunctionMeta("reinterpretAsInt16", 1, 1),
    "reinterpretAsInt32": InsightsQLFunctionMeta("reinterpretAsInt32", 1, 1),
    "reinterpretAsInt64": InsightsQLFunctionMeta("reinterpretAsInt64", 1, 1),
    "reinterpretAsInt128": InsightsQLFunctionMeta("reinterpretAsInt128", 1, 1),
    "reinterpretAsInt256": InsightsQLFunctionMeta("reinterpretAsInt256", 1, 1),
    "reinterpretAsFloat32": InsightsQLFunctionMeta("reinterpretAsFloat32", 1, 1),
    "reinterpretAsFloat64": InsightsQLFunctionMeta("reinterpretAsFloat64", 1, 1),
    "reinterpretAsUUID": InsightsQLFunctionMeta("reinterpretAsUUID", 1, 1),
    "accurateCast": InsightsQLFunctionMeta("accurateCast", 2, 2),
    "accurateCastOrNull": InsightsQLFunctionMeta("accurateCastOrNull", 2, 2),
    "toInt": InsightsQLFunctionMeta("accurateCastOrNull", 1, 1, suffix_args=[ast.Constant(value="Int64")]),
    "toIntOrZero": InsightsQLFunctionMeta("toInt64OrZero", 1, 1, signatures=[((StringType(),), IntegerType())]),
    "toIntOrDefault": InsightsQLFunctionMeta(
        # Mirror of toFloatOrDefault: Datastore's toInt64OrDefault requires the default value to
        # already be Int64, so cast it (any numeric/string literal then works). The 1-arg form is
        # degenerate (equivalent to toIntOrZero) and is rewritten in the printer before the
        # placeholder template renders.
        # Defaults are Integer only: accurateCast of a fractional float (e.g. 0.5) to Int64 throws
        # at runtime, so unlike toFloatOrDefault we don't accept Float-typed defaults.
        "toInt64OrDefault({0}, accurateCast({1}, 'Int64'))",
        1,
        2,
        using_placeholder_arguments=True,
        using_positional_arguments=True,
        signatures=[
            ((DecimalType(),), IntegerType()),
            ((IntegerType(),), IntegerType()),
            ((FloatType(),), IntegerType()),
            ((StringType(),), IntegerType()),
            ((DecimalType(), IntegerType()), IntegerType()),
            ((IntegerType(), IntegerType()), IntegerType()),
            ((FloatType(), IntegerType()), IntegerType()),
            ((StringType(), IntegerType()), IntegerType()),
        ],
    ),
    "_toInt8": InsightsQLFunctionMeta("toInt8", 1, 1),
    "_toInt16": InsightsQLFunctionMeta("toInt16", 1, 1),
    "_toInt32": InsightsQLFunctionMeta("toInt32", 1, 1),
    "_toInt64": InsightsQLFunctionMeta("toInt64", 1, 1),
    "_toUInt8": InsightsQLFunctionMeta("toUInt8", 1, 1, signatures=[((UnknownType(),), IntegerType())]),
    "_toUInt64": InsightsQLFunctionMeta("toUInt64", 1, 1, signatures=[((UnknownType(),), IntegerType())]),
    "_toUInt128": InsightsQLFunctionMeta("toUInt128", 1, 1),
    "toFloat": InsightsQLFunctionMeta("accurateCastOrNull", 1, 1, suffix_args=[ast.Constant(value="Float64")]),
    # Aliases for the Datastore names — these map to the same nullable cast as toFloat
    # (accurateCastOrNull returns NULL on unparseable input, matching toFloat64OrNull semantics).
    "toFloatOrNull": InsightsQLFunctionMeta("accurateCastOrNull", 1, 1, suffix_args=[ast.Constant(value="Float64")]),
    "toFloat64OrNull": InsightsQLFunctionMeta("accurateCastOrNull", 1, 1, suffix_args=[ast.Constant(value="Float64")]),
    "toFloatOrZero": InsightsQLFunctionMeta("toFloat64OrZero", 1, 1, signatures=[((StringType(),), FloatType())]),
    "toFloatOrDefault": InsightsQLFunctionMeta(
        # Datastore's toFloat64OrDefault requires the default value to already be
        # Float64 — passing e.g. an integer 0 raises "Default value type should be
        # same as cast type". Cast the default so any numeric/string literal works.
        # The 1-arg form is degenerate (equivalent to toFloatOrZero) and is
        # rewritten in the printer before the placeholder template renders.
        "toFloat64OrDefault({0}, accurateCast({1}, 'Float64'))",
        1,
        2,
        using_placeholder_arguments=True,
        using_positional_arguments=True,
        # The default arg (second) may be an integer or float literal — the
        # template casts it to Float64 either way, so both must resolve.
        signatures=[
            ((DecimalType(),), FloatType()),
            ((IntegerType(),), FloatType()),
            ((FloatType(),), FloatType()),
            ((StringType(),), FloatType()),
            ((DecimalType(), FloatType()), FloatType()),
            ((DecimalType(), IntegerType()), FloatType()),
            ((IntegerType(), FloatType()), FloatType()),
            ((IntegerType(), IntegerType()), FloatType()),
            ((FloatType(), FloatType()), FloatType()),
            ((FloatType(), IntegerType()), FloatType()),
            ((StringType(), FloatType()), FloatType()),
            ((StringType(), IntegerType()), FloatType()),
        ],
    ),
    "toDecimal": InsightsQLFunctionMeta(
        "accurateCastOrNull",
        2,
        2,
        passthrough_suffix_args_count=1,
        suffix_args=[ast.Constant(value="Decimal64({0})")],  # Scale for Decimal64 is customizable
    ),
    "_toDate": InsightsQLFunctionMeta("toDate", 1, 1),
    "toUUID": InsightsQLFunctionMeta("accurateCastOrNull", 1, 1, suffix_args=[ast.Constant(value="UUID")]),
    "toUUIDOrDefault": InsightsQLFunctionMeta("toUUIDOrDefault", 2, 2),
    "toString": InsightsQLFunctionMeta(
        "toString",
        1,
        2,
        signatures=[
            ((IntegerType(),), StringType()),
            ((StringType(),), StringType()),
            ((FloatType(),), StringType()),
            ((DateType(),), StringType()),
            ((DateType(), StringType()), StringType()),
            ((DateTimeType(),), StringType()),
            ((DateTimeType(), StringType()), StringType()),
        ],
    ),
    "toNullableString": InsightsQLFunctionMeta(
        "accurateCastOrNull", 1, 1, suffix_args=[ast.Constant(value="Nullable(String)")]
    ),
    "toBool": InsightsQLFunctionMeta("accurateCastOrNull", 1, 1, suffix_args=[ast.Constant(value="Bool")]),
    "toJSONString": InsightsQLFunctionMeta("toJSONString", 1, 1),
    "parseDateTime": InsightsQLFunctionMeta("parseDateTimeOrNull", 2, 3, tz_aware=True),
    "parseDateTimeBestEffort": InsightsQLFunctionMeta("parseDateTime64BestEffortOrNull", 1, 2, tz_aware=True),
    "dynamicType": InsightsQLFunctionMeta("dynamicType", 1, 1),
    "toTypeName": InsightsQLFunctionMeta("toTypeName", 1, 1),
    "defaultValueOfTypeName": InsightsQLFunctionMeta("defaultValueOfTypeName", 1, 1),
    "cityHash64": InsightsQLFunctionMeta("cityHash64", 1, 1),
    "UUIDv7ToDateTime": InsightsQLFunctionMeta("UUIDv7ToDateTime", 1, 1, tz_aware=True),
}

# Date conversion functions (that overlap with type conversions)
# Keep in sync with the hanzo.ai repository: contents/docs/sql/datastore-functions.mdx
DATE_CONVERSION_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    **{
        name: InsightsQLFunctionMeta(
            "toDateOrNull",
            1,
            1,
            signatures=[
                ((StringType(),), DateType()),
                ((DateTimeType(),), DateType()),
            ],
            overloads=[((ast.DateTimeType, ast.DateType), "toDate")],
        )
        for name in ["toDate", "to_date"]
    },
    "toDateTime": InsightsQLFunctionMeta(
        "parseDateTime64BestEffortOrNull",
        1,
        2,
        # Incorrect for parseDateTime64BestEffortOrNull but it is required because when we overload to toDateTime, we use this to figure out if timestamp is already in a function.
        tz_aware=True,
        overloads=[
            ((ast.DateTimeType, ast.DateType, ast.IntegerType), "toDateTime"),
            # ((ast.StringType,), "parseDateTime64"),
        ],
        signatures=[
            ((StringType(),), DateTimeType()),
            ((StringType(), IntegerType()), DateTimeType()),
            ((StringType(), IntegerType(), StringType()), DateTimeType()),
        ],
    ),
    "toDateTime64": InsightsQLFunctionMeta(
        "toDateTime64",
        1,
        3,
        tz_aware=True,
        signatures=[
            ((DateTimeType(),), DateTimeType()),
            ((DateTimeType(), IntegerType()), DateTimeType()),
            ((DateTimeType(), IntegerType(), StringType()), DateTimeType()),
        ],
    ),
    "toDateTimeUS": InsightsQLFunctionMeta(
        "parseDateTime64BestEffortUSOrNull",
        1,
        2,
        tz_aware=True,
        signatures=[
            ((StringType(),), DateTimeType()),
            ((StringType(), IntegerType()), DateTimeType()),
            ((StringType(), IntegerType(), StringType()), DateTimeType()),
        ],
    ),
}

# Keep in sync with the hanzo.ai repository: contents/docs/sql/datastore-functions.mdx
NULLABILITY_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "isnull": InsightsQLFunctionMeta("isNull", 1, 1, case_sensitive=False),
    "isNotNull": InsightsQLFunctionMeta("isNotNull", 1, 1),
    "coalesce": InsightsQLFunctionMeta("coalesce", 1, None, case_sensitive=False),
    "ifnull": InsightsQLFunctionMeta(
        "ifNull",
        2,
        2,
        case_sensitive=False,
        signatures=[
            ((StringType(), StringType()), StringType()),
            ((BooleanType(), BooleanType()), BooleanType()),
            ((DateType(), DateType()), DateType()),
            ((DateTimeType(), DateTimeType()), DateTimeType()),
            ((UUIDType(), UUIDType()), UUIDType()),
            ((ArrayType(), ArrayType()), ArrayType()),
            ((DecimalType(), DecimalType()), DecimalType()),
            ((IntegerType(), IntegerType()), IntegerType()),
            ((FloatType(), FloatType()), FloatType()),
            ((IntervalType(), IntervalType()), IntervalType()),
        ],
    ),
    "nullif": InsightsQLFunctionMeta(
        "nullIf",
        2,
        2,
        case_sensitive=False,
        signatures=[
            ((StringType(), StringType()), StringType()),
            ((BooleanType(), BooleanType()), BooleanType()),
            ((DateType(), DateType()), DateType()),
            ((DateTimeType(), DateTimeType()), DateTimeType()),
            ((UUIDType(), UUIDType()), UUIDType()),
            ((ArrayType(), ArrayType()), ArrayType()),
            ((DecimalType(), DecimalType()), DecimalType()),
            ((IntegerType(), IntegerType()), IntegerType()),
            ((FloatType(), FloatType()), FloatType()),
            ((IntervalType(), IntervalType()), IntervalType()),
        ],
    ),
    "assumeNotNull": InsightsQLFunctionMeta(
        "assumeNotNull",
        1,
        1,
        signatures=[
            ((StringType(),), StringType()),
            ((BooleanType(),), BooleanType()),
            ((DateType(),), DateType()),
            ((DateTimeType(),), DateTimeType()),
            ((UUIDType(),), UUIDType()),
            ((ArrayType(),), ArrayType()),
            ((DecimalType(),), DecimalType()),
            ((IntegerType(),), IntegerType()),
            ((FloatType(),), FloatType()),
            ((IntervalType(),), IntervalType()),
        ],
    ),
    "toNullable": InsightsQLFunctionMeta(
        "toNullable",
        1,
        1,
        signatures=[
            ((StringType(),), StringType()),
            ((BooleanType(),), BooleanType()),
            ((DateType(),), DateType()),
            ((DateTimeType(),), DateTimeType()),
            ((UUIDType(),), UUIDType()),
            ((ArrayType(),), ArrayType()),
            ((DecimalType(),), DecimalType()),
            ((IntegerType(),), IntegerType()),
            ((FloatType(),), FloatType()),
            ((IntervalType(),), IntervalType()),
        ],
    ),
}

# Combined conversion functions
CONVERSION_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    **TYPE_CONVERSION_FUNCTIONS,
    **DATE_CONVERSION_FUNCTIONS,
    **NULLABILITY_FUNCTIONS,
}
