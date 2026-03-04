from insights.insightsql.ast import ArrayType, BooleanType, DateTimeType, DateType, DecimalType, IntegerType, StringType

from .core import InsightsQLFunctionMeta

INSIGHTSQL_POSTINSIGHTS_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "matchesAction": InsightsQLFunctionMeta("matchesAction", 1, 1),
    "sparkline": InsightsQLFunctionMeta("sparkline", 1, 1),
    "recordingButton": InsightsQLFunctionMeta("recordingButton", 1, 2),
    "explainCSPReport": InsightsQLFunctionMeta("explainCSPReport", 1, 1),
    # Allow case-insensitive matching since people might not know "SemVer" is the right capitalization
    "sortablesemver": InsightsQLFunctionMeta(
        "arrayMap(x -> toInt64OrZero(x),  splitByChar('.', extract(assumeNotNull({}), '(\\d+(\\.\\d+)+)')))",
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
        "uniqueSurveySubmissionsFilter", 1, 1, signatures=[((StringType(),), StringType())]
    ),
}
