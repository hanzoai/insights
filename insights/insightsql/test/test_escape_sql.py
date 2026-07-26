from datetime import datetime

from insights.test.base import BaseTest

from insights.insightsql.errors import QueryError, ResolutionError
from insights.insightsql.escape_sql import (
    escape_datastore_identifier,
    escape_datastore_string,
    escape_insightsql_identifier,
    escape_insightsql_string,
    escape_postgres_identifier,
)

from insights.models.utils import UUIDT


class TestPrintString(BaseTest):
    def test_sanitize_insightsql_identifier(self):
        self.assertEqual(escape_insightsql_identifier("a"), "a")
        self.assertEqual(escape_insightsql_identifier("$browser"), "$browser")
        self.assertEqual(escape_insightsql_identifier("0asd"), "`0asd`")
        self.assertEqual(escape_insightsql_identifier("123"), "`123`")
        self.assertEqual(escape_insightsql_identifier("event"), "event")
        self.assertEqual(escape_insightsql_identifier("a b c"), "`a b c`")
        self.assertEqual(escape_insightsql_identifier("a.b.c"), "`a.b.c`")
        self.assertEqual(escape_insightsql_identifier("a-b-c"), "`a-b-c`")
        self.assertEqual(escape_insightsql_identifier("a#$#"), "`a#$#`")
        self.assertEqual(escape_insightsql_identifier("back`tick"), "`back\\`tick`")
        self.assertEqual(escape_insightsql_identifier("single'quote"), "`single'quote`")
        self.assertEqual(escape_insightsql_identifier('double"quote'), '`double"quote`')
        self.assertEqual(
            escape_insightsql_identifier("other escapes: \b \f \n \t \0 \a \v \\"),
            "`other escapes: \\b \\f \\n \\t \\0 \\a \\v \\\\`",
        )

    def test_sanitize_datastore_identifier(self):
        self.assertEqual(escape_datastore_identifier("a"), "a")
        self.assertEqual(escape_datastore_identifier("$browser"), "`$browser`")
        self.assertEqual(escape_datastore_identifier("0asd"), "`0asd`")
        self.assertEqual(escape_datastore_identifier("123"), "`123`")
        self.assertEqual(escape_datastore_identifier("event"), "event")
        self.assertEqual(escape_datastore_identifier("a b c"), "`a b c`")
        self.assertEqual(escape_datastore_identifier("a.b.c"), "`a.b.c`")
        self.assertEqual(escape_datastore_identifier("a-b-c"), "`a-b-c`")
        self.assertEqual(escape_datastore_identifier("a#$#"), "`a#$#`")
        self.assertEqual(escape_datastore_identifier("back`tick"), "`back\\`tick`")
        self.assertEqual(escape_datastore_identifier("single'quote"), "`single'quote`")
        self.assertEqual(escape_datastore_identifier('double"quote'), '`double"quote`')
        self.assertEqual(
            escape_datastore_identifier("other escapes: \b \f \n \t \0 \a \v \\"),
            "`other escapes: \\b \\f \\n \\t \\0 \\a \\v \\\\`",
        )

    def test_sanitize_postgres_identifier(self):
        self.assertEqual(escape_postgres_identifier("a"), "a")
        self.assertEqual(escape_postgres_identifier("$browser"), '"$browser"')
        self.assertEqual(escape_postgres_identifier("0asd"), '"0asd"')
        self.assertEqual(escape_postgres_identifier("123"), '"123"')
        self.assertEqual(escape_postgres_identifier("event"), "event")
        self.assertEqual(escape_postgres_identifier("a b c"), '"a b c"')
        self.assertEqual(escape_postgres_identifier("a.b.c"), '"a.b.c"')
        self.assertEqual(escape_postgres_identifier("a-b-c"), '"a-b-c"')
        self.assertEqual(escape_postgres_identifier("a#$#"), '"a#$#"')
        self.assertEqual(escape_postgres_identifier("back`tick"), '"back`tick"')
        self.assertEqual(escape_postgres_identifier("single'quote"), '"single\'quote"')
        self.assertEqual(escape_postgres_identifier('double"quote'), '"double""quote"')
        self.assertEqual(
            escape_postgres_identifier("other escapes: \b \f \n \t \0 \a \v \\"),
            '"other escapes: \b \f \n \t \0 \a \v \\"',
        )

    def test_escape_postgres_identifier_length(self):
        identifier_at_max_length = "a" * 63
        self.assertEqual(escape_postgres_identifier(identifier_at_max_length), identifier_at_max_length)

        identifier_exceeding_max_length = "a" * 64
        with self.assertRaises(QueryError) as context:
            escape_postgres_identifier(identifier_exceeding_max_length)
        self.assertIn("is too long. Maximum length is 63 characters", str(context.exception))

    def test_sanitize_datastore_string(self):
        self.assertEqual(escape_datastore_string("a"), "'a'")
        self.assertEqual(escape_datastore_string("$browser"), "'$browser'")
        self.assertEqual(escape_datastore_string("a b c"), "'a b c'")
        self.assertEqual(escape_datastore_string("a#$%#"), "'a#$%#'")
        self.assertEqual(escape_datastore_string("back`tick"), "'back`tick'")
        self.assertEqual(escape_datastore_string("single'quote"), "'single\\'quote'")
        self.assertEqual(escape_datastore_string('double"quote'), "'double\"quote'")
        self.assertEqual(
            escape_datastore_string("other escapes: \b \f \n \t \0 \a \v \\"),
            "'other escapes: \\b \\f \\n \\t \\0 \\a \\v \\\\'",
        )
        self.assertEqual(escape_datastore_string(["list", "things", []]), "['list', 'things', []]")
        self.assertEqual(escape_datastore_string(("tuple", "things", ())), "('tuple', 'things', ())")
        uuid = UUIDT()
        self.assertEqual(escape_datastore_string(uuid), f"toUUIDOrNull('{str(uuid)}')")
        date = datetime.fromisoformat("2020-02-02 02:02:02")
        self.assertEqual(
            escape_datastore_string(date),
            "toDateTime64('2020-02-02 02:02:02.000000', 6, 'UTC')",
        )
        self.assertEqual(
            escape_datastore_string(date, timezone="Europe/Brussels"),
            "toDateTime64('2020-02-02 03:02:02.000000', 6, 'Europe/Brussels')",
        )
        self.assertEqual(escape_datastore_string(date.date()), "toDate('2020-02-02')")
        self.assertEqual(escape_datastore_string(1), "1")
        self.assertEqual(escape_datastore_string(-1), "-1")
        self.assertEqual(escape_datastore_string(float("inf")), "Inf")
        self.assertEqual(escape_datastore_string(float("nan")), "NaN")
        self.assertEqual(escape_datastore_string(float("-inf")), "-Inf")
        self.assertEqual(escape_datastore_string(float("123")), "123.0")
        self.assertEqual(escape_datastore_string(float("123.123")), "123.123")
        self.assertEqual(escape_datastore_string(float("-123.123")), "-123.123")
        self.assertEqual(escape_datastore_string(float("0.000000000000000001")), "1e-18")
        self.assertEqual(
            escape_datastore_string(float("234732482374928374923")),
            "2.3473248237492837e+20",
        )

    def test_sanitize_insightsql_string(self):
        self.assertEqual(escape_insightsql_string("a"), "'a'")
        self.assertEqual(escape_insightsql_string("$browser"), "'$browser'")
        self.assertEqual(escape_insightsql_string("a b c"), "'a b c'")
        self.assertEqual(escape_insightsql_string("a#$%#"), "'a#$%#'")
        self.assertEqual(escape_insightsql_string("back`tick"), "'back`tick'")
        self.assertEqual(escape_insightsql_string("single'quote"), "'single\\'quote'")
        self.assertEqual(escape_insightsql_string('double"quote'), "'double\"quote'")
        self.assertEqual(
            escape_insightsql_string("other escapes: \b \f \n \t \0 \a \v \\"),
            "'other escapes: \\b \\f \\n \\t \\0 \\a \\v \\\\'",
        )
        self.assertEqual(escape_insightsql_string(["list", "things", []]), "['list', 'things', []]")
        self.assertEqual(escape_insightsql_string(("tuple", "things", ())), "('tuple', 'things', ())")
        uuid = UUIDT()
        self.assertEqual(escape_insightsql_string(uuid), f"toUUID('{str(uuid)}')")
        date = datetime.fromisoformat("2020-02-02 02:02:02")
        self.assertEqual(escape_insightsql_string(date), "toDateTime('2020-02-02 02:02:02.000000')")
        self.assertEqual(
            escape_insightsql_string(date, timezone="Europe/Brussels"),
            "toDateTime('2020-02-02 03:02:02.000000')",
        )
        self.assertEqual(escape_insightsql_string(date.date()), "toDate('2020-02-02')")
        self.assertEqual(escape_insightsql_string(1), "1")
        self.assertEqual(escape_insightsql_string(-1), "-1")
        self.assertEqual(escape_insightsql_string(float("inf")), "Inf")
        self.assertEqual(escape_insightsql_string(float("nan")), "NaN")
        self.assertEqual(escape_insightsql_string(float("-inf")), "-Inf")
        self.assertEqual(escape_insightsql_string(float("123")), "123.0")
        self.assertEqual(escape_insightsql_string(float("123.123")), "123.123")
        self.assertEqual(escape_insightsql_string(float("-123.123")), "-123.123")
        self.assertEqual(escape_insightsql_string(float("0.000000000000000001")), "1e-18")
        self.assertEqual(
            escape_insightsql_string(float("234732482374928374923")),
            "2.3473248237492837e+20",
        )

    def test_escape_insightsql_identifier_errors(self):
        with self.assertRaises(QueryError) as context:
            escape_insightsql_identifier("with % percent")
        self.assertTrue(
            'The InsightsQL identifier "with % percent" is not permitted as it contains the "%" character'
            in str(context.exception)
        )

    def test_escape_datastore_identifier_errors(self):
        with self.assertRaises(QueryError) as context:
            escape_datastore_identifier("with % percent")
        self.assertTrue(
            'The InsightsQL identifier "with % percent" is not permitted as it contains the "%" character'
            in str(context.exception)
        )

    def test_escape_datastore_string_errors(self):
        # This test is a stopgap. Think long and hard before adding support for printing dicts or objects.
        # Make sure string escaping happens at the right level, and % is tested through and through.
        with self.assertRaises(ResolutionError) as context:
            escape_datastore_string({"a": 1, "b": 2})  # type: ignore
        self.assertTrue("SQLValueEscaper has no method visit_dict" in str(context.exception))
