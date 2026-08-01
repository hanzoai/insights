import pytest
from unittest.mock import patch

from django.test import override_settings

from insights import iam


@pytest.fixture(autouse=True)
def clear_cache():
    """The token is cached in module state, so each case starts from cold."""
    iam._token = None
    iam._expires_at = 0.0
    yield
    iam._token = None
    iam._expires_at = 0.0


ENDPOINT = "https://hanzo.id/v1/iam"


def _response(payload, status=200):
    class Response:
        status_code = status

        def raise_for_status(self):
            if status >= 400:
                raise RuntimeError(f"HTTP {status}")

        def json(self):
            return payload

    return Response()


configured = override_settings(
    SOCIAL_AUTH_OIDC_OIDC_ENDPOINT=ENDPOINT, SOCIAL_AUTH_OIDC_KEY="hanzo-insights", SOCIAL_AUTH_OIDC_SECRET="s3cret"
)


class TestServiceToken:
    @configured
    def test_mints_and_reuses_a_token(self):
        with patch("insights.iam.requests.post") as post:
            post.return_value = _response({"access_token": "tok-1", "expires_in": 3600})

            assert iam.service_token() == "tok-1"
            assert iam.service_token() == "tok-1"

            # Cached: a token is minted once per lifetime, not once per call —
            # this sits in front of every block fetch in a replay.
            assert post.call_count == 1
            assert post.call_args[0][0] == f"{ENDPOINT}/oauth/token"
            assert post.call_args[1]["data"]["grant_type"] == "client_credentials"

    @configured
    def test_authorization_header_is_a_bearer(self):
        with patch("insights.iam.requests.post") as post:
            post.return_value = _response({"access_token": "tok-1", "expires_in": 3600})
            assert iam.authorization() == {"Authorization": "Bearer tok-1"}

    @configured
    def test_re_mints_once_the_cached_token_is_near_expiry(self):
        with patch("insights.iam.requests.post") as post:
            post.side_effect = [
                _response({"access_token": "tok-1", "expires_in": 3600}),
                _response({"access_token": "tok-2", "expires_in": 3600}),
            ]
            assert iam.service_token() == "tok-1"
            # Inside the refresh margin: the token still verifies, but a call
            # dispatched now could outlive it.
            iam._expires_at = iam.time.monotonic() + 10
            assert iam.service_token() == "tok-2"

    @configured
    def test_raises_when_iam_refuses(self):
        with patch("insights.iam.requests.post") as post:
            post.return_value = _response({"error": "invalid_client"}, status=401)
            with pytest.raises(iam.IamUnavailable):
                iam.service_token()

    @configured
    def test_raises_when_iam_answers_without_a_token(self):
        with patch("insights.iam.requests.post") as post:
            post.return_value = _response({"token_type": "Bearer"})
            with pytest.raises(iam.IamUnavailable):
                iam.service_token()

    @configured
    def test_raises_rather_than_leaking_the_response_body(self):
        # An IAM error can echo back what was sent to it, including the client
        # secret, so the message names the failure and nothing else.
        with patch("insights.iam.requests.post") as post:
            post.return_value = _response({"error_description": "bad secret s3cret"}, status=400)
            with pytest.raises(iam.IamUnavailable) as caught:
                iam.service_token()
            assert "s3cret" not in str(caught.value)


class TestUnconfigured:
    @override_settings(SOCIAL_AUTH_OIDC_OIDC_ENDPOINT=ENDPOINT, SOCIAL_AUTH_OIDC_KEY="", SOCIAL_AUTH_OIDC_SECRET="")
    @configured
    def test_no_credentials_raises_rather_than_returning_empty(self):
        # The whole failure being removed is a caller that proceeds without a
        # credential. An empty string must never come back from here.
        with pytest.raises(iam.IamUnavailable):
            iam.service_token()

    @override_settings(
        SOCIAL_AUTH_OIDC_OIDC_ENDPOINT="", SOCIAL_AUTH_OIDC_KEY="hanzo-insights", SOCIAL_AUTH_OIDC_SECRET="s3cret"
    )
    @configured
    def test_no_endpoint_raises(self):
        with pytest.raises(iam.IamUnavailable):
            iam.service_token()
