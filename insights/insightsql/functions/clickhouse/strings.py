from insights.insightsql.ast import IntegerType, StringType

from ..core import InsightsQLFunctionMeta

# Keep in sync with the hanzo.ai repository: contents/docs/sql/clickhouse-functions.mdx
STRING_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "left": InsightsQLFunctionMeta("left", 2, 2, signatures=[((StringType(), IntegerType()), StringType())]),
    "right": InsightsQLFunctionMeta("right", 2, 2, signatures=[((StringType(), IntegerType()), StringType())]),
    "lengthUTF8": InsightsQLFunctionMeta("lengthUTF8", 1, 1),
    "leftPad": InsightsQLFunctionMeta("leftPad", 2, 3),
    "rightPad": InsightsQLFunctionMeta("rightPad", 2, 3),
    "leftPadUTF8": InsightsQLFunctionMeta("leftPadUTF8", 2, 3),
    "rightPadUTF8": InsightsQLFunctionMeta("rightPadUTF8", 2, 3),
    "lower": InsightsQLFunctionMeta("lower", 1, 1, case_sensitive=False),
    "upper": InsightsQLFunctionMeta("upper", 1, 1, case_sensitive=False),
    "lowerUTF8": InsightsQLFunctionMeta("lowerUTF8", 1, 1),
    "upperUTF8": InsightsQLFunctionMeta("upperUTF8", 1, 1),
    "isValidUTF8": InsightsQLFunctionMeta("isValidUTF8", 1, 1),
    "toValidUTF8": InsightsQLFunctionMeta("toValidUTF8", 1, 1),
    "format": InsightsQLFunctionMeta("format", 2, None),
    "reverseUTF8": InsightsQLFunctionMeta("reverseUTF8", 1, 1),
    "concat": InsightsQLFunctionMeta("concat", 2, None, case_sensitive=False),
    "substring": InsightsQLFunctionMeta("substring", 3, 3, case_sensitive=False),
    "substringUTF8": InsightsQLFunctionMeta("substringUTF8", 3, 3),
    "appendTrailingCharIfAbsent": InsightsQLFunctionMeta("appendTrailingCharIfAbsent", 2, 2),
    "convertCharset": InsightsQLFunctionMeta("convertCharset", 3, 3),
    "base58Encode": InsightsQLFunctionMeta("base58Encode", 1, 1),
    "base58Decode": InsightsQLFunctionMeta("base58Decode", 1, 1),
    "tryBase58Decode": InsightsQLFunctionMeta("tryBase58Decode", 1, 1),
    "base64Encode": InsightsQLFunctionMeta("base64Encode", 1, 1),
    "base64Decode": InsightsQLFunctionMeta("base64Decode", 1, 1),
    "tryBase64Decode": InsightsQLFunctionMeta("tryBase64Decode", 1, 1),
    "endsWith": InsightsQLFunctionMeta("endsWith", 2, 2),
    "startsWith": InsightsQLFunctionMeta("startsWith", 2, 2),
    "encodeXMLComponent": InsightsQLFunctionMeta("encodeXMLComponent", 1, 1),
    "decodeXMLComponent": InsightsQLFunctionMeta("decodeXMLComponent", 1, 1),
    "extractTextFromHTML": InsightsQLFunctionMeta("extractTextFromHTML", 1, 1),
    "ascii": InsightsQLFunctionMeta("ascii", 1, 1, case_sensitive=False),
    "concatWithSeparator": InsightsQLFunctionMeta("concatWithSeparator", 2, None),
}

# searching in strings
# Keep in sync with the hanzo.ai repository: contents/docs/sql/clickhouse-functions.mdx
STRING_SEARCH_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "position": InsightsQLFunctionMeta("position", 2, 3, case_sensitive=False),
    "positionCaseInsensitive": InsightsQLFunctionMeta("positionCaseInsensitive", 2, 3),
    "positionUTF8": InsightsQLFunctionMeta("positionUTF8", 2, 3),
    "positionCaseInsensitiveUTF8": InsightsQLFunctionMeta("positionCaseInsensitiveUTF8", 2, 3),
    "multiSearchAllPositions": InsightsQLFunctionMeta("multiSearchAllPositions", 2, 2),
    "multiSearchAllPositionsUTF8": InsightsQLFunctionMeta("multiSearchAllPositionsUTF8", 2, 2),
    "multiSearchFirstPosition": InsightsQLFunctionMeta("multiSearchFirstPosition", 2, 2),
    "multiSearchFirstIndex": InsightsQLFunctionMeta("multiSearchFirstIndex", 2, 2),
    "multiSearchAny": InsightsQLFunctionMeta("multiSearchAny", 2, 2),
    "multiSearchAllPositionsCaseInsensitive": InsightsQLFunctionMeta("multiSearchAllPositionsCaseInsensitive", 2, 2),
    "multiSearchAllPositionsCaseInsensitiveUTF8": InsightsQLFunctionMeta("multiSearchAllPositionsCaseInsensitiveUTF8", 2, 2),
    "multiSearchAnyUTF8": InsightsQLFunctionMeta("multiSearchAnyUTF8", 2, 2),
    "multiSearchAnyCaseInsensitive": InsightsQLFunctionMeta("multiSearchAnyCaseInsensitive", 2, 2),
    "multiSearchAnyCaseInsensitiveUTF8": InsightsQLFunctionMeta("multiSearchAnyCaseInsensitiveUTF8", 2, 2),
    "multiSearchFirstIndexUTF8": InsightsQLFunctionMeta("multiSearchFirstIndexUTF8", 2, 2),
    "multiSearchFirstIndexCaseInsensitive": InsightsQLFunctionMeta("multiSearchFirstIndexCaseInsensitive", 2, 2),
    "multiSearchFirstIndexCaseInsensitiveUTF8": InsightsQLFunctionMeta("multiSearchFirstIndexCaseInsensitiveUTF8", 2, 2),
    "multiSearchFirstPositionUTF8": InsightsQLFunctionMeta("multiSearchFirstPositionUTF8", 2, 2),
    "multiSearchFirstPositionCaseInsensitive": InsightsQLFunctionMeta("multiSearchFirstPositionCaseInsensitive", 2, 2),
    "multiSearchFirstPositionCaseInsensitiveUTF8": InsightsQLFunctionMeta(
        "multiSearchFirstPositionCaseInsensitiveUTF8", 2, 2
    ),
    "match": InsightsQLFunctionMeta("match", 2, 2),
    "multiMatchAny": InsightsQLFunctionMeta("multiMatchAny", 2, 2),
    "multiMatchAnyIndex": InsightsQLFunctionMeta("multiMatchAnyIndex", 2, 2),
    "multiMatchAllIndices": InsightsQLFunctionMeta("multiMatchAllIndices", 2, 2),
    "multiFuzzyMatchAny": InsightsQLFunctionMeta("multiFuzzyMatchAny", 3, 3),
    "multiFuzzyMatchAnyIndex": InsightsQLFunctionMeta("multiFuzzyMatchAnyIndex", 3, 3),
    "multiFuzzyMatchAllIndices": InsightsQLFunctionMeta("multiFuzzyMatchAllIndices", 3, 3),
    "extract": InsightsQLFunctionMeta("extract", 2, 2, case_sensitive=False),
    "extractAll": InsightsQLFunctionMeta("extractAll", 2, 2),
    "extractAllGroupsHorizontal": InsightsQLFunctionMeta("extractAllGroupsHorizontal", 2, 2),
    "extractAllGroupsVertical": InsightsQLFunctionMeta("extractAllGroupsVertical", 2, 2),
    "extractGroups": InsightsQLFunctionMeta("extractGroups", 2, 2),
    "like": InsightsQLFunctionMeta("like", 2, 2),
    "ilike": InsightsQLFunctionMeta("ilike", 2, 2),
    "notLike": InsightsQLFunctionMeta("notLike", 2, 2),
    "notILike": InsightsQLFunctionMeta("notILike", 2, 2),
    "locate": InsightsQLFunctionMeta("locate", 2, 3),
    "ngramDistance": InsightsQLFunctionMeta("ngramDistance", 2, 2),
    "ngramDistanceCaseInsensitive": InsightsQLFunctionMeta("ngramDistanceCaseInsensitive", 2, 2),
    "ngramDistanceUTF8": InsightsQLFunctionMeta("ngramDistanceUTF8", 2, 2),
    "ngramDistanceCaseInsensitiveUTF8": InsightsQLFunctionMeta("ngramDistanceCaseInsensitiveUTF8", 2, 2),
    "ngramSearch": InsightsQLFunctionMeta("ngramSearch", 2, 2),
    "ngramSearchCaseInsensitive": InsightsQLFunctionMeta("ngramSearchCaseInsensitive", 2, 2),
    "ngramSearchUTF8": InsightsQLFunctionMeta("ngramSearchUTF8", 2, 2),
    "ngramSearchCaseInsensitiveUTF8": InsightsQLFunctionMeta("ngramSearchCaseInsensitiveUTF8", 2, 2),
    "countSubstrings": InsightsQLFunctionMeta("countSubstrings", 2, 3),
    "countSubstringsCaseInsensitive": InsightsQLFunctionMeta("countSubstringsCaseInsensitive", 2, 3),
    "countSubstringsCaseInsensitiveUTF8": InsightsQLFunctionMeta("countSubstringsCaseInsensitiveUTF8", 2, 3),
    "countMatches": InsightsQLFunctionMeta("countMatches", 2, 2),
    "countMatchesCaseInsensitive": InsightsQLFunctionMeta("countMatchesCaseInsensitive", 2, 2),
    "hasSubsequence": InsightsQLFunctionMeta("hasSubsequence", 2, 2),
    "hasSubsequenceCaseInsensitive": InsightsQLFunctionMeta("hasSubsequenceCaseInsensitive", 2, 2),
    "hasSubsequenceUTF8": InsightsQLFunctionMeta("hasSubsequenceUTF8", 2, 2),
    "hasSubsequenceCaseInsensitiveUTF8": InsightsQLFunctionMeta("hasSubsequenceCaseInsensitiveUTF8", 2, 2),
    "hasToken": InsightsQLFunctionMeta("hasToken", 2, 2),
    "hasTokenCaseInsensitive": InsightsQLFunctionMeta("hasTokenCaseInsensitive", 2, 2),
    "hasTokenOrNull": InsightsQLFunctionMeta("hasTokenOrNull", 2, 2),
    "hasTokenCaseInsensitiveOrNull": InsightsQLFunctionMeta("hasTokenCaseInsensitiveOrNull", 2, 2),
    "hasAllTokens": InsightsQLFunctionMeta("hasAllTokens", 2, 2),
    "hasAnyTokens": InsightsQLFunctionMeta("hasAnyTokens", 2, 2),
    "regexpExtract": InsightsQLFunctionMeta("regexpExtract", 2, 3),
}

# replacing in strings
# Keep in sync with the hanzo.ai repository: contents/docs/sql/clickhouse-functions.mdx
STRING_REPLACE_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "replace": InsightsQLFunctionMeta("replace", 3, 3, case_sensitive=False),
    "replaceAll": InsightsQLFunctionMeta("replaceAll", 3, 3),
    "replaceOne": InsightsQLFunctionMeta("replaceOne", 3, 3),
    "replaceRegexpAll": InsightsQLFunctionMeta("replaceRegexpAll", 3, 3),
    "replaceRegexpOne": InsightsQLFunctionMeta("replaceRegexpOne", 3, 3),
    "regexpQuoteMeta": InsightsQLFunctionMeta("regexpQuoteMeta", 1, 1),
    "translate": InsightsQLFunctionMeta("translate", 3, 3),
    "translateUTF8": InsightsQLFunctionMeta("translateUTF8", 3, 3),
}

# splitting strings
# Keep in sync with the hanzo.ai repository: contents/docs/sql/clickhouse-functions.mdx
STRING_SPLIT_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "splitByChar": InsightsQLFunctionMeta("splitByChar", 2, 3),
    "splitByString": InsightsQLFunctionMeta("splitByString", 2, 3),
    "splitByRegexp": InsightsQLFunctionMeta("splitByRegexp", 2, 3),
    "splitByWhitespace": InsightsQLFunctionMeta("splitByWhitespace", 1, 2),
    "splitByNonAlpha": InsightsQLFunctionMeta("splitByNonAlpha", 1, 2),
    "alphaTokens": InsightsQLFunctionMeta("alphaTokens", 1, 2),
    "extractAllGroups": InsightsQLFunctionMeta("extractAllGroups", 2, 2),
    "ngrams": InsightsQLFunctionMeta("ngrams", 2, 2),
    "tokens": InsightsQLFunctionMeta("tokens", 1, 1),
}

# PostgreSQL-style string functions
# Keep in sync with the hanzo.ai repository: contents/docs/sql/clickhouse-functions.mdx
POSTGRESQL_STRING_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "repeat": InsightsQLFunctionMeta(
        "repeat",
        2,
        2,
        signatures=[((StringType(), IntegerType()), StringType())],
    ),
    "initcap": InsightsQLFunctionMeta(
        "initcap",
        1,
        1,
        signatures=[((StringType(),), StringType())],
    ),
    "lpad": InsightsQLFunctionMeta(
        "lpad",
        3,
        3,
        signatures=[((StringType(), IntegerType(), StringType()), StringType())],
    ),
    "rpad": InsightsQLFunctionMeta(
        "rpad",
        3,
        3,
        signatures=[((StringType(), IntegerType(), StringType()), StringType())],
    ),
    "split_part": InsightsQLFunctionMeta(
        # We need to repeat each argument in the format string since we use each one multiple times
        "arrayElement(arrayMap((parts, idx) -> if(empty(parts), '', if(length(parts) >= idx, arrayElement(parts, idx), '')), [splitByString({1}, {0})], [{2}]), 1)",
        3,
        3,
        signatures=[((StringType(), StringType(), IntegerType()), StringType())],
        using_placeholder_arguments=True,
        using_positional_arguments=True,
    ),
}

# PostgreSQL trim functions - using dictionary comprehensions like in the original
# Keep in sync with the hanzo.ai repository: contents/docs/sql/clickhouse-functions.mdx
POSTGRESQL_TRIM_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    **{
        name: InsightsQLFunctionMeta(
            "trimLeft",
            1,
            2,
            signatures=[
                ((StringType(),), StringType()),
                ((StringType(), StringType()), StringType()),
            ],
        )
        for name in ["ltrim", "trimLeft"]
    },
    **{
        name: InsightsQLFunctionMeta(
            "trimRight",
            1,
            2,
            signatures=[
                ((StringType(),), StringType()),
                ((StringType(), StringType()), StringType()),
            ],
        )
        for name in ["rtrim", "trimRight"]
    },
    **{
        name: InsightsQLFunctionMeta(
            "trim",
            1,
            2,
            signatures=[
                ((StringType(),), StringType()),
                ((StringType(), StringType()), StringType()),
            ],
            case_sensitive=False,
        )
        for name in ["btrim", "trim"]
    },
}

# Combined strings functions
STRINGS_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    **STRING_FUNCTIONS,
    **STRING_SEARCH_FUNCTIONS,
    **STRING_REPLACE_FUNCTIONS,
    **STRING_SPLIT_FUNCTIONS,
    **POSTGRESQL_STRING_FUNCTIONS,
    **POSTGRESQL_TRIM_FUNCTIONS,
}
