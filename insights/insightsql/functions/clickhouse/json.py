from insights.insightsql.ast import ArrayType, BooleanType, FloatType, IntegerType, StringType, TupleType

from ..core import InsightsQLFunctionMeta
from ..typegen import generate_json_path_signatures

# Keep in sync with the posthog.com repository: contents/docs/sql/clickhouse-functions.mdx
JSON_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "isValidJSON": InsightsQLFunctionMeta("isValidJSON", 1, 1, signatures=[((StringType(),), IntegerType())]),
    "JSONHas": InsightsQLFunctionMeta(
        "JSONHas",
        1,
        6,
        signatures=generate_json_path_signatures(
            fixed_types=[StringType()],  # JSON parameter
            return_type=IntegerType(),  # Returns 1 or 0
            min_paths=0,
            max_paths=5,
        ),
    ),
    "JSONLength": InsightsQLFunctionMeta(
        "JSONLength",
        1,
        6,
        signatures=generate_json_path_signatures(
            fixed_types=[StringType()],  # JSON parameter
            return_type=IntegerType(),  # Returns length as integer
            min_paths=0,
            max_paths=5,
        ),
    ),
    "JSONArrayLength": InsightsQLFunctionMeta(
        "JSONArrayLength",
        1,
        6,
        signatures=generate_json_path_signatures(
            fixed_types=[StringType()],  # JSON parameter
            return_type=IntegerType(),  # Returns array length as integer
            min_paths=0,
            max_paths=5,
        ),
    ),
    "JSONType": InsightsQLFunctionMeta(
        "JSONType",
        1,
        6,
        signatures=generate_json_path_signatures(
            fixed_types=[StringType()],  # JSON parameter
            return_type=StringType(),  # Returns type name as string
            min_paths=0,
            max_paths=5,
        ),
    ),
    "JSONExtract": InsightsQLFunctionMeta(
        "JSONExtract",
        2,
        7,
        signatures=generate_json_path_signatures(
            fixed_types=[StringType()],  # JSON parameter
            suffix_types=[StringType()],  # ClickHouse data type as string
            return_type=StringType(),  # Returns type name as string
            min_paths=0,
            max_paths=5,
        ),
    ),
    "JSONExtractUInt": InsightsQLFunctionMeta(
        "JSONExtractUInt",
        1,
        6,
        signatures=generate_json_path_signatures(
            fixed_types=[StringType()],  # JSON parameter
            return_type=IntegerType(),  # Returns unsigned integer
            min_paths=0,
            max_paths=5,
        ),
    ),
    "JSONExtractInt": InsightsQLFunctionMeta(
        "JSONExtractInt",
        1,
        6,
        signatures=generate_json_path_signatures(
            fixed_types=[StringType()],  # JSON parameter
            return_type=IntegerType(),  # Returns signed integer
            min_paths=0,
            max_paths=5,
        ),
    ),
    "JSONExtractFloat": InsightsQLFunctionMeta(
        "JSONExtractFloat",
        1,
        6,
        signatures=generate_json_path_signatures(
            fixed_types=[StringType()],  # JSON parameter
            return_type=FloatType(),  # Returns float
            min_paths=0,
            max_paths=5,
        ),
    ),
    "JSONExtractBool": InsightsQLFunctionMeta(
        "JSONExtractBool",
        1,
        6,
        signatures=generate_json_path_signatures(
            fixed_types=[StringType()],  # JSON parameter
            return_type=BooleanType(),  # Returns boolean
            min_paths=0,
            max_paths=5,
        ),
    ),
    "JSONExtractString": InsightsQLFunctionMeta(
        "JSONExtractString",
        1,
        6,
        signatures=generate_json_path_signatures(
            fixed_types=[StringType()],  # JSON parameter
            return_type=StringType(),  # Returns string
            min_paths=0,
            max_paths=5,
        ),
    ),
    "JSONExtractKeys": InsightsQLFunctionMeta(
        "JSONExtractKeys",
        1,
        5,
        signatures=generate_json_path_signatures(
            fixed_types=[StringType()],  # JSON parameter
            return_type=ArrayType(item_type=StringType()),  # Returns array of key names
            min_paths=0,
            max_paths=4,
        ),
    ),
    "JSONExtractRaw": InsightsQLFunctionMeta(
        "JSONExtractRaw",
        1,
        6,
        signatures=generate_json_path_signatures(
            fixed_types=[StringType()],
            return_type=StringType(),
            min_paths=0,
            max_paths=5,
        ),
    ),
    "JSONExtractArrayRaw": InsightsQLFunctionMeta(
        "JSONExtractArrayRaw",
        1,
        6,
        signatures=generate_json_path_signatures(
            fixed_types=[StringType()],  # JSON parameter
            return_type=StringType(),  # Returns raw JSON array as string
            min_paths=0,
            max_paths=5,
        ),
    ),
    "JSONExtractKeysAndValues": InsightsQLFunctionMeta(
        "JSONExtractKeysAndValues",
        2,
        7,
        signatures=generate_json_path_signatures(
            fixed_types=[StringType()],  # JSON parameter
            suffix_types=[StringType()],  # ClickHouse data type as string
            return_type=ArrayType(item_type=TupleType(item_types=[StringType(), StringType()])),
            # Returns array of (key, value) tuples
            min_paths=0,
            max_paths=5,
        ),
    ),
    "JSONExtractKeysAndValuesRaw": InsightsQLFunctionMeta(
        "JSONExtractKeysAndValuesRaw",
        1,
        6,
        signatures=generate_json_path_signatures(
            fixed_types=[StringType()],  # JSON parameter
            return_type=ArrayType(item_type=TupleType(item_types=[StringType(), StringType()])),
            # Returns array of (key, raw_value) tuples
            min_paths=0,
            max_paths=5,
        ),
    ),
    "JSON_VALUE": InsightsQLFunctionMeta("JSON_VALUE", 2, 2, signatures=[((StringType(), StringType()), StringType())]),
}
