from insights.test.base import BaseTest

from parameterized import parameterized

from insights.helpers.markdown_safety import strip_external_links_markdown


class TestStripExternalLinks(BaseTest):
    @parameterized.expand(
        [
            ("no_title", "[x](https://evil.example.com)"),
            ("double_quote_title", '[x](https://evil.example.com "t")'),
            ("single_quote_title", "[x](https://evil.example.com 't')"),
            ("paren_title", "[x](https://evil.example.com (t))"),
            ("bare_url", "visit https://evil.example.com now"),
            # Whitespace before `)` is a valid CommonMark link — it must still be defanged, not
            # slip past both the link rule and the bare-URL rule.
            ("newline_before_paren", "[x](https://evil.example.com\n)"),
            ("space_before_paren", "[x](https://evil.example.com )"),
            # Not a CommonMark link, but the destination URL would otherwise survive bare after `](`.
            ("newline_mid_dest", "[x](https://evil.example.com\nmore)"),
        ]
    )
    def test_non_insights_urls_defanged(self, _label: str, markdown: str) -> None:
        out = strip_external_links_markdown(markdown)
        # The host must never survive as a live link — only inside an inert code span at most.
        self.assertNotIn("](https://evil.example.com", out)
        self.assertNotIn("(https://evil.example.com", out)

    def test_orphan_dest_backticks_without_adding_a_paren(self) -> None:
        # The orphan-dest rule wraps only the URL; the source markdown's own `)` balances the `(`,
        # so the defanged output must not gain a second closing paren.
        out = strip_external_links_markdown("[x](https://evil.example.com\nmore)")
        self.assertEqual(out, "[x](`https://evil.example.com`\nmore)")

    @parameterized.expand(
        [
            ("plain", "[docs](https://hanzo.ai/docs)"),
            ("trailing_space", "[docs](https://hanzo.ai/docs )"),
        ]
    )
    def test_insights_links_preserved(self, _label: str, markdown: str) -> None:
        out = strip_external_links_markdown(markdown)
        self.assertIn("https://hanzo.ai/docs", out)
