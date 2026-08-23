import pytest
from unittest.mock import patch

from django.test import override_settings
from django.urls import resolve

from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from insights import iam
from insights.api import flags as flags_api

HANZO_API_URL = "https://api.hanzo.ai"

configured = override_settings(HANZO_API_URL=HANZO_API_URL)


def _response(payload, code=200):
    class Response:
        status_code = code

        def raise_for_status(self):
            if code >= 400:
                raise RuntimeError(f"HTTP {code}")

        def json(self):
            return payload

    return Response()


def _verdict(feature_flags=None, payloads=None):
    return {
        "featureFlags": feature_flags if feature_flags is not None else {},
        "featureFlagPayloads": payloads if payloads is not None else {},
        "errorsWhileComputingFlags": False,
    }


class _User:
    """The three identity fields the view reads, without touching the database.

    The view reads a user, never a row, so these cases exercise the real view
    against a real DRF request and still need no database.
    """

    is_authenticated = True
    is_active = True

    def __init__(self, distinct_id="dist-1", uuid="01890000-0000-0000-0000-000000000001", email="u@hanzo.ai"):
        self.distinct_id = distinct_id
        self.uuid = uuid
        self.email = email


class TestEvaluate:
    """The relay itself: what it sends, what it returns, and what it refuses."""

    @configured
    def test_relays_the_verdict(self):
        with patch("insights.api.flags.iam.authorization", return_value={"Authorization": "Bearer tok"}):
            with patch("insights.api.flags.requests.post") as post:
                post.return_value = _response(_verdict({"new-editor": True, "theme": "dark"}, {"theme": {"hue": 2}}))

                verdict = flags_api._evaluate(_User())

        assert verdict == {
            "featureFlags": {"new-editor": True, "theme": "dark"},
            "featureFlagPayloads": {"theme": {"hue": 2}},
            "evaluated": True,
        }

    @configured
    def test_asks_cloud_at_the_v1_flags_door_with_the_iam_bearer(self):
        with patch("insights.api.flags.iam.authorization", return_value={"Authorization": "Bearer tok"}):
            with patch("insights.api.flags.requests.post") as post:
                post.return_value = _response(_verdict())
                flags_api._evaluate(_User())

        url = post.call_args[0][0]
        assert url == f"{HANZO_API_URL}/v1/flags"
        # Never /v1/, and never a second version.
        assert "/v1/" not in url
        assert "/v2/" not in url
        assert post.call_args[1]["headers"]["Authorization"] == "Bearer tok"
        # A hung gateway must not hold a request open behind the app's own wait.
        assert post.call_args[1]["timeout"] == flags_api._TIMEOUT_SECONDS

    @configured
    def test_evaluates_the_session_user_and_nothing_else(self):
        with patch("insights.api.flags.iam.authorization", return_value={"Authorization": "Bearer tok"}):
            with patch("insights.api.flags.requests.post") as post:
                post.return_value = _response(_verdict())
                flags_api._evaluate(_User(distinct_id="dist-1", email="u@hanzo.ai"))

        sent = post.call_args[1]["json"]
        assert sent["distinct_id"] == "dist-1"
        assert sent["person_properties"]["email"] == "u@hanzo.ai"

    def test_identity_is_stable_and_falls_back_to_the_uuid(self):
        # Rollout buckets hash this, so a user with no distinct_id must still get
        # ONE stable value rather than a fresh one per request.
        assert flags_api._identity(_User(distinct_id="dist-1")) == "dist-1"
        assert flags_api._identity(_User(distinct_id=None, uuid="uuid-9")) == "uuid-9"
        assert flags_api._identity(_User(distinct_id=None, uuid="uuid-9")) == "uuid-9"

    @configured
    def test_refuses_when_iam_has_no_identity(self):
        with patch("insights.api.flags.iam.authorization", side_effect=iam.IamUnavailable("no creds")):
            with patch("insights.api.flags.requests.post") as post:
                with pytest.raises(flags_api.EvaluationUnavailable):
                    flags_api._evaluate(_User())
                # Never sent unauthenticated.
                assert post.call_count == 0

    @configured
    def test_refuses_a_non_200(self):
        with patch("insights.api.flags.iam.authorization", return_value={"Authorization": "Bearer tok"}):
            with patch("insights.api.flags.requests.post") as post:
                post.return_value = _response({"error": "nope"}, code=503)
                with pytest.raises(flags_api.EvaluationUnavailable):
                    flags_api._evaluate(_User())

    @configured
    def test_refuses_a_body_that_is_not_a_verdict(self):
        with patch("insights.api.flags.iam.authorization", return_value={"Authorization": "Bearer tok"}):
            for body in [{}, {"featureFlags": []}, {"featureFlags": "on"}, [], "yes", None]:
                with patch("insights.api.flags.requests.post") as post:
                    post.return_value = _response(body)
                    with pytest.raises(flags_api.EvaluationUnavailable):
                        flags_api._evaluate(_User())

    @configured
    def test_a_missing_payload_map_is_empty_not_absent(self):
        with patch("insights.api.flags.iam.authorization", return_value={"Authorization": "Bearer tok"}):
            with patch("insights.api.flags.requests.post") as post:
                post.return_value = _response({"featureFlags": {"a": True}})
                verdict = flags_api._evaluate(_User())

        assert verdict == {"featureFlags": {"a": True}, "featureFlagPayloads": {}, "evaluated": True}

    @configured
    def test_the_refusal_never_carries_the_bearer(self):
        with patch("insights.api.flags.iam.authorization", return_value={"Authorization": "Bearer sup3rs3cret"}):
            with patch("insights.api.flags.requests.post") as post:
                post.return_value = _response({"echo": "Bearer sup3rs3cret"}, code=500)
                with pytest.raises(flags_api.EvaluationUnavailable) as raised:
                    flags_api._evaluate(_User())

        assert "sup3rs3cret" not in str(raised.value)


class TestRouting:
    """Which view answers which path, decided by the URLconf rather than by a probe."""

    def test_v1_flags_resolves_to_this_view(self):
        for path in ["/v1/flags", "/v1/flags/"]:
            assert resolve(path).func is flags_api.flags, path

    def test_the_sdk_flags_path_is_still_a_404_view(self):
        # Deliberately NOT this view: the SDK's keyed protocol is not served.
        for path in ["/flags", "/flags/"]:
            assert resolve(path).func is not flags_api.flags, path

    def test_the_door_is_not_under_api(self):
        assert resolve("/v1/flags/").route.startswith("^v1/flags")


class TestFlagsEndpoint:
    """The endpoint itself: the real view, through DRF's real authentication stack."""

    @pytest.fixture(autouse=True)
    def _rate_limit_setting(self):
        """Isolate the throttle's instance-setting read, not the throttle.

        This endpoint inherits the platform throttle, which asks the database whether
        rate limiting is on before it decides. That lookup is the only thing here
        that needs a row, so it is stubbed -- the throttle itself still runs, and
        so does everything after it.
        """
        with patch("insights.rate_limit.is_rate_limit_enabled", return_value=False):
            yield

    def _get(self, query="", user=None):
        request = APIRequestFactory().get(f"/v1/flags/{query}")
        if user is not None:
            force_authenticate(request, user=user)
        return flags_api.flags(request)

    @configured
    def test_answers_the_signed_in_user_their_flags(self):
        with patch("insights.api.flags.iam.authorization", return_value={"Authorization": "Bearer tok"}):
            with patch("insights.api.flags.requests.post") as post:
                post.return_value = _response(_verdict({"new-editor": True}))
                response = self._get(user=_User())

        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data == {
            "featureFlags": {"new-editor": True},
            "featureFlagPayloads": {},
            "evaluated": True,
        }

    @configured
    def test_an_anonymous_caller_gets_no_verdict(self):
        with patch("insights.api.flags.iam.authorization") as authorization:
            with patch("insights.api.flags.requests.post") as post:
                response = self._get()

        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
        assert "featureFlags" not in response.data
        # Fails before it costs anything: no bearer minted, no call made.
        assert authorization.call_count == 0
        assert post.call_count == 0

    @configured
    def test_the_caller_cannot_choose_whose_flags_to_read(self):
        # There is no field for it, so asking anyway must change nothing.
        user = _User(distinct_id="mine", email="me@hanzo.ai")
        with patch("insights.api.flags.iam.authorization", return_value={"Authorization": "Bearer tok"}):
            with patch("insights.api.flags.requests.post") as post:
                post.return_value = _response(_verdict())
                self._get(query="?distinct_id=someone-else&person_properties=%7B%22plan%22%3A%22pro%22%7D", user=user)

        sent = post.call_args[1]["json"]
        assert sent["distinct_id"] == "mine"
        assert sent["person_properties"]["email"] == "me@hanzo.ai"
        assert "pro" not in str(sent["person_properties"])

    @configured
    def test_a_refusal_to_ask_is_an_empty_verdict_not_a_gateway_error(self):
        """403 upstream means this identity may not ask, which is a stable state.

        It grants nothing, exactly like a 502, so the fail-closed invariant holds
        either way. It is reported as an empty verdict because a 502 on every page
        load reads as an outage and buries the real one -- which is how this shipped:
        the relay 502'd on every request and the e2e was the only thing that noticed.
        """
        with patch("insights.api.flags.iam.authorization", return_value={"Authorization": "Bearer tok"}):
            with patch("insights.api.flags.requests.post") as post:
                post.return_value = _response({"detail": "X-Org-Id required"}, code=403)

                response = self._get(user=_User())

        assert response.status_code == status.HTTP_200_OK
        assert response.data["featureFlags"] == {}
        assert response.data["featureFlagPayloads"] == {}

    @configured
    def test_a_broken_gateway_grants_nothing(self):
        with patch("insights.api.flags.iam.authorization", return_value={"Authorization": "Bearer tok"}):
            with patch("insights.api.flags.requests.post", side_effect=OSError("connection refused")):
                response = self._get(user=_User())

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert response.data["featureFlags"] == {}
        assert response.data["featureFlagPayloads"] == {}

    @configured
    def test_no_iam_identity_grants_nothing(self):
        with patch("insights.api.flags.iam.authorization", side_effect=iam.IamUnavailable("unconfigured")):
            response = self._get(user=_User())

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert response.data["featureFlags"] == {}

    @configured
    @pytest.mark.parametrize(
        "post_kwargs",
        [
            pytest.param({"return_value": _response({"detail": "X-Org-Id required"}, code=403)}, id="refused"),
            pytest.param({"side_effect": OSError("connection refused")}, id="unreachable"),
            pytest.param({"return_value": _response({"nonsense": True})}, id="not-a-verdict"),
        ],
    )
    def test_an_answer_nobody_evaluated_says_so(self, post_kwargs):
        # Granting nothing is right, but a caller that cannot tell this from an
        # evaluated verdict reads every gated surface as deliberately switched off.
        with patch("insights.api.flags.iam.authorization", return_value={"Authorization": "Bearer tok"}):
            with patch("insights.api.flags.requests.post", **post_kwargs):
                response = self._get(user=_User())

        assert response.data["featureFlags"] == {}
        assert response.data["evaluated"] is False

    @configured
    def test_an_evaluator_that_turned_nothing_on_is_not_reported_as_broken(self):
        # The live state this had to distinguish: cloud evaluates cleanly and holds
        # no definitions, so the verdict is empty and entirely trustworthy. Reporting
        # that as unavailable would cry outage on a healthy deployment.
        with patch("insights.api.flags.iam.authorization", return_value={"Authorization": "Bearer tok"}):
            with patch("insights.api.flags.requests.post") as post:
                post.return_value = _response(_verdict())
                response = self._get(user=_User())

        assert response.status_code == status.HTTP_200_OK
        assert response.data["featureFlags"] == {}
        assert response.data["evaluated"] is True

    @configured
    def test_a_verdict_is_never_cached(self):
        with patch("insights.api.flags.iam.authorization", return_value={"Authorization": "Bearer tok"}):
            with patch("insights.api.flags.requests.post") as post:
                post.return_value = _response(_verdict({"a": True}))
                response = self._get(user=_User())
                response.render()

        # Per-user, so a shared cache would hand one user another's flags.
        assert "no-cache" in response.headers.get("Cache-Control", "")
