from insights.insightsql.ast import ArrayType, BooleanType, DateTimeType, DateType, DecimalType, IntegerType, StringType

from .core import InsightsQLFunctionMeta

INSIGHTSQL_POSTFN_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "matchesAction": InsightsQLFunctionMeta("matchesAction", 1, 1),
    "sparkline": InsightsQLFunctionMeta("sparkline", 1, 1),
    "recordingButton": InsightsQLFunctionMeta("recordingButton", 1, 2),
    "explainCSPReport": InsightsQLFunctionMeta("explainCSPReport", 1, 1),
    # Allow case-insensitive matching since people might not know "SemVer" is the right capitalization.
    # The regex strictly validates X.Y.Z with no leading zeros (matching the Rust `semver` crate
    # used for flag evaluation), optionally prefixed with 'v' and optionally suffixed with a
    # pre-release or build identifier. Invalid input falls out of `extract` as an empty string,
    # which `splitByChar` would turn into `[]` (empty) — and `[] < [1,2,3]` is true in Datastore,
    # which would silently include invalid versions in `< filter` queries (exactly the bug we're
    # fixing). So we substitute a sentinel `'_'` for the empty-extract case via `nullIf` +
    # `coalesce`, which `toInt64OrNull` then maps to `NULL`. Invalid input becomes `[NULL]`, type
    # `Array(Nullable(Int64))` — Datastore accepts this (unlike `Nullable(Array(...))`).
    # Element-wise array comparison propagates NULL through any operator (>, >=, <, <=, =, !=),
    # so invalid versions are excluded from every semver filter — matching Rust's behavior.
    "sortablesemver": InsightsQLFunctionMeta(
        "arrayMap(x -> toInt64OrNull(x), splitByChar('.', coalesce(nullIf(extract(assumeNotNull({}), '^\\\\s*v?((0|[1-9]\\\\d*)\\\\.(0|[1-9]\\\\d*)\\\\.(0|[1-9]\\\\d*))(?:[-+][^\\\\s]*)?\\\\s*$'), ''), '_')))",
        1,
        1,
        case_sensitive=False,
        signatures=[((StringType(),), ArrayType(item_type=IntegerType()))],
    ),
    "embedText": InsightsQLFunctionMeta("embedText", 1, 2),
    # insights/models/channel_type/sql.py and insights/insightsql/database/schema/channel_type.py
    "lookupDomainType": InsightsQLFunctionMeta("lookupDomainType", 1, 1),
    "lookupPaidSourceType": InsightsQLFunctionMeta("lookupPaidSourceType", 1, 1),
    "lookupPaidMediumType": InsightsQLFunctionMeta("lookupPaidMediumType", 1, 1),
    "lookupOrganicSourceType": InsightsQLFunctionMeta("lookupOrganicSourceType", 1, 1),
    "lookupOrganicMediumType": InsightsQLFunctionMeta("lookupOrganicMediumType", 1, 1),
    # Expanded to SQL in the resolver's visit_call; these never map to a real CH function. (The
    # bot/traffic-type functions are registered further down; the resolver expands them too.)
    "_defaultChannelType": InsightsQLFunctionMeta("_defaultChannelType", 7, 7),
    "_domainType": InsightsQLFunctionMeta("_domainType", 1, 1),
    # insights/models/exchange_rate/sql.py
    # convertCurrency(from_currency, to_currency, amount, timestamp?)
    "convertCurrency": InsightsQLFunctionMeta(
        "convertCurrency",
        3,
        4,
        signatures=[
            (
                (
                    StringType(),
                    StringType(),
                    DecimalType(),
                ),
                DecimalType(),
            ),
            (
                (
                    StringType(),
                    StringType(),
                    DecimalType(),
                    DateType(),
                ),
                DecimalType(),
            ),
            (
                (
                    StringType(),
                    StringType(),
                    DecimalType(),
                    DateTimeType(),
                ),
                DecimalType(),
            ),
        ],
    ),
    # survey functions
    "getSurveyResponse": InsightsQLFunctionMeta(
        "getSurveyResponse", 1, 3, signatures=[((IntegerType(), StringType(), BooleanType()), StringType())]
    ),
    "uniqueSurveySubmissionsFilter": InsightsQLFunctionMeta(
        "uniqueSurveySubmissionsFilter",
        1,
        3,
        signatures=[
            ((StringType(),), StringType()),
            ((StringType(), StringType()), StringType()),
            ((StringType(), DateTimeType()), StringType()),
            ((StringType(), StringType(), StringType()), StringType()),
            ((StringType(), StringType(), DateTimeType()), StringType()),
            ((StringType(), DateTimeType(), StringType()), StringType()),
            ((StringType(), DateTimeType(), DateTimeType()), StringType()),
        ],
    ),
    # Bot / traffic-type classification functions. The optional second argument is the
    # client IP, matched against operator-published bot IP ranges.
    "getTrafficType": InsightsQLFunctionMeta(
        "getTrafficType",
        1,
        2,
        signatures=[((StringType(),), StringType()), ((StringType(), StringType()), StringType())],
    ),
    "getTrafficCategory": InsightsQLFunctionMeta(
        "getTrafficCategory",
        1,
        2,
        signatures=[((StringType(),), StringType()), ((StringType(), StringType()), StringType())],
    ),
    "isLikelyBot": InsightsQLFunctionMeta(
        "isLikelyBot",
        1,
        2,
        signatures=[((StringType(),), BooleanType()), ((StringType(), StringType()), BooleanType())],
    ),
    "getBotType": InsightsQLFunctionMeta(
        "getBotType",
        1,
        2,
        signatures=[((StringType(),), StringType()), ((StringType(), StringType()), StringType())],
    ),
    "getBotName": InsightsQLFunctionMeta(
        "getBotName",
        1,
        2,
        signatures=[((StringType(),), StringType()), ((StringType(), StringType()), StringType())],
    ),
    "getBotOperator": InsightsQLFunctionMeta(
        "getBotOperator",
        1,
        2,
        signatures=[((StringType(),), StringType()), ((StringType(), StringType()), StringType())],
    ),
    # Deprecated __preview_* aliases — kept so ad-hoc queries written against the preview names keep working.
    "__preview_getTrafficType": InsightsQLFunctionMeta(
        "__preview_getTrafficType", 1, 1, signatures=[((StringType(),), StringType())]
    ),
    "__preview_getTrafficCategory": InsightsQLFunctionMeta(
        "__preview_getTrafficCategory", 1, 1, signatures=[((StringType(),), StringType())]
    ),
    "__preview_isBot": InsightsQLFunctionMeta("__preview_isBot", 1, 1, signatures=[((StringType(),), BooleanType())]),
    "__preview_getBotType": InsightsQLFunctionMeta(
        "__preview_getBotType", 1, 1, signatures=[((StringType(),), StringType())]
    ),
    "__preview_getBotName": InsightsQLFunctionMeta(
        "__preview_getBotName", 1, 1, signatures=[((StringType(),), StringType())]
    ),
    "__preview_getBotOperator": InsightsQLFunctionMeta(
        "__preview_getBotOperator", 1, 1, signatures=[((StringType(),), StringType())]
    ),
}
