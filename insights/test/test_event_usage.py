from types import SimpleNamespace

import pytest
from insights.test.base import BaseTest
from unittest.mock import patch

from parameterized import parameterized
from rest_framework.test import APIRequestFactory

from insights.datastore.query_tagging import AccessMethod, tags_context
from insights.event_usage import (
    EventSource,
    get_event_source,
    get_mcp_properties,
    is_wizard_self_driving_program,
    report_user_action,
    sanitize_header_value,
)


class TestReportUserAction(BaseTest):
    @parameterized.expand(
        [
            (
                "includes_all_request_properties",
                {"Referer": "http://app.hanzo.ai/insights", "X-Insights-Session-Id": "sess-123"},
                None,
                {
                    "source": "api",
                    "$current_url": "http://app.hanzo.ai/insights",
                    "$host": "app.hanzo.ai",
                    "$pathname": "/insights",
                    "$session_id": "sess-123",
                    "was_impersonated": False,
                    "access_method": None,
                    "user_agent": None,
                    "mcp_user_agent": None,
                    "mcp_client_name": None,
                    "mcp_client_version": None,
                    "mcp_protocol_version": None,
                    "mcp_oauth_client_name": None,
                },
            ),
            (
                "includes_mcp_user_agent_from_header",
                {
                    "Referer": "http://app.hanzo.ai/insights",
                    "X-Insights-Session-Id": "sess-123",
                    "X-Insights-Mcp-User-Agent": "insights/cursor 1.0",
                },
                None,
                {
                    "source": "api",
                    "$current_url": "http://app.hanzo.ai/insights",
                    "$host": "app.hanzo.ai",
                    "$pathname": "/insights",
                    "$session_id": "sess-123",
                    "was_impersonated": False,
                    "access_method": None,
                    "user_agent": None,
                    "mcp_user_agent": "insights/cursor 1.0",
                    "mcp_client_name": None,
                    "mcp_client_version": None,
                    "mcp_protocol_version": None,
                    "mcp_oauth_client_name": None,
                },
            ),
            (
                "includes_mcp_client_info_from_headers",
                {
                    "X-Insights-Mcp-Client-Name": "claude-code",
                    "X-Insights-Mcp-Client-Version": "1.2.3",
                    "X-Insights-Mcp-Protocol-Version": "2025-03-26",
                    "X-Insights-Mcp-Oauth-Client-Name": "Claude Code (insights)",
                },
                None,
                {
                    "source": "api",
                    "$current_url": None,
                    "$host": None,
                    "$pathname": None,
                    "$session_id": None,
                    "was_impersonated": False,
                    "access_method": None,
                    "user_agent": None,
                    "mcp_user_agent": None,
                    "mcp_client_name": "claude-code",
                    "mcp_client_version": "1.2.3",
                    "mcp_protocol_version": "2025-03-26",
                    "mcp_oauth_client_name": "Claude Code (insights)",
                },
            ),
            (
                "merges_with_explicit_properties",
                {"Referer": "http://app.hanzo.ai/insights", "X-Insights-Session-Id": "sess-123"},
                {"key": "val"},
                {
                    "source": "api",
                    "$current_url": "http://app.hanzo.ai/insights",
                    "$host": "app.hanzo.ai",
                    "$pathname": "/insights",
                    "$session_id": "sess-123",
                    "was_impersonated": False,
                    "access_method": None,
                    "user_agent": None,
                    "mcp_user_agent": None,
                    "mcp_client_name": None,
                    "mcp_client_version": None,
                    "mcp_protocol_version": None,
                    "mcp_oauth_client_name": None,
                    "key": "val",
                },
            ),
            (
                "explicit_properties_take_precedence",
                {"Referer": "http://app.hanzo.ai/insights", "X-Insights-Session-Id": "sess-123"},
                {"source": "terraform", "$current_url": "override"},
                {
                    "source": "terraform",
                    "$current_url": "override",
                    "$host": "app.hanzo.ai",
                    "$pathname": "/insights",
                    "$session_id": "sess-123",
                    "was_impersonated": False,
                    "access_method": None,
                    "user_agent": None,
                    "mcp_user_agent": None,
                    "mcp_client_name": None,
                    "mcp_client_version": None,
                    "mcp_protocol_version": None,
                    "mcp_oauth_client_name": None,
                },
            ),
            (
                "handles_missing_headers",
                {},
                {"key": "val"},
                {
                    "source": "api",
                    "$current_url": None,
                    "$host": None,
                    "$pathname": None,
                    "$session_id": None,
                    "was_impersonated": False,
                    "access_method": None,
                    "user_agent": None,
                    "mcp_user_agent": None,
                    "mcp_client_name": None,
                    "mcp_client_version": None,
                    "mcp_protocol_version": None,
                    "mcp_oauth_client_name": None,
                    "key": "val",
                },
            ),
        ]
    )
    @patch("insights.event_usage.hanzo_insights.capture")
    def test_request_properties_reach_capture(
        self, _name, headers, explicit_properties, expected_properties, mock_capture
    ):
        factory = APIRequestFactory()
        request = factory.get("/fake", headers=headers)

        report_user_action(
            self.user,
            "test event",
            properties=explicit_properties,
            request=request,
        )

        mock_capture.assert_called_once()
        captured_props = mock_capture.call_args[1]["properties"]
        assert captured_props == {**expected_properties, "$set_once": {"email": self.user.email}}

    @parameterized.expand(
        [
            ("plain", "claude-code/1.2.3", "claude-code/1.2.3"),
            ("control_chars_stripped", "claude-code/1.2.3\r\nX-Evil: 1", "claude-code/1.2.3X-Evil: 1"),
        ]
    )
    @patch("insights.event_usage.hanzo_insights.capture")
    def test_user_agent_header_reaches_capture(self, _name, header_value, expected, mock_capture):
        factory = APIRequestFactory()
        request = factory.get("/fake", headers={"User-Agent": header_value})

        report_user_action(self.user, "test event", request=request)

        assert mock_capture.call_args[1]["properties"]["user_agent"] == expected

    @parameterized.expand(
        [
            ("personal_api_key", AccessMethod.PERSONAL_API_KEY, "personal_api_key"),
            ("oauth", AccessMethod.OAUTH, "oauth"),
            ("id_jag", AccessMethod.ID_JAG, "id_jag"),
            ("project_secret_api_key", AccessMethod.PROJECT_SECRET_API_KEY, "project_secret_api_key"),
            ("team_secret_token", AccessMethod.TEAM_SECRET_TOKEN, "team_secret_token"),
        ]
    )
    @patch("insights.event_usage.hanzo_insights.capture")
    def test_access_method_from_query_tags_reaches_capture(self, _name, tagged, expected, mock_capture):
        factory = APIRequestFactory()
        request = factory.get("/fake")

        with tags_context(access_method=tagged):
            report_user_action(self.user, "test event", request=request)

        assert mock_capture.call_args[1]["properties"]["access_method"] == expected

    @patch("insights.event_usage.hanzo_insights.capture")
    def test_no_request_passes_properties_unchanged(self, mock_capture):
        report_user_action(self.user, "test event", properties={"key": "val"})

        mock_capture.assert_called_once()
        assert mock_capture.call_args[1]["properties"] == {"key": "val", "$set_once": {"email": self.user.email}}

    @patch("insights.event_usage.hanzo_insights.capture")
    def test_analytics_props_merged_into_capture(self, mock_capture):
        report_user_action(
            self.user,
            "test event",
            properties={"key": "val"},
            analytics_props={"source": EventSource.CACHE_WARMING},
        )

        mock_capture.assert_called_once()
        captured_props = mock_capture.call_args[1]["properties"]
        assert captured_props["source"] == EventSource.CACHE_WARMING
        assert captured_props["key"] == "val"
        assert captured_props["$set_once"] == {"email": self.user.email}

    @patch("insights.event_usage.hanzo_insights.capture")
    def test_explicit_properties_take_precedence_over_analytics_props(self, mock_capture):
        report_user_action(
            self.user,
            "test event",
            properties={"source": "override"},
            analytics_props={"source": EventSource.CACHE_WARMING},
        )

        mock_capture.assert_called_once()
        assert mock_capture.call_args[1]["properties"]["source"] == "override"

    def test_raises_when_both_request_and_analytics_props_provided(self):
        factory = APIRequestFactory()
        request = factory.get("/fake")

        with pytest.raises(ValueError, match="Pass either request or analytics_props, not both"):
            report_user_action(
                self.user,
                "test event",
                request=request,
                analytics_props={"source": EventSource.API},
            )


class TestGetEventSource(BaseTest):
    @parameterized.expand(
        [
            ("terraform", "insights/terraform-provider 1.0", EventSource.TERRAFORM),
            ("cli_exact", "insights-cli", EventSource.CLI),
            ("wizard", "insights/wizard 1.0", EventSource.WIZARD),
            ("insights_code", "insights/code 1.2.3", EventSource.POSTFN_CODE),
            ("hog_dev_subdomain", "insights/desktop.script.dev 0.1.0", EventSource.POSTFN_CODE),
            ("hog_dev_complex", "insights/my-app.script.dev", EventSource.POSTFN_CODE),
            ("mcp_server", "insights/mcp-server 1.0", EventSource.MCP),
            ("unknown_ua_falls_through_to_api", "some-random-agent/1.0", EventSource.API),
        ]
    )
    def test_get_event_source(self, _name, user_agent, expected):
        factory = APIRequestFactory()
        request = factory.get("/fake", HTTP_USER_AGENT=user_agent)
        assert get_event_source(request) == expected

    def test_web_via_session_authentication(self):
        from rest_framework.authentication import SessionAuthentication

        request = SimpleNamespace(META={}, headers={}, successful_authenticator=SessionAuthentication())
        assert get_event_source(request) == EventSource.WEB

    def test_web_via_session_key_fallback(self):
        request = SimpleNamespace(META={}, headers={}, session=SimpleNamespace(session_key="abc123"))
        assert get_event_source(request) == EventSource.WEB

    def test_api_when_session_is_dict(self):
        request = SimpleNamespace(META={}, headers={}, session={})
        assert get_event_source(request) == EventSource.API

    def test_api_when_session_key_is_none(self):
        request = SimpleNamespace(META={}, headers={}, session=SimpleNamespace(session_key=None))
        assert get_event_source(request) == EventSource.API

    def test_x_insights_client_mcp_header_returns_mcp_source(self):
        factory = APIRequestFactory()
        request = factory.get("/fake", HTTP_X_POSTFN_CLIENT="mcp")
        assert get_event_source(request) == EventSource.MCP

    @parameterized.expand(
        [
            ("insights_cli_consumer_is_cli", "insights-cli", EventSource.CLI),
            ("other_consumer_stays_mcp", "slack", EventSource.MCP),
        ]
    )
    def test_mcp_consumer_header_source(self, _name, consumer, expected):
        factory = APIRequestFactory()
        request = factory.get(
            "/fake",
            HTTP_USER_AGENT="insights/mcp-server; version: 1.0.0",
            HTTP_X_POSTFN_MCP_CONSUMER=consumer,
        )
        assert get_event_source(request) == expected

    @parameterized.expand(
        [
            ("wizard_with_mcp_ua_and_header", "insights/wizard 1.0 insights/mcp-server", "mcp", EventSource.WIZARD),
            ("wizard_with_mcp_ua_no_header", "insights/wizard 1.0 insights/mcp-server", None, EventSource.WIZARD),
            ("wizard_no_mcp_ua_with_header", "insights/wizard 1.0", "mcp", EventSource.WIZARD),
            (
                "terraform_with_mcp_ua_and_header",
                "insights/terraform-provider 1.0 insights/mcp-server",
                "mcp",
                EventSource.TERRAFORM,
            ),
            (
                "terraform_with_mcp_ua_no_header",
                "insights/terraform-provider 1.0 insights/mcp-server",
                None,
                EventSource.TERRAFORM,
            ),
            ("terraform_no_mcp_ua_with_header", "insights/terraform-provider 1.0", "mcp", EventSource.TERRAFORM),
            (
                "insights_code_with_mcp_ua_and_header",
                "insights/code 1.2.3 insights/mcp-server",
                "mcp",
                EventSource.POSTFN_CODE,
            ),
            (
                "insights_code_with_mcp_ua_no_header",
                "insights/code 1.2.3 insights/mcp-server",
                None,
                EventSource.POSTFN_CODE,
            ),
            ("insights_code_no_mcp_ua_with_header", "insights/code 1.2.3", "mcp", EventSource.POSTFN_CODE),
        ]
    )
    def test_outer_caller_user_agent_wins_over_mcp_signals(self, _name, user_agent, x_insights_client, expected):
        # Wizard / insights-code / terraform all wrap MCP. Regardless of which MCP signal is
        # present (UA token, X-Insights-Client header, or both), the outer caller's UA must win.
        factory = APIRequestFactory()
        kwargs = {"HTTP_USER_AGENT": user_agent}
        if x_insights_client is not None:
            kwargs["HTTP_X_POSTFN_CLIENT"] = x_insights_client
        request = factory.get("/fake", **kwargs)
        assert get_event_source(request) == expected


class TestIsWizardSelfDrivingProgram(BaseTest):
    @parameterized.expand(
        [
            # Direct wizard → Django: the marker rides on the User-Agent itself.
            ("direct_with_marker", "insights/wizard; version: 2.44.0; program: self-driving-setup", None, True),
            ("direct_without_marker", "insights/wizard; version: 2.44.0", None, False),
            ("direct_other_program", "insights/wizard; version: 2.44.0; program: revenue-analytics", None, False),
            # Proxied via the MCP server: it overwrites User-Agent with its own token and forwards
            # the wizard's real UA (marker included) in X-Insights-Mcp-User-Agent. The marker must
            # still be found there — this is the case that previously went undetected.
            (
                "proxied_with_marker",
                "insights/mcp-server; version: 1.0.0; for insights/wizard",
                "insights/wizard; version: 2.45.0; program: self-driving-setup",
                True,
            ),
            (
                "proxied_without_marker",
                "insights/mcp-server; version: 1.0.0; for insights/wizard",
                "insights/wizard; version: 2.45.0",
                False,
            ),
            (
                "proxied_other_program",
                "insights/mcp-server; version: 1.0.0; for insights/wizard",
                "insights/wizard; version: 2.45.0; program: web-analytics-doctor",
                False,
            ),
            # A stray marker with no wizard token anywhere must not qualify.
            ("marker_without_wizard", "some-agent/1.0; program: self-driving", None, False),
            ("no_signals", "some-random-agent/1.0", None, False),
        ]
    )
    def test_is_wizard_self_driving_program(self, _name, user_agent, mcp_user_agent, expected):
        factory = APIRequestFactory()
        kwargs = {"HTTP_USER_AGENT": user_agent}
        if mcp_user_agent is not None:
            kwargs["HTTP_X_POSTFN_MCP_USER_AGENT"] = mcp_user_agent
        request = factory.get("/fake", **kwargs)
        assert is_wizard_self_driving_program(request) is expected


class TestGetMcpProperties(BaseTest):
    def test_extracts_all_mcp_headers(self):
        factory = APIRequestFactory()
        request = factory.get(
            "/fake",
            HTTP_X_POSTFN_MCP_USER_AGENT="insights/cursor 1.0",
            HTTP_X_POSTFN_MCP_CLIENT_NAME="claude-code",
            HTTP_X_POSTFN_MCP_CLIENT_VERSION="1.2.3",
            HTTP_X_POSTFN_MCP_PROTOCOL_VERSION="2025-03-26",
            HTTP_X_POSTFN_MCP_OAUTH_CLIENT_NAME="Claude Code (insights)",
        )
        assert get_mcp_properties(request) == {
            "mcp_user_agent": "insights/cursor 1.0",
            "mcp_client_name": "claude-code",
            "mcp_client_version": "1.2.3",
            "mcp_protocol_version": "2025-03-26",
            "mcp_oauth_client_name": "Claude Code (insights)",
        }

    def test_returns_none_for_missing_headers(self):
        factory = APIRequestFactory()
        request = factory.get("/fake")
        assert get_mcp_properties(request) == {
            "mcp_user_agent": None,
            "mcp_client_name": None,
            "mcp_client_version": None,
            "mcp_protocol_version": None,
            "mcp_oauth_client_name": None,
        }


class TestSanitizeHeaderValue(BaseTest):
    @parameterized.expand(
        [
            ("passthrough", "insights/wizard 1.0", "insights/wizard 1.0"),
            ("uuidv7_session_id", "019644d0-a67c-7fa5-a44c-e864c81b5087", "019644d0-a67c-7fa5-a44c-e864c81b5087"),
            ("strips_control_chars", "agent\x00with\x1fnulls", "agentwithnulls"),
            ("truncates_to_max_length", "a" * 1500, "a" * 1000),
            ("strips_whitespace", "  spaces  ", "spaces"),
            ("empty_string_returns_none", "", None),
            ("whitespace_only_returns_none", " ", None),
            ("none_returns_none", None, None),
        ]
    )
    def test_sanitize_header_value(self, _name, input_value, expected):
        assert sanitize_header_value(input_value) == expected
