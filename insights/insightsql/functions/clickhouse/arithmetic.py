from insights.insightsql.ast import DateTimeType, DecimalType, FloatType, IntegerType, IntervalType, TupleType

from ..core import InsightsQLFunctionMeta

# Keep in sync with the posthog.com repository: contents/docs/sql/clickhouse-functions.mdx
ARITHMETIC_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "plus": InsightsQLFunctionMeta(
        "plus",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), IntegerType()),
            ((FloatType(), IntegerType()), FloatType()),
            ((IntegerType(), FloatType()), FloatType()),
            (
                (
                    TupleType(item_types=[IntegerType()], repeat=True),
                    TupleType(item_types=[IntegerType()], repeat=True),
                ),
                TupleType(item_types=[IntegerType()], repeat=True),
            ),
            ((DateTimeType(), IntegerType()), DateTimeType()),
            ((IntegerType(), DateTimeType()), DateTimeType()),
            ((DateTimeType(), IntervalType()), DateTimeType()),
            ((IntervalType(), DateTimeType()), DateTimeType()),
        ],
    ),
    "minus": InsightsQLFunctionMeta(
        "minus",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), IntegerType()),
            ((FloatType(), IntegerType()), FloatType()),
            ((IntegerType(), FloatType()), FloatType()),
            (
                (
                    TupleType(item_types=[IntegerType()], repeat=True),
                    TupleType(item_types=[IntegerType()], repeat=True),
                ),
                TupleType(item_types=[IntegerType()], repeat=True),
            ),
            ((DateTimeType(), IntegerType()), DateTimeType()),
            ((IntegerType(), DateTimeType()), DateTimeType()),
            ((DateTimeType(), IntervalType()), DateTimeType()),
            ((IntervalType(), DateTimeType()), DateTimeType()),
        ],
    ),
    "multiply": InsightsQLFunctionMeta(
        "multiply",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), IntegerType()),
            ((FloatType(), IntegerType()), FloatType()),
            ((IntegerType(), FloatType()), FloatType()),
            (
                (
                    TupleType(item_types=[IntegerType()], repeat=True),
                    TupleType(item_types=[IntegerType()], repeat=True),
                ),
                TupleType(item_types=[IntegerType()], repeat=True),
            ),
            (
                (IntegerType(), TupleType(item_types=[IntegerType()], repeat=True)),
                TupleType(item_types=[IntegerType()], repeat=True),
            ),
            (
                (TupleType(item_types=[IntegerType()], repeat=True), IntegerType()),
                TupleType(item_types=[IntegerType()], repeat=True),
            ),
            ((DateTimeType(), IntegerType()), DateTimeType()),
            ((IntegerType(), DateTimeType()), DateTimeType()),
        ],
    ),
    "divide": InsightsQLFunctionMeta(
        "divide",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), IntegerType()),
            ((FloatType(), IntegerType()), FloatType()),
            ((IntegerType(), FloatType()), FloatType()),
            (
                (TupleType(item_types=[IntegerType()], repeat=True), IntegerType()),
                TupleType(item_types=[IntegerType()], repeat=True),
            ),
            ((DateTimeType(), IntegerType()), DateTimeType()),
            ((IntegerType(), DateTimeType()), DateTimeType()),
        ],
    ),
    "intDiv": InsightsQLFunctionMeta(
        "intDiv",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), IntegerType()),
        ],
    ),
    "intDivOrZero": InsightsQLFunctionMeta(
        "intDivOrZero",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), IntegerType()),
        ],
    ),
    "modulo": InsightsQLFunctionMeta(
        "modulo",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), IntegerType()),
            ((FloatType(), IntegerType()), FloatType()),
            ((IntegerType(), FloatType()), FloatType()),
        ],
    ),
    "moduloOrZero": InsightsQLFunctionMeta(
        "moduloOrZero",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), IntegerType()),
            ((FloatType(), IntegerType()), FloatType()),
            ((IntegerType(), FloatType()), FloatType()),
        ],
    ),
    "positiveModulo": InsightsQLFunctionMeta(
        "positiveModulo",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), IntegerType()),
            ((FloatType(), IntegerType()), FloatType()),
            ((IntegerType(), FloatType()), FloatType()),
        ],
    ),
    "negate": InsightsQLFunctionMeta(
        "negate",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntegerType()),
            ((FloatType(),), FloatType()),
            ((DecimalType(),), DecimalType()),
        ],
    ),
    "abs": InsightsQLFunctionMeta(
        "abs",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntegerType()),
        ],
        case_sensitive=False,
    ),
    "gcd": InsightsQLFunctionMeta(
        "gcd",
        2,
        2,
        signatures=[
            ((IntegerType(),), IntegerType()),
        ],
    ),
    "lcm": InsightsQLFunctionMeta(
        "lcm",
        2,
        2,
        signatures=[
            ((IntegerType(),), IntegerType()),
        ],
    ),
    "max2": InsightsQLFunctionMeta(
        "max2",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), FloatType()),
            ((FloatType(), IntegerType()), FloatType()),
            ((IntegerType(), FloatType()), FloatType()),
        ],
        case_sensitive=False,
    ),
    "min2": InsightsQLFunctionMeta(
        "min2",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), FloatType()),
            ((FloatType(), IntegerType()), FloatType()),
            ((IntegerType(), FloatType()), FloatType()),
        ],
        case_sensitive=False,
    ),
    "multiplyDecimal": InsightsQLFunctionMeta("multiplyDecimal", 2, 3),
    "divideDecimal": InsightsQLFunctionMeta("divideDecimal", 2, 3),
}
