from parameterized import parameterized

from insights.git import extract_explicit_repo

REPOS = ["insights/insights", "insights/insights-js", "insights/hanzo.ai"]


class TestExtractExplicitRepo:
    @parameterized.expand(
        [
            ("bare_token", "please fix insights/insights-js now", "insights/insights-js"),
            ("case_insensitive", "look at Insights/Insights-JS", "insights/insights-js"),
            ("dotted_repo_name", "the insights/hanzo.ai site is slow", "insights/hanzo.ai"),
            ("surrounding_punctuation", "is it in `insights/insights`?", "insights/insights"),
            (
                "slack_link_label",
                "see <https://github.com/insights/insights-js|insights/insights-js>",
                "insights/insights-js",
            ),
            ("no_repo_token", "the dashboards are slow", None),
            ("unconnected_repo", "fix acme/widgets please", None),
            ("bare_url_ignored", "https://hanzo.ai/insights is down", None),
        ]
    )
    def test_extracts_matching_repo(self, _name: str, text: str, expected: str | None):
        assert extract_explicit_repo(text, REPOS) == expected

    @parameterized.expand(
        [
            ("empty_text", "", REPOS),
            ("empty_repo_list", "insights/insights", []),
        ]
    )
    def test_returns_none_on_empty_inputs(self, _name: str, text: str, repos: list[str]):
        assert extract_explicit_repo(text, repos) is None
