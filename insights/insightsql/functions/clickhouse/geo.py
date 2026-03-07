from insights.insightsql.ast import ArrayType, FloatType, IntegerType, StringType, TupleType
from insights.insightsql.functions.core import InsightsQLFunctionMeta

# Keep in sync with the hanzo.ai repository: contents/docs/sql/clickhouse-functions.mdx
GEO_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "greatCircleDistance": InsightsQLFunctionMeta("greatCircleDistance", 4, 4),
    "geoDistance": InsightsQLFunctionMeta("geoDistance", 4, 4),
    "greatCircleAngle": InsightsQLFunctionMeta("greatCircleAngle", 4, 4),
    "pointInEllipses": InsightsQLFunctionMeta("pointInEllipses", 6, None),
    "pointInPolygon": InsightsQLFunctionMeta("pointInPolygon", 2, None),
    "geohashEncode": InsightsQLFunctionMeta("geohashEncode", 2, 3),
    "geohashDecode": InsightsQLFunctionMeta("geohashDecode", 1, 1),
    "geohashesInBox": InsightsQLFunctionMeta("geohashesInBox", 5, 5),
    "h3IsValid": InsightsQLFunctionMeta(
        "h3IsValid",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntegerType()),
        ],
    ),
    "h3GetResolution": InsightsQLFunctionMeta(
        "h3GetResolution",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntegerType()),
        ],
    ),
    "h3GetBaseCell": InsightsQLFunctionMeta(
        "h3GetBaseCell",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntegerType()),
        ],
    ),
    "h3EdgeAngle": InsightsQLFunctionMeta(
        "h3EdgeAngle",
        1,
        1,
        signatures=[
            ((IntegerType(),), FloatType()),
        ],
    ),
    "h3EdgeLengthM": InsightsQLFunctionMeta(
        "h3EdgeLengthM",
        1,
        1,
        signatures=[
            ((IntegerType(),), FloatType()),
        ],
    ),
    "h3EdgeLengthKm": InsightsQLFunctionMeta(
        "h3EdgeLengthKm",
        1,
        1,
        signatures=[
            ((IntegerType(),), FloatType()),
        ],
    ),
    "geoToH3": InsightsQLFunctionMeta(
        "geoToH3",
        3,
        3,
        signatures=[
            ((FloatType(), FloatType(), IntegerType()), IntegerType()),
        ],
    ),
    "h3ToGeo": InsightsQLFunctionMeta(
        "h3ToGeo",
        1,
        1,
        signatures=[
            ((IntegerType(),), TupleType(item_types=[FloatType(), FloatType()])),
        ],
    ),
    "h3ToGeoBoundary": InsightsQLFunctionMeta(
        "h3ToGeoBoundary",
        1,
        1,
        signatures=[
            ((IntegerType(),), ArrayType(item_type=TupleType(item_types=[FloatType(), FloatType()]))),
        ],
    ),
    "h3kRing": InsightsQLFunctionMeta(
        "h3kRing",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), ArrayType(item_type=IntegerType())),
        ],
    ),
    "h3HexAreaM2": InsightsQLFunctionMeta(
        "h3HexAreaM2",
        1,
        1,
        signatures=[
            ((IntegerType(),), FloatType()),
        ],
    ),
    "h3HexAreaKm2": InsightsQLFunctionMeta(
        "h3HexAreaKm2",
        1,
        1,
        signatures=[
            ((IntegerType(),), FloatType()),
        ],
    ),
    "h3IndexesAreNeighbors": InsightsQLFunctionMeta(
        "h3IndexesAreNeighbors",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), IntegerType()),
        ],
    ),
    "h3ToChildren": InsightsQLFunctionMeta(
        "h3ToChildren",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), ArrayType(item_type=IntegerType())),
        ],
    ),
    "h3ToParent": InsightsQLFunctionMeta(
        "h3ToParent",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), IntegerType()),
        ],
    ),
    "h3ToString": InsightsQLFunctionMeta(
        "h3ToString",
        1,
        1,
        signatures=[
            ((IntegerType(),), StringType()),
        ],
    ),
    "stringToH3": InsightsQLFunctionMeta(
        "stringToH3",
        1,
        1,
        signatures=[
            ((StringType(),), IntegerType()),
        ],
    ),
    "h3IsResClassIII": InsightsQLFunctionMeta(
        "h3IsResClassIII",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntegerType()),
        ],
    ),
    "h3IsPentagon": InsightsQLFunctionMeta(
        "h3IsPentagon",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntegerType()),
        ],
    ),
    "h3GetFaces": InsightsQLFunctionMeta(
        "h3GetFaces",
        1,
        1,
        signatures=[
            ((IntegerType(),), ArrayType(item_type=IntegerType())),
        ],
    ),
    "h3CellAreaM2": InsightsQLFunctionMeta(
        "h3CellAreaM2",
        1,
        1,
        signatures=[
            ((IntegerType(),), FloatType()),
        ],
    ),
    "h3CellAreaRads2": InsightsQLFunctionMeta(
        "h3CellAreaRads2",
        1,
        1,
        signatures=[
            ((IntegerType(),), FloatType()),
        ],
    ),
    "h3ToCenterChild": InsightsQLFunctionMeta(
        "h3ToCenterChild",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), IntegerType()),
        ],
    ),
    "h3ExactEdgeLengthM": InsightsQLFunctionMeta(
        "h3ExactEdgeLengthM",
        1,
        1,
        signatures=[
            ((IntegerType(),), FloatType()),
        ],
    ),
    "h3ExactEdgeLengthKm": InsightsQLFunctionMeta(
        "h3ExactEdgeLengthKm",
        1,
        1,
        signatures=[
            ((IntegerType(),), FloatType()),
        ],
    ),
    "h3ExactEdgeLengthRads": InsightsQLFunctionMeta(
        "h3ExactEdgeLengthRads",
        1,
        1,
        signatures=[
            ((IntegerType(),), FloatType()),
        ],
    ),
    "h3NumHexagons": InsightsQLFunctionMeta(
        "h3NumHexagons",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntegerType()),
        ],
    ),
    "h3PointDistM": InsightsQLFunctionMeta(
        "h3PointDistM",
        4,
        4,
        signatures=[
            ((FloatType(), FloatType(), FloatType(), FloatType()), FloatType()),
        ],
    ),
    "h3PointDistKm": InsightsQLFunctionMeta(
        "h3PointDistKm",
        4,
        4,
        signatures=[
            ((FloatType(), FloatType(), FloatType(), FloatType()), FloatType()),
        ],
    ),
    "h3PointDistRads": InsightsQLFunctionMeta(
        "h3PointDistRads",
        4,
        4,
        signatures=[
            ((FloatType(), FloatType(), FloatType(), FloatType()), FloatType()),
        ],
    ),
    "h3GetRes0Indexes": InsightsQLFunctionMeta(
        "h3GetRes0Indexes",
        0,
        0,
        signatures=[
            ((), ArrayType(item_type=IntegerType())),
        ],
    ),
    "h3GetPentagonIndexes": InsightsQLFunctionMeta(
        "h3GetPentagonIndexes",
        1,
        1,
        signatures=[
            ((IntegerType(),), ArrayType(item_type=IntegerType())),
        ],
    ),
    "h3Line": InsightsQLFunctionMeta(
        "h3Line",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), ArrayType(item_type=IntegerType())),
        ],
    ),
    "h3Distance": InsightsQLFunctionMeta(
        "h3Distance",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), IntegerType()),
        ],
    ),
    "h3HexRing": InsightsQLFunctionMeta(
        "h3HexRing",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), ArrayType(item_type=IntegerType())),
        ],
    ),
    "h3GetUnidirectionalEdge": InsightsQLFunctionMeta(
        "h3GetUnidirectionalEdge",
        2,
        2,
        signatures=[
            ((IntegerType(), IntegerType()), IntegerType()),
        ],
    ),
    "h3UnidirectionalEdgeIsValid": InsightsQLFunctionMeta(
        "h3UnidirectionalEdgeIsValid",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntegerType()),
        ],
    ),
    "h3GetOriginIndexFromUnidirectionalEdge": InsightsQLFunctionMeta(
        "h3GetOriginIndexFromUnidirectionalEdge",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntegerType()),
        ],
    ),
    "h3GetDestinationIndexFromUnidirectionalEdge": InsightsQLFunctionMeta(
        "h3GetDestinationIndexFromUnidirectionalEdge",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntegerType()),
        ],
    ),
    "h3GetIndexesFromUnidirectionalEdge": InsightsQLFunctionMeta(
        "h3GetIndexesFromUnidirectionalEdge",
        1,
        1,
        signatures=[
            ((IntegerType(),), TupleType(item_types=[IntegerType(), IntegerType()])),
        ],
    ),
    "h3GetUnidirectionalEdgesFromHexagon": InsightsQLFunctionMeta(
        "h3GetUnidirectionalEdgesFromHexagon",
        1,
        1,
        signatures=[
            ((IntegerType(),), ArrayType(item_type=IntegerType())),
        ],
    ),
    "h3GetUnidirectionalEdgeBoundary": InsightsQLFunctionMeta(
        "h3GetUnidirectionalEdgeBoundary",
        1,
        1,
        signatures=[
            ((IntegerType(),), ArrayType(item_type=TupleType(item_types=[FloatType(), FloatType()]))),
        ],
    ),
}
