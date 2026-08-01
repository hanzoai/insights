"""Tests for render_insightsql_example."""

from __future__ import annotations

import pytest
from insights.test.base import BaseTest
from unittest.mock import MagicMock, patch

import products.insights_ai.scripts.insightsql_example as insightsql_example_module
from products.insights_ai.scripts.insightsql_example import render_insightsql_example

SAMPLE_QUERY = {"kind": "TrendsQuery", "series": [{"kind": "EventsNode", "event": "$pageview"}]}


@pytest.fixture(autouse=True)
def _reset_cached_team() -> None:
    insightsql_example_module._cached_team = None


@patch("django.conf.settings.DEBUG", False)
def test_raises_when_debug_is_false() -> None:
    with pytest.raises(RuntimeError, match="only available when DEBUG=True"):
        render_insightsql_example(SAMPLE_QUERY)


@patch("django.conf.settings.DEBUG", True)
@patch("insights.models.team.Team.objects.first", return_value=None)
def test_raises_when_no_team(_mock_first: MagicMock) -> None:
    with pytest.raises(RuntimeError, match="requires at least one Team"):
        render_insightsql_example(SAMPLE_QUERY)


class TestRenderInsightsQLExample(BaseTest):
    """End-to-end tests that exercise the real query runner pipeline.

    These guard against regressions where the rendered InsightsQL would silently
    drift to wall-clock time, or where the renderer would corrupt global
    process state (the freezegun bug we replaced with `pin_now`).
    """

    def setUp(self) -> None:
        super().setUp()
        insightsql_example_module._cached_team = None

    @patch("django.conf.settings.DEBUG", True)
    def test_trends_relative_range_pins_to_frozen_time(self) -> None:
        # FROZEN_TIME = 2025-12-10. -7d should anchor to 2025-12-03.
        result = render_insightsql_example(
            {
                "kind": "TrendsQuery",
                "series": [{"kind": "EventsNode", "event": "$pageview"}],
                "dateRange": {"date_from": "-7d"},
            }
        )

        assert "2025-12-10" in result
        assert "2025-12-03" in result

    @patch("django.conf.settings.DEBUG", True)
    def test_funnel_pins_context_now_for_sub_date_ranges(self) -> None:
        # FunnelsQuery's sub-helpers read `context.now` rather than the runner's
        # query_date_range, so this guards the context-pinning branch of
        # `_pin_runner_now`.
        result = render_insightsql_example(
            {
                "kind": "FunnelsQuery",
                "series": [
                    {"kind": "EventsNode", "event": "$pageview"},
                    {"kind": "EventsNode", "event": "user signed up"},
                ],
                "dateRange": {"date_from": "-7d"},
            }
        )

        assert "2025-12-10" in result
        assert "2025-12-03" in result

    @patch("django.conf.settings.DEBUG", True)
    def test_render_does_not_use_freezegun(self) -> None:
        # The bug: freezegun was used to set `now` for relative date ranges,
        # but it monkey-patches `datetime.datetime` process-globally. Concurrent
        # code (Temporal activities, Django request handlers) calling
        # `timezone.now()` during the freeze races with `tz_offsets.pop()` on
        # exit, crashing with `IndexError: list index out of range`.
        #
        # Single-threaded tests can't observe the race directly because the
        # freeze cleans up before assertions run. Instead, assert the renderer
        # never enters `freeze_time` at all — that's the only safe contract.
        import freezegun

        def _explode(*args: object, **kwargs: object) -> object:
            raise AssertionError(
                "render_insightsql_example called freezegun.freeze_time — this monkey-patches "
                "datetime globally and crashes concurrent workers. Use _pin_runner_now instead."
            )

        with patch.object(freezegun, "freeze_time", _explode):
            render_insightsql_example(
                {
                    "kind": "TrendsQuery",
                    "series": [{"kind": "EventsNode", "event": "$pageview"}],
                    "dateRange": {"date_from": "-7d"},
                }
            )

    @patch("django.conf.settings.DEBUG", True)
    def test_output_is_deterministic_across_calls(self) -> None:
        query = {
            "kind": "TrendsQuery",
            "series": [{"kind": "EventsNode", "event": "$pageview"}],
            "dateRange": {"date_from": "-30d"},
        }

        first = render_insightsql_example(query)
        second = render_insightsql_example(query)

        assert first == second


class TestRenderInsightsQLExampleMocked:
    """Cheap mock-based tests for control-flow branches that don't need a DB."""

    @patch("insights.insightsql.printer.utils.to_printed_insightsql", return_value="SELECT 1")
    @patch("insights.insightsql.filters.replace_filters")
    @patch("insights.insightsql_queries.query_runner.get_query_runner")
    @patch("insights.models.team.Team.objects.first")
    @patch("django.conf.settings.DEBUG", True)
    def test_caches_team_across_calls(
        self,
        mock_first: MagicMock,
        mock_get_runner: MagicMock,
        _mock_replace_filters: MagicMock,
        _mock_to_insightsql: MagicMock,
    ) -> None:
        fake_team = MagicMock()
        mock_first.return_value = fake_team
        mock_get_runner.return_value = MagicMock()

        render_insightsql_example(SAMPLE_QUERY)
        render_insightsql_example(SAMPLE_QUERY)

        mock_first.assert_called_once()
