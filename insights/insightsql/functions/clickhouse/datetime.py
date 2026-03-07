from insights.insightsql.ast import (
    DateTimeType,
    DateType,
    FloatType,
    IntegerType,
    IntervalType,
    StringLiteralType,
    StringType,
)
from insights.insightsql.base import UnknownType

from ..core import InsightsQLFunctionMeta

DATE_TRUNCATION_UNITS = frozenset({"year", "quarter", "month", "week"})

# dates and times
# Keep in sync with the hanzo.ai repository: contents/docs/sql/clickhouse-functions.mdx
DATETIME_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "timeZoneOf": InsightsQLFunctionMeta("timeZoneOf", 1, 1),
    "timeZoneOffset": InsightsQLFunctionMeta("timeZoneOffset", 1, 1),
    "toYear": InsightsQLFunctionMeta("toYear", 1, 1),
    "toQuarter": InsightsQLFunctionMeta("toQuarter", 1, 1),
    "toMonth": InsightsQLFunctionMeta("toMonth", 1, 1),
    "toDayOfYear": InsightsQLFunctionMeta("toDayOfYear", 1, 1),
    "toDayOfMonth": InsightsQLFunctionMeta("toDayOfMonth", 1, 1),
    "toDayOfWeek": InsightsQLFunctionMeta("toDayOfWeek", 1, 3),
    "toHour": InsightsQLFunctionMeta("toHour", 1, 1),
    "toMinute": InsightsQLFunctionMeta("toMinute", 1, 1),
    "toSecond": InsightsQLFunctionMeta("toSecond", 1, 1),
    "toUnixTimestamp": InsightsQLFunctionMeta("toUnixTimestamp", 1, 2),
    "toUnixTimestamp64Milli": InsightsQLFunctionMeta("toUnixTimestamp64Milli", 1, 1),
    "fromUnixTimestamp64Milli": InsightsQLFunctionMeta("fromUnixTimestamp64Milli", 1, 1),
    "toStartOfInterval": InsightsQLFunctionMeta(
        "toStartOfInterval",
        2,
        3,
        signatures=[
            ((DateTimeType(), IntervalType()), DateTimeType()),
            ((DateTimeType(), IntervalType(), DateTimeType()), DateTimeType()),
        ],
    ),
    "toStartOfYear": InsightsQLFunctionMeta("toStartOfYear", 1, 1),
    "toStartOfISOYear": InsightsQLFunctionMeta("toStartOfISOYear", 1, 1),
    "toStartOfQuarter": InsightsQLFunctionMeta("toStartOfQuarter", 1, 1),
    "toStartOfMonth": InsightsQLFunctionMeta(
        "toStartOfMonth",
        1,
        1,
        signatures=[
            ((UnknownType(),), DateType()),
        ],
    ),
    "toLastDayOfMonth": InsightsQLFunctionMeta("toLastDayOfMonth", 1, 1),
    "toMonday": InsightsQLFunctionMeta("toMonday", 1, 1),
    "toStartOfWeek": InsightsQLFunctionMeta(
        "toStartOfWeek",
        1,
        2,
        signatures=[
            ((UnknownType(),), DateType()),
            ((UnknownType(), UnknownType()), DateType()),
        ],
    ),
    "toStartOfDay": InsightsQLFunctionMeta(
        "toStartOfDay",
        1,
        2,
        signatures=[
            ((UnknownType(),), DateTimeType()),
            ((UnknownType(), UnknownType()), DateTimeType()),
        ],
    ),
    "toLastDayOfWeek": InsightsQLFunctionMeta("toLastDayOfWeek", 1, 2),
    "toStartOfHour": InsightsQLFunctionMeta(
        "toStartOfHour",
        1,
        1,
        signatures=[
            ((UnknownType(),), DateTimeType()),
        ],
    ),
    "toStartOfMinute": InsightsQLFunctionMeta(
        "toStartOfMinute",
        1,
        1,
        signatures=[
            ((UnknownType(),), DateTimeType()),
        ],
    ),
    "toStartOfSecond": InsightsQLFunctionMeta(
        "toStartOfSecond",
        1,
        1,
        signatures=[
            ((UnknownType(),), DateTimeType()),
        ],
    ),
    "toStartOfFiveMinutes": InsightsQLFunctionMeta("toStartOfFiveMinutes", 1, 1),
    "toStartOfTenMinutes": InsightsQLFunctionMeta("toStartOfTenMinutes", 1, 1),
    "toStartOfFifteenMinutes": InsightsQLFunctionMeta("toStartOfFifteenMinutes", 1, 1),
    "toTime": InsightsQLFunctionMeta("toTime", 1, 1),
    "toISOYear": InsightsQLFunctionMeta("toISOYear", 1, 1),
    "toISOWeek": InsightsQLFunctionMeta("toISOWeek", 1, 1),
    "toWeek": InsightsQLFunctionMeta("toWeek", 1, 3),
    "toYearWeek": InsightsQLFunctionMeta("toYearWeek", 1, 3),
    "age": InsightsQLFunctionMeta("age", 3, 3),
    "dateAdd": InsightsQLFunctionMeta(
        "dateAdd",
        2,
        3,
        signatures=[
            ((DateType(), UnknownType()), DateType()),
            ((StringType(), UnknownType(), DateType()), DateType()),
        ],
    ),
    "dateSub": InsightsQLFunctionMeta(
        "dateSub",
        2,
        3,
        signatures=[
            ((DateType(), UnknownType()), DateType()),
            ((StringType(), UnknownType(), DateType()), DateType()),
        ],
    ),
    "date_bin": InsightsQLFunctionMeta(
        "toStartOfInterval({1}, {0}, {2})",
        3,
        3,
        tz_aware=True,
        signatures=[
            ((IntervalType(), DateTimeType(), DateTimeType()), DateTimeType()),
        ],
        using_placeholder_arguments=True,
        using_positional_arguments=True,
    ),
    "date_add": InsightsQLFunctionMeta(
        "date_add",
        2,
        2,
        tz_aware=True,
        signatures=[
            ((DateTimeType(), IntervalType()), DateTimeType()),
        ],
    ),
    "date_subtract": InsightsQLFunctionMeta(
        "date_sub",
        2,
        2,
        tz_aware=True,
        signatures=[
            ((DateTimeType(), IntervalType()), DateTimeType()),
        ],
    ),
    **{
        name: InsightsQLFunctionMeta(
            "dateDiff",
            3,
            3,
            signatures=[
                ((StringType(), DateTimeType(), DateTimeType()), IntegerType()),
            ],
        )
        for name in ["date_diff", "dateDiff"]
    },
    "timeStampAdd": InsightsQLFunctionMeta("timeStampAdd", 2, 2),
    "timeStampSub": InsightsQLFunctionMeta("timeStampSub", 2, 2),
    "nowInBlock": InsightsQLFunctionMeta("nowInBlock", 1, 1),
    "rowNumberInBlock": InsightsQLFunctionMeta("rowNumberInBlock", 0, 0),
    "rowNumberInAllBlocks": InsightsQLFunctionMeta("rowNumberInAllBlocks", 0, 0),
    "timeSlot": InsightsQLFunctionMeta("timeSlot", 1, 1),
    "toYYYYMM": InsightsQLFunctionMeta("toYYYYMM", 1, 1),
    "toYYYYMMDD": InsightsQLFunctionMeta("toYYYYMMDD", 1, 1),
    "toYYYYMMDDhhmmss": InsightsQLFunctionMeta("toYYYYMMDDhhmmss", 1, 1),
    "addYears": InsightsQLFunctionMeta("addYears", 2, 2),
    "addMonths": InsightsQLFunctionMeta("addMonths", 2, 2),
    "addWeeks": InsightsQLFunctionMeta("addWeeks", 2, 2),
    "addDays": InsightsQLFunctionMeta(
        "addDays",
        2,
        2,
        signatures=[
            ((DateType(), IntegerType()), DateType()),
            ((DateType(), FloatType()), DateType()),
            ((DateTimeType(), IntegerType()), DateTimeType()),
            ((DateTimeType(), FloatType()), DateTimeType()),
        ],
    ),
    "addHours": InsightsQLFunctionMeta("addHours", 2, 2),
    "addMinutes": InsightsQLFunctionMeta("addMinutes", 2, 2),
    "addSeconds": InsightsQLFunctionMeta("addSeconds", 2, 2),
    "addQuarters": InsightsQLFunctionMeta("addQuarters", 2, 2),
    "subtractYears": InsightsQLFunctionMeta("subtractYears", 2, 2),
    "subtractMonths": InsightsQLFunctionMeta("subtractMonths", 2, 2),
    "subtractWeeks": InsightsQLFunctionMeta("subtractWeeks", 2, 2),
    "subtractDays": InsightsQLFunctionMeta("subtractDays", 2, 2),
    "subtractHours": InsightsQLFunctionMeta("subtractHours", 2, 2),
    "subtractMinutes": InsightsQLFunctionMeta("subtractMinutes", 2, 2),
    "subtractSeconds": InsightsQLFunctionMeta("subtractSeconds", 2, 2),
    "subtractQuarters": InsightsQLFunctionMeta("subtractQuarters", 2, 2),
    "timeSlots": InsightsQLFunctionMeta("timeSlots", 2, 3),
    "formatDateTime": InsightsQLFunctionMeta("formatDateTime", 2, 3),
    "dateName": InsightsQLFunctionMeta("dateName", 2, 2),
    "monthName": InsightsQLFunctionMeta("monthName", 1, 1),
    "fromUnixTimestamp": InsightsQLFunctionMeta(
        "fromUnixTimestamp",
        1,
        1,
        signatures=[
            ((IntegerType(),), DateTimeType()),
        ],
    ),
    "toModifiedJulianDay": InsightsQLFunctionMeta("toModifiedJulianDayOrNull", 1, 1),
    "fromModifiedJulianDay": InsightsQLFunctionMeta("fromModifiedJulianDayOrNull", 1, 1),
}

# Keep in sync with the hanzo.ai repository: contents/docs/sql/clickhouse-functions.mdx
DATE_GENERATOR_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "now": InsightsQLFunctionMeta(
        "now64",
        0,
        1,
        tz_aware=True,
        case_sensitive=False,
        signatures=[
            ((), DateTimeType(nullable=False)),
            ((UnknownType(),), DateTimeType(nullable=False)),
        ],
    ),
    "yesterday": InsightsQLFunctionMeta(
        "yesterday",
        0,
        0,
        signatures=[
            ((), DateType(nullable=False)),
        ],
    ),
    "current_timestamp": InsightsQLFunctionMeta(
        "now64",
        0,
        0,
        tz_aware=True,
        signatures=[
            ((), DateTimeType(nullable=False)),
        ],
    ),
    **{
        name: InsightsQLFunctionMeta(
            "today",
            0,
            0,
            signatures=[
                ((), DateType(nullable=False)),
            ],
        )
        for name in ["today", "current_date"]
    },
}

# Interval functions
# Keep in sync with the hanzo.ai repository: contents/docs/sql/clickhouse-functions.mdx
INTERVAL_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "toIntervalSecond": InsightsQLFunctionMeta(
        "toIntervalSecond",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntervalType()),
        ],
    ),
    "toIntervalMinute": InsightsQLFunctionMeta(
        "toIntervalMinute",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntervalType()),
        ],
    ),
    "toIntervalHour": InsightsQLFunctionMeta(
        "toIntervalHour",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntervalType()),
        ],
    ),
    "toIntervalDay": InsightsQLFunctionMeta(
        "toIntervalDay",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntervalType()),
        ],
    ),
    "toIntervalWeek": InsightsQLFunctionMeta(
        "toIntervalWeek",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntervalType()),
        ],
    ),
    "toIntervalMonth": InsightsQLFunctionMeta(
        "toIntervalMonth",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntervalType()),
        ],
    ),
    "toIntervalQuarter": InsightsQLFunctionMeta(
        "toIntervalQuarter",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntervalType()),
        ],
    ),
    "toIntervalYear": InsightsQLFunctionMeta(
        "toIntervalYear",
        1,
        1,
        signatures=[
            ((IntegerType(),), IntervalType()),
        ],
    ),
}

# Keep in sync with the hanzo.ai repository: contents/docs/sql/clickhouse-functions.mdx
POSTGRESQL_DATETIME_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    # PostgreSQL-style date/time functions
    "date_part": InsightsQLFunctionMeta(
        "arrayElement(arrayMap((part, dt) -> multiIf(part = 'year', toYear(dt), part = 'month', toMonth(dt), part = 'day', toDayOfMonth(dt), part = 'hour', toHour(dt), part = 'minute', toMinute(dt), part = 'second', toSecond(dt), part = 'dow', toDayOfWeek(dt), part = 'doy', toDayOfYear(dt), part = 'quarter', toQuarter(dt), null), [{0}], [{1}]), 1)",
        # Maps to same implementation as extract
        2,
        2,
        signatures=[
            ((StringType(), DateTimeType()), IntegerType()),
            ((StringType(), DateType()), IntegerType()),
        ],
        using_placeholder_arguments=True,
        using_positional_arguments=True,
    ),
    **{
        name: InsightsQLFunctionMeta(
            "dateTrunc",
            2,
            3,  # Allow optional timezone parameter
            signatures=[
                # Units that return Date (year/quarter/month/week)
                ((StringLiteralType(values=DATE_TRUNCATION_UNITS), DateTimeType()), DateType()),
                ((StringLiteralType(values=DATE_TRUNCATION_UNITS), DateTimeType(), StringType()), DateType()),
                ((StringLiteralType(values=DATE_TRUNCATION_UNITS), DateType()), DateType()),
                ((StringLiteralType(values=DATE_TRUNCATION_UNITS), DateType(), StringType()), DateType()),
                # All other units (day/hour/minute/second) return DateTime
                ((StringType(), DateTimeType()), DateTimeType()),
                ((StringType(), DateTimeType(), StringType()), DateTimeType()),
                ((StringType(), DateType()), DateType()),
                ((StringType(), DateType(), StringType()), DateType()),
            ],
        )
        for name in ["date_trunc", "dateTrunc"]
    },
    "to_timestamp": InsightsQLFunctionMeta(
        "toDateTime(fromUnixTimestamp({}))",
        1,
        2,
        tz_aware=True,
        signatures=[
            ((IntegerType(),), DateTimeType()),
            ((FloatType(),), DateTimeType()),
        ],
        using_placeholder_arguments=True,
    ),
    "to_char": InsightsQLFunctionMeta(
        "formatDateTime",
        2,
        3,
        tz_aware=True,
        signatures=[
            ((DateTimeType(), StringType()), StringType()),
            ((DateTimeType(), StringType(), StringType()), StringType()),
        ],
    ),
    "make_timestamp": InsightsQLFunctionMeta(
        "makeDateTime",
        6,
        7,
        tz_aware=True,
        signatures=[
            ((IntegerType(), IntegerType(), IntegerType(), IntegerType(), IntegerType(), FloatType()), DateTimeType()),
            (
                (IntegerType(), IntegerType(), IntegerType(), IntegerType(), IntegerType(), FloatType(), StringType()),
                DateTimeType(),
            ),
        ],
    ),
    "make_date": InsightsQLFunctionMeta(
        "makeDate",
        3,
        3,
        signatures=[
            ((IntegerType(), IntegerType(), IntegerType()), DateType()),
        ],
    ),
    "date_bin": InsightsQLFunctionMeta(
        "toStartOfInterval({1}, {0}, {2})",
        3,
        3,
        tz_aware=True,
        signatures=[
            ((IntervalType(), DateTimeType(), DateTimeType()), DateTimeType()),
        ],
        using_placeholder_arguments=True,
        using_positional_arguments=True,
    ),
    "date_add": InsightsQLFunctionMeta(
        "date_add",
        2,
        2,
        tz_aware=True,
        signatures=[
            ((DateTimeType(), IntervalType()), DateTimeType()),
        ],
    ),
    "date_subtract": InsightsQLFunctionMeta(
        "date_sub",
        2,
        2,
        tz_aware=True,
        signatures=[
            ((DateTimeType(), IntervalType()), DateTimeType()),
        ],
    ),
    **{
        name: InsightsQLFunctionMeta(
            "dateDiff",
            3,
            3,
            signatures=[
                ((StringType(), DateTimeType(), DateTimeType()), IntegerType()),
            ],
        )
        for name in ["date_diff", "dateDiff"]
    },
    "make_interval": InsightsQLFunctionMeta(
        "toIntervalYear({}) + toIntervalMonth({}) + toIntervalDay({}) + toIntervalHour({}) + toIntervalMinute({}) + toIntervalSecond({})",
        # Changed from makeInterval to addInterval
        6,
        6,
        signatures=[
            (
                (IntegerType(), IntegerType(), IntegerType(), IntegerType(), IntegerType(), IntegerType()),
                DateTimeType(),
            ),
        ],
        using_placeholder_arguments=True,
    ),
    # Clickhouse doesn't have a TIME type, so this would be the alternative
    # "make_time": InsightsQLFunctionMeta(
    #     "toTime(makeDateTime(1970, 1, 1, {}, {}, {}))",
    #     3,
    #     3,
    #     signatures=[((IntegerType(), IntegerType(), FloatType()), DateTimeType())],
    # ),
    "make_timestamptz": InsightsQLFunctionMeta(
        "toTimeZone(makeDateTime({}, {}, {}, {}, {}, {}), {})",
        7,
        7,
        signatures=[
            (
                (IntegerType(), IntegerType(), IntegerType(), IntegerType(), IntegerType(), FloatType(), StringType()),
                DateTimeType(),
            ),
        ],
        tz_aware=True,
        using_placeholder_arguments=True,
    ),
    "timezone": InsightsQLFunctionMeta(
        "toTimeZone({1}, {0})",
        2,
        2,
        signatures=[((StringType(), DateTimeType()), DateTimeType())],
        tz_aware=True,
        using_placeholder_arguments=True,
        using_positional_arguments=True,
    ),
    "toTimeZone": InsightsQLFunctionMeta(
        "toTimeZone",
        1,
        2,
        tz_aware=True,
        signatures=[
            ((DateTimeType(), StringType()), DateTimeType()),
        ],
    ),
}

# Combined datetime functions
DATETIME_AND_INTERVAL_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    **DATETIME_FUNCTIONS,
    **INTERVAL_FUNCTIONS,
    **DATE_GENERATOR_FUNCTIONS,
    **POSTGRESQL_DATETIME_FUNCTIONS,
}
