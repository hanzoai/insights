import json
from typing import get_args

import pytest
from unittest.mock import patch

from django.test import override_settings

from insights import iam
from insights.llm.gateway_client import (
    GatewayUnavailable,
    Product,
    build_async_anthropic_client,
    build_async_openai_client,
    build_openai_client,
    get_async_anthropic_gateway_client,
    get_async_llm_client,
    get_llm_client,
    resolve_ai_gateway_config,
    team_trace_id,
)

AI_GATEWAY_URL = "https://ai-gateway.example/v1"
AI_GATEWAY_ROOT = "https://ai-gateway.example"
AI_GATEWAY_KEY = "sk-project_secret"  # what IAM hands back, not a configured value


@pytest.fixture(autouse=True)
def _iam_issues_a_token():
    """The gateway bearer is an IAM token, so every gateway test needs IAM to answer."""
    with patch("insights.llm.gateway_client.iam.service_token", return_value=AI_GATEWAY_KEY):
        yield


TEAM_42_TRACE_ID = "30a04c7a-98b4-5119-8597-8c696e44a270"


def _properties(client) -> dict:
    """The labels a built client will send, decoded from its properties header."""
    return json.loads(client._custom_headers["X-Insights-Properties"])


class TestResolveAIGatewayConfig:
    @override_settings(AI_GATEWAY_URL="")
    def test_returns_none_when_url_unset(self):
        assert resolve_ai_gateway_config() is None

    @override_settings(AI_GATEWAY_URL=AI_GATEWAY_URL)
    def test_uses_this_deployments_identity_when_nobody_is_acting(self):
        assert resolve_ai_gateway_config() == (AI_GATEWAY_URL, AI_GATEWAY_KEY)

    @override_settings(AI_GATEWAY_URL=AI_GATEWAY_URL)
    def test_uses_the_acting_persons_identity_so_their_org_is_billed(self):
        user = object()
        with patch("insights.llm.gateway_client.iam.user_token", return_value="sk-alice") as user_token:
            assert resolve_ai_gateway_config(user) == (AI_GATEWAY_URL, "sk-alice")
        user_token.assert_called_once_with(user)

    @override_settings(AI_GATEWAY_URL="https://ai-gateway.example")
    def test_misconfigured_url_resolves_to_none_and_logs(self):
        with patch("insights.llm.gateway_client.logger") as mock_logger:
            assert resolve_ai_gateway_config() is None
        mock_logger.warning.assert_called_once()
        assert "OpenAI base path" in str(mock_logger.warning.call_args)

    @override_settings(AI_GATEWAY_URL=AI_GATEWAY_URL)
    def test_no_identity_resolves_to_none_rather_than_calling_unauthenticated(self):
        with (
            patch("insights.llm.gateway_client.iam.service_token", side_effect=iam.IamUnavailable("IAM is down")),
            patch("insights.llm.gateway_client.logger") as mock_logger,
        ):
            assert resolve_ai_gateway_config() is None
        mock_logger.warning.assert_called_once()


class TestEveryClientRefusesWithoutAGateway:
    """No client may answer from anywhere but the gateway.

    The failure has to be loud: a client that quietly fell back to a key in the
    environment would bill one tenant for every tenant's work, and an answer from
    outside the estate is worse than no answer.
    """

    @pytest.mark.parametrize(
        "build",
        [
            lambda: get_llm_client(product="django"),
            lambda: get_async_llm_client(product="django"),
            lambda: get_async_anthropic_gateway_client(product="django"),
            lambda: build_openai_client("django", ai_product="tagged"),
            lambda: build_async_openai_client("django", ai_product="tagged"),
            lambda: build_async_anthropic_client("django", ai_product="tagged"),
        ],
    )
    @override_settings(AI_GATEWAY_URL="")
    def test_raises_when_gateway_unset(self, build):
        with pytest.raises(GatewayUnavailable):
            build()

    @override_settings(AI_GATEWAY_URL=AI_GATEWAY_URL)
    def test_raises_when_iam_will_not_issue_a_token(self):
        with patch("insights.llm.gateway_client.iam.service_token", side_effect=iam.IamUnavailable("IAM is down")):
            with pytest.raises(GatewayUnavailable):
                get_llm_client(product="django")

    @override_settings(AI_GATEWAY_URL="https://ai-gateway.example")
    def test_raises_when_gateway_url_is_missing_the_v1_base(self):
        with pytest.raises(GatewayUnavailable):
            get_llm_client(product="django")


@override_settings(AI_GATEWAY_URL=AI_GATEWAY_URL)
class TestGetLlmClient:
    @pytest.mark.parametrize("product", get_args(Product))
    def test_every_declared_product_is_accepted(self, product: str):
        assert get_llm_client(product=product) is not None

    def test_bearer_is_the_iam_token_never_a_configured_key(self):
        assert get_llm_client(product="django").api_key == AI_GATEWAY_KEY

    def test_base_url_is_the_gateway(self):
        assert str(get_llm_client(product="django").base_url).rstrip("/") == AI_GATEWAY_URL

    def test_product_is_not_a_route_so_it_never_reaches_the_url(self):
        # The gateway is slugless: the product is a label on the generation, not a path.
        assert str(get_llm_client(product="signals").base_url).rstrip("/") == AI_GATEWAY_URL

    def test_an_explicit_credential_overrides_the_deployment_identity(self):
        # A caller holding a narrower, server-minted token uses it rather than ours.
        assert get_llm_client(product="custom_image_scans", api_key="server-minted-token").api_key == (
            "server-minted-token"
        )

    def test_the_calling_product_labels_the_generation(self):
        assert _properties(get_llm_client(product="signals"))["ai_product"] == "signals"

    def test_team_is_labelled_and_traced_when_attributed(self):
        client = get_llm_client(product="signals", team_id=42)
        assert _properties(client)["team_id"] == "42"
        assert client._custom_headers["X-Insights-Trace-Id"] == TEAM_42_TRACE_ID

    def test_no_trace_header_when_the_call_is_unattributed(self):
        assert "X-Insights-Trace-Id" not in get_llm_client(product="signals")._custom_headers

    def test_the_acting_person_is_billed_not_the_deployment(self):
        user = object()
        with patch("insights.llm.gateway_client.iam.user_token", return_value="sk-alice"):
            assert get_llm_client(product="django", user=user).api_key == "sk-alice"


@override_settings(AI_GATEWAY_URL=AI_GATEWAY_URL)
class TestGetAsyncLlmClient:
    def test_matches_the_sync_client(self):
        client = get_async_llm_client(product="signals", team_id=42)
        assert client.api_key == AI_GATEWAY_KEY
        assert str(client.base_url).rstrip("/") == AI_GATEWAY_URL
        assert _properties(client)["team_id"] == "42"


@override_settings(AI_GATEWAY_URL=AI_GATEWAY_URL)
class TestGetAsyncAnthropicGatewayClient:
    def test_base_url_drops_v1_because_the_sdk_appends_it(self):
        # The Anthropic SDK posts to {base_url}/v1/messages; keeping /v1 would double it.
        assert str(get_async_anthropic_gateway_client(product="django").base_url).rstrip("/") == AI_GATEWAY_ROOT

    def test_bearer_is_the_iam_token(self):
        assert get_async_anthropic_gateway_client(product="django").api_key == AI_GATEWAY_KEY

    def test_team_is_labelled_and_traced(self):
        client = get_async_anthropic_gateway_client(product="signals", team_id=42)
        assert _properties(client)["team_id"] == "42"
        assert client._custom_headers["X-Insights-Trace-Id"] == TEAM_42_TRACE_ID


@override_settings(AI_GATEWAY_URL=AI_GATEWAY_URL)
class TestBuildClientsTagTheGeneration:
    """The build_* variants differ from get_* in one thing: the generation is tagged
    with an explicit ai_product rather than with the calling product."""

    def test_openai_client_carries_the_explicit_tag(self):
        client = build_openai_client("signals", ai_product="signals_grouping")
        assert str(client.base_url).rstrip("/") == AI_GATEWAY_URL
        assert _properties(client)["ai_product"] == "signals_grouping"

    def test_async_openai_client_carries_the_explicit_tag(self):
        assert _properties(build_async_openai_client("signals", ai_product="signals_grouping"))["ai_product"] == (
            "signals_grouping"
        )

    def test_tag_defaults_to_the_calling_product(self):
        assert _properties(build_openai_client("signals"))["ai_product"] == "signals"

    def test_anthropic_client_labels_product_stage_and_team(self):
        client = build_async_anthropic_client(
            "signals", ai_product="signals_grouping", ai_stage="match", team_id=42
        )
        assert str(client.base_url).rstrip("/") == AI_GATEWAY_ROOT
        assert _properties(client) == {
            "ai_product": "signals_grouping",
            "ai_stage": "match",
            "team_id": "42",
        }
        assert client._custom_headers["X-Insights-Trace-Id"] == TEAM_42_TRACE_ID

    def test_anthropic_client_omits_stage_when_unset(self):
        assert "ai_stage" not in _properties(build_async_anthropic_client("signals", ai_product="signals_grouping"))

    def test_anthropic_client_omits_trace_when_unattributed(self):
        client = build_async_anthropic_client("signals", ai_product="signals_grouping")
        assert "X-Insights-Trace-Id" not in client._custom_headers


class TestTeamTraceId:
    # Expected ids are $ai_trace_id values observed on captured events, not recomputed from the
    # helper: recomputing would make the test agree with itself and miss a namespace change.
    @pytest.mark.parametrize(
        "team_id,expected",
        [
            (2, "aba5a277-3ba6-5682-a2da-f455d39e8aff"),
            (1589, "2e803550-d2e1-5dd7-9124-0fdd7e8c9518"),
            (169318, "92733d55-3d1e-5062-905b-0afa3b2e2a92"),
            (487950, "78c3f90a-d69e-5fe6-b2b2-3f22a4d7ebb1"),
        ],
    )
    def test_matches_the_ids_already_recorded_on_events(self, team_id: int, expected: str):
        assert team_trace_id(team_id) == expected

    def test_unattributed_call_has_no_trace_id(self):
        assert team_trace_id(None) is None

    def test_distinct_teams_do_not_share_a_trace(self):
        assert team_trace_id(2) != team_trace_id(3)
