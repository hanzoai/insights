from itertools import chain
from typing import Optional

from posthog.insightsql import ast
from posthog.insightsql.ast import IntegerType, StringType
from posthog.insightsql.base import UnknownType
from posthog.insightsql.language_mappings import LANGUAGE_CODES, LANGUAGE_NAMES

from .aggregations import INSIGHTSQL_AGGREGATIONS
from .clickhouse.arithmetic import ARITHMETIC_FUNCTIONS
from .clickhouse.arrays import ARRAYS_FUNCTIONS
from .clickhouse.conversions import CONVERSION_FUNCTIONS
from .clickhouse.datetime import DATETIME_AND_INTERVAL_FUNCTIONS
from .clickhouse.geo import GEO_FUNCTIONS
from .clickhouse.json import JSON_FUNCTIONS
from .clickhouse.mathematical import MATH_FUNCTIONS
from .clickhouse.strings import STRINGS_FUNCTIONS
from .config import INSIGHTSQL_PERMITTED_PARAMETRIC_FUNCTIONS
from .core import InsightsQLFunctionMeta
from .posthog import INSIGHTSQL_POSTINSIGHTS_FUNCTIONS
from .udfs import UDFS

INSIGHTSQL_COMPARISON_MAPPING: dict[str, ast.CompareOperationOp] = {
    "equals": ast.CompareOperationOp.Eq,
    "notEquals": ast.CompareOperationOp.NotEq,
    "less": ast.CompareOperationOp.Lt,
    "greater": ast.CompareOperationOp.Gt,
    "lessOrEquals": ast.CompareOperationOp.LtEq,
    "greaterOrEquals": ast.CompareOperationOp.GtEq,
    "like": ast.CompareOperationOp.Like,
    "ilike": ast.CompareOperationOp.ILike,
    "notLike": ast.CompareOperationOp.NotLike,
    "notILike": ast.CompareOperationOp.NotILike,
    "in": ast.CompareOperationOp.In,
    "notIn": ast.CompareOperationOp.NotIn,
}

INSIGHTSQL_CLICKHOUSE_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    **ARITHMETIC_FUNCTIONS,
    **ARRAYS_FUNCTIONS,
    **CONVERSION_FUNCTIONS,
    **DATETIME_AND_INTERVAL_FUNCTIONS,
    **GEO_FUNCTIONS,
    **JSON_FUNCTIONS,
    **MATH_FUNCTIONS,
    **STRINGS_FUNCTIONS,
    # comparison
    "equals": InsightsQLFunctionMeta("equals", 2, 2),
    "notEquals": InsightsQLFunctionMeta("notEquals", 2, 2),
    "less": InsightsQLFunctionMeta("less", 2, 2),
    "greater": InsightsQLFunctionMeta("greater", 2, 2),
    "lessOrEquals": InsightsQLFunctionMeta("lessOrEquals", 2, 2),
    "greaterOrEquals": InsightsQLFunctionMeta("greaterOrEquals", 2, 2),
    # in
    "in": InsightsQLFunctionMeta("in", 2, 2),
    "notIn": InsightsQLFunctionMeta("notIn", 2, 2),
    # logical
    "and": InsightsQLFunctionMeta("and", 2, None),
    "or": InsightsQLFunctionMeta("or", 2, None),
    "xor": InsightsQLFunctionMeta("xor", 2, None),
    "not": InsightsQLFunctionMeta("not", 1, 1, case_sensitive=False),
    # conditional
    "if": InsightsQLFunctionMeta("if", 3, 3, case_sensitive=False),
    "multiIf": InsightsQLFunctionMeta("multiIf", 3, None),
    "throwIf": InsightsQLFunctionMeta("throwIf", 2, 2),
    # maps
    "map": InsightsQLFunctionMeta("map", 0, None),
    "mapFromArrays": InsightsQLFunctionMeta("mapFromArrays", 2, 2),
    "mapAdd": InsightsQLFunctionMeta("mapAdd", 2, None),
    "mapSubtract": InsightsQLFunctionMeta("mapSubtract", 2, None),
    "mapPopulateSeries": InsightsQLFunctionMeta("mapPopulateSeries", 1, 3),
    "mapContains": InsightsQLFunctionMeta("mapContains", 2, 2),
    "mapKeys": InsightsQLFunctionMeta("mapKeys", 1, 1),
    "mapValues": InsightsQLFunctionMeta("mapValues", 1, 1),
    "mapContainsKeyLike": InsightsQLFunctionMeta("mapContainsKeyLike", 2, 2),
    "mapExtractKeyLike": InsightsQLFunctionMeta("mapExtractKeyLike", 2, 2),
    "mapApply": InsightsQLFunctionMeta("mapApply", 2, 2),
    "mapFilter": InsightsQLFunctionMeta("mapFilter", 2, 2),
    "mapUpdate": InsightsQLFunctionMeta("mapUpdate", 2, 2),
    # bit
    "bitAnd": InsightsQLFunctionMeta("bitAnd", 2, 2),
    "bitOr": InsightsQLFunctionMeta("bitOr", 2, 2),
    "bitXor": InsightsQLFunctionMeta("bitXor", 2, 2),
    "bitNot": InsightsQLFunctionMeta("bitNot", 1, 1),
    "bitShiftLeft": InsightsQLFunctionMeta("bitShiftLeft", 2, 2),
    "bitShiftRight": InsightsQLFunctionMeta("bitShiftRight", 2, 2),
    "bitRotateLeft": InsightsQLFunctionMeta("bitRotateLeft", 2, 2),
    "bitRotateRight": InsightsQLFunctionMeta("bitRotateRight", 2, 2),
    "bitSlice": InsightsQLFunctionMeta("bitSlice", 3, 3),
    "bitTest": InsightsQLFunctionMeta("bitTest", 2, 2),
    "bitTestAll": InsightsQLFunctionMeta("bitTestAll", 3, None),
    "bitTestAny": InsightsQLFunctionMeta("bitTestAny", 3, None),
    "bitCount": InsightsQLFunctionMeta("bitCount", 1, 1),
    "bitHammingDistance": InsightsQLFunctionMeta("bitHammingDistance", 2, 2),
    # bitmap
    "bitmapBuild": InsightsQLFunctionMeta("bitmapBuild", 1, 1),
    "bitmapToArray": InsightsQLFunctionMeta("bitmapToArray", 1, 1),
    "bitmapSubsetInRange": InsightsQLFunctionMeta("bitmapSubsetInRange", 3, 3),
    "bitmapSubsetLimit": InsightsQLFunctionMeta("bitmapSubsetLimit", 3, 3),
    "subBitmap": InsightsQLFunctionMeta("subBitmap", 3, 3),
    "bitmapContains": InsightsQLFunctionMeta("bitmapContains", 2, 2),
    "bitmapHasAny": InsightsQLFunctionMeta("bitmapHasAny", 2, 2),
    "bitmapHasAll": InsightsQLFunctionMeta("bitmapHasAll", 2, 2),
    "bitmapCardinality": InsightsQLFunctionMeta("bitmapCardinality", 1, 1),
    "bitmapMin": InsightsQLFunctionMeta("bitmapMin", 1, 1),
    "bitmapMax": InsightsQLFunctionMeta("bitmapMax", 1, 1),
    "bitmapTransform": InsightsQLFunctionMeta("bitmapTransform", 3, 3),
    "bitmapAnd": InsightsQLFunctionMeta("bitmapAnd", 2, 2),
    "bitmapOr": InsightsQLFunctionMeta("bitmapOr", 2, 2),
    "bitmapXor": InsightsQLFunctionMeta("bitmapXor", 2, 2),
    "bitmapAndnot": InsightsQLFunctionMeta("bitmapAndnot", 2, 2),
    "bitmapAndCardinality": InsightsQLFunctionMeta("bitmapAndCardinality", 2, 2),
    "bitmapOrCardinality": InsightsQLFunctionMeta("bitmapOrCardinality", 2, 2),
    "bitmapXorCardinality": InsightsQLFunctionMeta("bitmapXorCardinality", 2, 2),
    "bitmapAndnotCardinality": InsightsQLFunctionMeta("bitmapAndnotCardinality", 2, 2),
    # urls TODO
    "protocol": InsightsQLFunctionMeta("protocol", 1, 1),
    "domain": InsightsQLFunctionMeta("domain", 1, 1),
    "domainWithoutWWW": InsightsQLFunctionMeta("domainWithoutWWW", 1, 1),
    "topLevelDomain": InsightsQLFunctionMeta("topLevelDomain", 1, 1),
    "firstSignificantSubdomain": InsightsQLFunctionMeta("firstSignificantSubdomain", 1, 1),
    "cutToFirstSignificantSubdomain": InsightsQLFunctionMeta("cutToFirstSignificantSubdomain", 1, 1),
    "cutToFirstSignificantSubdomainWithWWW": InsightsQLFunctionMeta("cutToFirstSignificantSubdomainWithWWW", 1, 1),
    "port": InsightsQLFunctionMeta("port", 1, 2),
    "path": InsightsQLFunctionMeta("path", 1, 1),
    "pathFull": InsightsQLFunctionMeta("pathFull", 1, 1),
    "queryString": InsightsQLFunctionMeta("queryString", 1, 1),
    "fragment": InsightsQLFunctionMeta("fragment", 1, 1),
    "queryStringAndFragment": InsightsQLFunctionMeta("queryStringAndFragment", 1, 1),
    "extractURLParameter": InsightsQLFunctionMeta("extractURLParameter", 2, 2),
    "extractURLParameters": InsightsQLFunctionMeta("extractURLParameters", 1, 1),
    "extractURLParameterNames": InsightsQLFunctionMeta("extractURLParameterNames", 1, 1),
    "URLHierarchy": InsightsQLFunctionMeta("URLHierarchy", 1, 1),
    "URLPathHierarchy": InsightsQLFunctionMeta("URLPathHierarchy", 1, 1),
    "encodeURLComponent": InsightsQLFunctionMeta("encodeURLComponent", 1, 1),
    "decodeURLComponent": InsightsQLFunctionMeta("decodeURLComponent", 1, 1),
    "encodeURLFormComponent": InsightsQLFunctionMeta("encodeURLFormComponent", 1, 1),
    "decodeURLFormComponent": InsightsQLFunctionMeta("decodeURLFormComponent", 1, 1),
    "netloc": InsightsQLFunctionMeta("netloc", 1, 1),
    "cutWWW": InsightsQLFunctionMeta("cutWWW", 1, 1),
    "cutQueryString": InsightsQLFunctionMeta("cutQueryString", 1, 1),
    "cutFragment": InsightsQLFunctionMeta("cutFragment", 1, 1),
    "cutQueryStringAndFragment": InsightsQLFunctionMeta("cutQueryStringAndFragment", 1, 1),
    "cutURLParameter": InsightsQLFunctionMeta("cutURLParameter", 2, 2),
    # tuples
    "tuple": InsightsQLFunctionMeta("tuple", 0, None),
    "tupleElement": InsightsQLFunctionMeta("tupleElement", 2, 3),
    "untuple": InsightsQLFunctionMeta("untuple", 1, 1),
    "tupleHammingDistance": InsightsQLFunctionMeta("tupleHammingDistance", 2, 2),
    "tupleToNameValuePairs": InsightsQLFunctionMeta("tupleToNameValuePairs", 1, 1),
    "tuplePlus": InsightsQLFunctionMeta("tuplePlus", 2, 2),
    "tupleMinus": InsightsQLFunctionMeta("tupleMinus", 2, 2),
    "tupleMultiply": InsightsQLFunctionMeta("tupleMultiply", 2, 2),
    "tupleDivide": InsightsQLFunctionMeta("tupleDivide", 2, 2),
    "tupleNegate": InsightsQLFunctionMeta("tupleNegate", 1, 1),
    "tupleMultiplyByNumber": InsightsQLFunctionMeta("tupleMultiplyByNumber", 2, 2),
    "tupleDivideByNumber": InsightsQLFunctionMeta("tupleDivideByNumber", 2, 2),
    "dotProduct": InsightsQLFunctionMeta("dotProduct", 2, 2),
    # other
    "isFinite": InsightsQLFunctionMeta("isFinite", 1, 1),
    "isInfinite": InsightsQLFunctionMeta("isInfinite", 1, 1),
    "ifNotFinite": InsightsQLFunctionMeta("ifNotFinite", 1, 1),
    "isNaN": InsightsQLFunctionMeta("isNaN", 1, 1),
    "bar": InsightsQLFunctionMeta("bar", 4, 4),
    "transform": InsightsQLFunctionMeta("transform", 3, 4),
    "formatReadableDecimalSize": InsightsQLFunctionMeta("formatReadableDecimalSize", 1, 1),
    "formatReadableSize": InsightsQLFunctionMeta("formatReadableSize", 1, 1),
    "formatReadableQuantity": InsightsQLFunctionMeta("formatReadableQuantity", 1, 1),
    "formatReadableTimeDelta": InsightsQLFunctionMeta("formatReadableTimeDelta", 1, 2),
    "least": InsightsQLFunctionMeta("least", 2, 2, case_sensitive=False),
    "greatest": InsightsQLFunctionMeta("greatest", 2, 2, case_sensitive=False),
    "indexHint": InsightsQLFunctionMeta("indexHint", 1, 1),
    "extractIPv4Substrings": InsightsQLFunctionMeta("extractIPv4Substrings", 1, 1),
    # time window
    "tumble": InsightsQLFunctionMeta("tumble", 2, 2),
    "hop": InsightsQLFunctionMeta("hop", 3, 3),
    "tumbleStart": InsightsQLFunctionMeta("tumbleStart", 1, 3),
    "tumbleEnd": InsightsQLFunctionMeta("tumbleEnd", 1, 3),
    "hopStart": InsightsQLFunctionMeta("hopStart", 1, 3),
    "hopEnd": InsightsQLFunctionMeta("hopEnd", 1, 3),
    # distance window
    "L1Norm": InsightsQLFunctionMeta("L1Norm", 1, 1),
    "L2Norm": InsightsQLFunctionMeta("L2Norm", 1, 1),
    "LinfNorm": InsightsQLFunctionMeta("LinfNorm", 1, 1),
    "LpNorm": InsightsQLFunctionMeta("LpNorm", 2, 2),
    "L1Distance": InsightsQLFunctionMeta("L1Distance", 2, 2),
    "L2Distance": InsightsQLFunctionMeta("L2Distance", 2, 2),
    "LinfDistance": InsightsQLFunctionMeta("LinfDistance", 2, 2),
    "LpDistance": InsightsQLFunctionMeta("LpDistance", 3, 3),
    "L1Normalize": InsightsQLFunctionMeta("L1Normalize", 1, 1),
    "L2Normalize": InsightsQLFunctionMeta("L2Normalize", 1, 1),
    "LinfNormalize": InsightsQLFunctionMeta("LinfNormalize", 1, 1),
    "LpNormalize": InsightsQLFunctionMeta("LpNormalize", 2, 2),
    "cosineDistance": InsightsQLFunctionMeta("cosineDistance", 2, 2),
    # window functions
    "rank": InsightsQLFunctionMeta("rank"),
    "dense_rank": InsightsQLFunctionMeta("dense_rank"),
    "row_number": InsightsQLFunctionMeta("row_number"),
    "first_value": InsightsQLFunctionMeta("first_value", 1, 1),
    "last_value": InsightsQLFunctionMeta("last_value", 1, 1),
    "nth_value": InsightsQLFunctionMeta("nth_value", 2, 2),
    "lagInFrame": InsightsQLFunctionMeta("lagInFrame", 1, 3),
    "leadInFrame": InsightsQLFunctionMeta("leadInFrame", 1, 3),
    # Window functions in PostgreSQL style
    "lag": InsightsQLFunctionMeta(
        "lagInFrame",
        1,
        3,
        signatures=[
            ((UnknownType(),), UnknownType()),
            ((UnknownType(), IntegerType()), UnknownType()),
            ((UnknownType(), IntegerType(), UnknownType()), UnknownType()),
        ],
    ),
    "lead": InsightsQLFunctionMeta(
        "leadInFrame",
        1,
        3,
        signatures=[
            ((UnknownType(),), UnknownType()),
            ((UnknownType(), IntegerType()), UnknownType()),
            ((UnknownType(), IntegerType(), UnknownType()), UnknownType()),
        ],
    ),
    # Translates languages codes to full language name
    "languageCodeToName": InsightsQLFunctionMeta(
        clickhouse_name="transform",
        min_args=1,
        max_args=1,
        suffix_args=[
            ast.Constant(value=LANGUAGE_CODES),
            ast.Constant(value=LANGUAGE_NAMES),
            ast.Constant(value="Unknown"),
        ],
        signatures=[((StringType(),), StringType())],
    ),
}


INSIGHTSQL_CLICKHOUSE_FUNCTIONS.update(UDFS)

ALL_EXPOSED_FUNCTION_NAMES = [
    name for name in chain(INSIGHTSQL_CLICKHOUSE_FUNCTIONS.keys(), INSIGHTSQL_AGGREGATIONS.keys()) if not name.startswith("_")
]


def _find_function(name: str, functions: dict[str, InsightsQLFunctionMeta]) -> Optional[InsightsQLFunctionMeta]:
    func = functions.get(name)
    if func is not None:
        return func

    func = functions.get(name.lower())
    if func is None:
        return None

    # If we haven't found a function with the case preserved, but we have found it in lowercase,
    # then the function names are different case-wise only.
    if func.case_sensitive:
        return None

    return func


def find_insightsql_aggregation(name: str) -> Optional[InsightsQLFunctionMeta]:
    return _find_function(name, INSIGHTSQL_AGGREGATIONS)


def find_insightsql_function(name: str) -> Optional[InsightsQLFunctionMeta]:
    return _find_function(name, INSIGHTSQL_CLICKHOUSE_FUNCTIONS)


def find_insightsql_postinsights_function(name: str) -> Optional[InsightsQLFunctionMeta]:
    return _find_function(name, INSIGHTSQL_POSTINSIGHTS_FUNCTIONS)


def is_allowed_parametric_function(name: str) -> bool:
    # No case-insensitivity for parametric functions
    return name in INSIGHTSQL_PERMITTED_PARAMETRIC_FUNCTIONS
