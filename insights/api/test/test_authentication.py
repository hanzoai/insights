import json
import uuid
from datetime import datetime, timedelta
from typing import cast

import pytest
from freezegun import freeze_time
from insights.test.base import APIBaseTest
from unittest.mock import patch

from django.conf import settings
from django.contrib.auth import BACKEND_SESSION_KEY
from django.contrib.sessions.middleware import SessionMiddleware
from django.core import mail
from django.core.asgi import get_asgi_application
from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase
from django.utils import timezone

from asgiref.sync import sync_to_async
from httpx import ASGITransport, AsyncClient
from parameterized import parameterized
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.parsers import JSONParser
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from insights.api.authentication import social_login_notification
from insights.auth import (
    InternalAPIUser,
    OAuthAccessTokenAuthentication,
    ProjectSecretAPIKeyAuthentication,
    ProjectSecretAPIKeyUser,
    TeamSecretTokenAuthentication,
    TeamSecretTokenUser,
    _extract_secret_key,
)
from insights.datastore.query_tagging import AccessMethod
from insights.helpers.user_devices import (
    KNOWN_DEVICE_COOKIE,
    build_known_device_cookie_value,
    has_valid_known_device_cookie,
)
from insights.middleware import KnownLoginDeviceCookieMiddleware
from insights.models import User
from insights.models.activity_logging.signal_handlers import post_login
from insights.models.instance_setting import set_instance_setting
from insights.models.oauth import OAuthAccessToken, OAuthApplication
from insights.models.organization import Organization, OrganizationMembership
from insights.models.personal_api_key import PersonalAPIKey
from insights.models.project_secret_api_key import ProjectSecretAPIKey
from insights.models.team.team import Team
from insights.models.utils import KeyKind, generate_random_token_personal, hash_key_value, mint

from products.feature_flags.backend.models.feature_flag import FeatureFlag

VALID_TEST_PASSWORD = "mighty-strong-secure-1337!!"


class TestLogoutRedirect(APIBaseTest):
    """
    Tests that /logout preserves a safe `next` param so users return to where they were
    after logging back in.
    """

    def test_logout_without_next_redirects_to_login(self):
        response = self.client.post("/logout")
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertEqual(response["Location"], settings.LOGIN_URL)

    def test_logout_forwards_safe_next_param(self):
        response = self.client.post("/logout", {"next": "/settings/user-notifications"}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertEqual(response["Location"], "/login?next=/settings/user-notifications")

    @parameterized.expand(
        [
            ("scheme_relative", "//evil.com/path"),
            ("absolute_url", "https://evil.com"),
            ("javascript_url", "javascript:alert(1)"),
        ]
    )
    def test_logout_ignores_unsafe_next_param(self, _name, unsafe):
        response = self.client.post("/logout", {"next": unsafe}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertEqual(response["Location"], settings.LOGIN_URL, f"Unsafe next was preserved: {unsafe}")


class TestPersonalAPIKeyAuthentication(APIBaseTest):
    def test_personal_api_key_updates_last_used_at_hourly(self):
        self.client.logout()

        personal_api_key = generate_random_token_personal()
        PersonalAPIKey.objects.create(
            label="X",
            user=self.user,
            last_used_at="2021-08-25T21:09:14",
            secure_value=hash_key_value(personal_api_key),
            scopes=["*"],
        )

        with freeze_time("2021-08-25T22:10:14.252"):
            response = self.client.get(
                f"/v1/projects/{self.team.pk}/feature_flags/", headers={"authorization": f"Bearer {personal_api_key}"}
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)

            model_key = PersonalAPIKey.objects.get(secure_value=hash_key_value(personal_api_key))

            self.assertEqual(str(model_key.last_used_at), "2021-08-25 22:10:14.252000+00:00")

    def test_personal_api_key_updates_last_used_at_outside_the_year(self):
        self.client.logout()

        personal_api_key = generate_random_token_personal()
        PersonalAPIKey.objects.create(
            label="X",
            user=self.user,
            last_used_at="2021-08-25T21:09:14",
            secure_value=hash_key_value(personal_api_key),
            scopes=["*"],
        )

        with freeze_time("2022-08-25T22:00:14.252"):
            response = self.client.get(
                f"/v1/projects/{self.team.pk}/feature_flags/", headers={"authorization": f"Bearer {personal_api_key}"}
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)

            model_key = PersonalAPIKey.objects.get(secure_value=hash_key_value(personal_api_key))

            self.assertEqual(str(model_key.last_used_at), "2022-08-25 22:00:14.252000+00:00")

    def test_personal_api_key_updates_last_used_at_outside_the_day(self):
        self.client.logout()

        personal_api_key = generate_random_token_personal()
        PersonalAPIKey.objects.create(
            label="X",
            user=self.user,
            last_used_at="2021-08-25T21:09:14",
            secure_value=hash_key_value(personal_api_key),
            scopes=["*"],
        )

        with freeze_time("2021-08-26T22:00:14.252"):
            response = self.client.get(
                f"/v1/projects/{self.team.pk}/feature_flags/", headers={"authorization": f"Bearer {personal_api_key}"}
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)

            model_key = PersonalAPIKey.objects.get(secure_value=hash_key_value(personal_api_key))

            self.assertEqual(str(model_key.last_used_at), "2021-08-26 22:00:14.252000+00:00")

    def test_personal_api_key_updates_last_used_when_none(self):
        self.client.logout()

        personal_api_key = generate_random_token_personal()
        PersonalAPIKey.objects.create(
            label="X", user=self.user, secure_value=hash_key_value(personal_api_key), scopes=["*"]
        )

        with freeze_time("2022-08-25T22:00:14.252"):
            response = self.client.get(
                f"/v1/projects/{self.team.pk}/feature_flags/", headers={"authorization": f"Bearer {personal_api_key}"}
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)

            model_key = PersonalAPIKey.objects.get(secure_value=hash_key_value(personal_api_key))

            self.assertEqual(str(model_key.last_used_at), "2022-08-25 22:00:14.252000+00:00")

    def test_personal_api_key_does_not_update_last_used_at_within_the_hour(self):
        self.client.logout()

        personal_api_key = generate_random_token_personal()
        PersonalAPIKey.objects.create(
            label="X",
            user=self.user,
            last_used_at="2021-08-25T21:09:14",
            secure_value=hash_key_value(personal_api_key),
            scopes=["*"],
        )

        with freeze_time("2021-08-25T21:14:14.252"):
            response = self.client.get(
                f"/v1/projects/{self.team.pk}/feature_flags/", headers={"authorization": f"Bearer {personal_api_key}"}
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)

            model_key = PersonalAPIKey.objects.get(secure_value=hash_key_value(personal_api_key))
            self.assertEqual(str(model_key.last_used_at), "2021-08-25 21:09:14+00:00")

    def test_personal_api_key_does_not_update_last_used_at_when_in_the_past(self):
        self.client.logout()

        personal_api_key = generate_random_token_personal()
        PersonalAPIKey.objects.create(
            label="X",
            user=self.user,
            last_used_at="2021-08-25T21:09:14",
            secure_value=hash_key_value(personal_api_key),
            scopes=["*"],
        )

        with freeze_time("2021-08-24T21:14:14.252"):
            response = self.client.get(
                f"/v1/projects/{self.team.pk}/feature_flags/", headers={"authorization": f"Bearer {personal_api_key}"}
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)

            model_key = PersonalAPIKey.objects.get(secure_value=hash_key_value(personal_api_key))
            self.assertEqual(str(model_key.last_used_at), "2021-08-25 21:09:14+00:00")


class TestTimeSensitivePermissions(APIBaseTest):
    def test_after_timeout_modifications_require_reauthentication(self):
        self.organization_membership.level = OrganizationMembership.Level.ADMIN
        self.organization_membership.save()
        now = datetime.now()
        with freeze_time(now):
            res = self.client.patch("/v1/organizations/@current", {"name": "new name"})
            assert res.status_code == 200

        with freeze_time(now + timedelta(seconds=settings.SESSION_SENSITIVE_ACTIONS_AGE - 100)):
            res = self.client.patch("/v1/organizations/@current", {"name": "new name"})
            assert res.status_code == 200

        with freeze_time(now + timedelta(seconds=settings.SESSION_SENSITIVE_ACTIONS_AGE + 10)):
            res = self.client.patch("/v1/organizations/@current", {"name": "new name"})
            assert res.status_code == 403
            assert res.json() == {
                "type": "authentication_error",
                "code": "sensitive_action_required_reauth",
                "detail": "This action requires you to be recently authenticated.",
                "attr": None,
            }

            res = self.client.get("/v1/organizations/@current")
            assert res.status_code == 200

    def test_user_after_timeout_modifications_require_reauthentication(self):
        now = datetime.now()
        with freeze_time(now):
            res = self.client.patch("/v1/users/@me", {"first_name": "new name"})
            assert res.status_code == 200

        with freeze_time(now + timedelta(seconds=settings.SESSION_SENSITIVE_ACTIONS_AGE - 100)):
            res = self.client.patch("/v1/users/@me", {"first_name": "new name"})
            assert res.status_code == 200

        with freeze_time(now + timedelta(seconds=settings.SESSION_SENSITIVE_ACTIONS_AGE + 10)):
            res = self.client.patch("/v1/users/@me", {"first_name": "new name"})
            assert res.status_code == 403
            assert res.json() == {
                "type": "authentication_error",
                "code": "sensitive_action_required_reauth",
                "detail": "This action requires you to be recently authenticated.",
                "attr": None,
            }

            res = self.client.get("/v1/users/@me")
            assert res.status_code == 200

    def test_user_can_update_theme_without_recent_authentication(self):
        now = datetime.now()
        with freeze_time(now):
            res = self.client.patch("/v1/users/@me", {"theme_mode": "dark"})
            assert res.status_code == 200

        with freeze_time(now + timedelta(seconds=settings.SESSION_SENSITIVE_ACTIONS_AGE + 10)):
            res = self.client.patch("/v1/users/@me", {"theme_mode": "light"})
            assert res.status_code == 200

            res = self.client.patch(
                "/v1/users/@me",
                {"theme_mode": "system", "first_name": "still protected"},
            )
            assert res.status_code == 403

    def test_user_can_switch_organization_without_recent_authentication(self):
        new_org = Organization.objects.create(name="Switch Org")
        Team.objects.create(organization=new_org, name="Switch Team")
        OrganizationMembership.objects.create(organization=new_org, user=self.user)

        now = datetime.now()
        with freeze_time(now):
            res = self.client.patch(
                "/v1/users/@me",
                {"set_current_organization": str(new_org.id)},
            )
            assert res.status_code == 200

        with freeze_time(now + timedelta(seconds=settings.SESSION_SENSITIVE_ACTIONS_AGE + 10)):
            res = self.client.patch(
                "/v1/users/@me",
                {"set_current_organization": str(self.organization.id)},
            )
            assert res.status_code == 200

    @parameterized.expand(
        [
            ("set_current_team", {"set_current_team": "1"}),
            ("events_column_config", {"events_column_config": {"active": "type"}}),
            ("role_at_organization", {"role_at_organization": "engineering"}),
        ]
    )
    def test_user_can_update_non_sensitive_fields_without_recent_authentication(self, _name, payload):
        now = datetime.now()
        with freeze_time(now + timedelta(seconds=settings.SESSION_SENSITIVE_ACTIONS_AGE + 10)):
            res = self.client.patch("/v1/users/@me", payload, format="json")
            assert res.status_code != 403, f"Field update should not require re-authentication, got: {res.json()}"

    def test_user_can_update_mascot_config_without_recent_authentication(self):
        now = datetime.now()
        with freeze_time(now + timedelta(seconds=settings.SESSION_SENSITIVE_ACTIONS_AGE + 10)):
            res = self.client.patch(
                "/v1/users/@me/mascot_config",
                {"enabled": True, "color": "red"},
                format="json",
            )
            assert res.status_code == 200

    def test_user_can_update_scene_personalisation_without_recent_authentication(self):
        from products.dashboards.backend.models.dashboard import Dashboard

        dashboard = Dashboard.objects.create(team=self.team, name="Test")
        now = datetime.now()
        with freeze_time(now + timedelta(seconds=settings.SESSION_SENSITIVE_ACTIONS_AGE + 10)):
            res = self.client.post(
                "/v1/users/@me/scene_personalisation",
                {"scene": "Person", "dashboard": dashboard.id},
                format="json",
            )
            assert res.status_code == 200


class TestTeamSecretTokenAuthentication(APIBaseTest):
    def setUp(self):
        super().setUp()  # Call the setup from APIBaseTest
        self.team.secret_api_token = "sk-JVRb8fNi0XyIKGgUCyi29ZJUOXEr6NF2dKBy5Ws8XVeF11C"
        self.team.save()
        self.factory = APIRequestFactory()  # Use APIRequestFactory instead of RequestFactory

    def test_authenticate_with_valid_secret_api_key_in_header(self):
        # Simulate a request with a valid team secret token
        wsgi_request = self.factory.get(
            "/",
            data=None,
            secure=False,
            headers={"AUTHORIZATION": f"Bearer {self.team.secret_api_token}"},
        )
        request = Request(wsgi_request)  # Wrap the WSGIRequest in a DRF Request

        authenticator = TeamSecretTokenAuthentication()
        result = authenticator.authenticate(request)
        assert result is not None
        user, _ = result

        self.assertIsNotNone(user)
        self.assertIsInstance(user, TeamSecretTokenUser)
        self.assertEqual(user.team, self.team)

    def test_authenticate_tags_queries_with_team_secret_token_access_method(self):
        wsgi_request = self.factory.get("/", headers={"AUTHORIZATION": f"Bearer {self.team.secret_api_token}"})
        request = Request(wsgi_request)
        authenticator = TeamSecretTokenAuthentication()
        with patch("insights.auth.tag_authentication") as mock_tag_authentication:
            authenticator.authenticate(request)
        mock_tag_authentication.assert_called_once_with(
            user_id=None,
            team_id=self.team.id,
            access_method=AccessMethod.TEAM_SECRET_TOKEN,
        )

    def test_authenticate_with_valid_secret_api_key_in_body_not_supported(self):
        # Body tokens were removed after the audit in #66176: even a valid token must not authenticate.
        wsgi_request = self.factory.post(
            "/",
            data=f'{{"secret_api_key": "{self.team.secret_api_token}"}}',
            content_type="application/json",
        )
        request = Request(wsgi_request)  # Wrap the WSGIRequest in a DRF Request
        request.parsers = [JSONParser()]  # Explicitly set JSONParser

        authenticator = TeamSecretTokenAuthentication()
        result = authenticator.authenticate(request)

        self.assertIsNone(result)

    def test_authenticate_with_secret_api_key_in_query_string_not_supported(self):
        # Query string authentication should not be supported for security reasons
        wsgi_request = self.factory.get(f"/?secret_api_key={self.team.secret_api_token}")
        request = Request(wsgi_request)  # Wrap the WSGIRequest in a DRF Request

        authenticator = TeamSecretTokenAuthentication()
        result = authenticator.authenticate(request)

        self.assertIsNone(result)

    def test_authenticate_with_invalid_secret_api_key(self):
        # Simulate a request with an invalid team secret token
        wsgi_request = self.factory.get("/", HTTP_AUTHORIZATION="Bearer sk-NOT_A_VALID_KEY")
        request = Request(wsgi_request)  # Wrap the WSGIRequest in a DRF Request

        authenticator = TeamSecretTokenAuthentication()
        result = authenticator.authenticate(request)

        self.assertIsNone(result)

    def test_authenticate_without_secret_api_key(self):
        # Simulate a request without a team secret token
        wsgi_request = self.factory.get("/")
        request = Request(wsgi_request)  # Wrap the WSGIRequest in a DRF Request

        authenticator = TeamSecretTokenAuthentication()
        result = authenticator.authenticate(request)

        self.assertIsNone(result)

    def test_authenticate_with_matching_project_api_key_in_body(self):
        # Test that when project token in body matches the secret key's team, it passes
        wsgi_request = self.factory.post(
            "/",
            data=f'{{"project_api_key": "{self.team.api_token}"}}',
            content_type="application/json",
            headers={"AUTHORIZATION": f"Bearer {self.team.secret_api_token}"},
        )
        request = Request(wsgi_request)
        request.parsers = [JSONParser()]

        authenticator = TeamSecretTokenAuthentication()
        result = authenticator.authenticate(request)

        assert result is not None
        user, _ = result
        self.assertIsInstance(user, TeamSecretTokenUser)
        self.assertEqual(user.team, self.team)

    def test_authenticate_with_no_project_api_key_in_body_passes(self):
        # Test that when there's no project token in body, it still works normally
        wsgi_request = self.factory.post(
            "/",
            data='{"some_other_field": "value"}',
            content_type="application/json",
            headers={"AUTHORIZATION": f"Bearer {self.team.secret_api_token}"},
        )
        request = Request(wsgi_request)
        request.parsers = [JSONParser()]

        authenticator = TeamSecretTokenAuthentication()
        result = authenticator.authenticate(request)

        assert result is not None
        user, _ = result
        self.assertIsInstance(user, TeamSecretTokenUser)
        self.assertEqual(user.team, self.team)


class TestSyntheticUser(SimpleTestCase):
    def _team(self, team_id=42):
        return type("FakeTeam", (), {"id": team_id})()

    def test_base_class_requires_distinct_id(self):
        from insights.synthetic_user import SyntheticUser

        with self.assertRaises(TypeError):
            SyntheticUser(self._team())  # type: ignore[call-arg]

    def test_team_secret_token_user_distinct_id_includes_team_id(self):
        user = TeamSecretTokenUser(self._team(team_id=42))
        self.assertEqual(user.distinct_id, "team-secret-token-42")
        self.assertEqual(user.current_team_id, 42)
        self.assertTrue(user.is_authenticated)
        self.assertIsNone(user.id)

    def test_project_secret_api_key_user_carries_psak_and_distinct_id(self):
        team = self._team(team_id=7)
        fake_psak = type(
            "FakePSAK",
            (),
            {"team": team, "team_id": team.id, "id": 99, "scopes": ["endpoint:read"]},
        )()
        user = ProjectSecretAPIKeyUser(fake_psak)
        self.assertEqual(user.distinct_id, "psak-7-99")
        self.assertIs(user.project_secret_api_key, fake_psak)
        self.assertIsNone(user.id)

    def test_isinstance_check_recognises_both_subclasses(self):
        from insights.synthetic_user import SyntheticUser

        team = self._team()
        fake_psak = type("FakePSAK", (), {"team": team, "team_id": team.id, "id": 1, "scopes": []})()
        self.assertIsInstance(TeamSecretTokenUser(team), SyntheticUser)
        self.assertIsInstance(ProjectSecretAPIKeyUser(fake_psak), SyntheticUser)

    def test_mutable_attrs_are_isolated_per_instance(self):
        a = TeamSecretTokenUser(self._team(team_id=1))
        b = TeamSecretTokenUser(self._team(team_id=2))

        a.groups.append("x")
        a.user_permissions.append("y")

        self.assertEqual(b.groups, [])
        self.assertEqual(b.user_permissions, [])


class TestExtractSecretKey(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_only_a_secret_marked_key_is_extracted(self):
        # The mint and the resolver are the two ends of one contract, so the keys
        # here are minted rather than spelled. Only a secret belongs to a secret
        # backend; every other kind is left for the authenticator that owns it.
        for kind in KeyKind:
            key = mint(kind)
            wsgi_request = self.factory.get("/", HTTP_AUTHORIZATION=f"Bearer {key}")
            extracted = _extract_secret_key(Request(wsgi_request))
            if kind is KeyKind.SECRET:
                self.assertEqual(extracted, key)
            else:
                self.assertIsNone(extracted, f"{kind.value} key reached the secret resolver")

    def test_valid_token_in_header_returned(self):
        token = "sk-" + "x" * 35
        wsgi_request = self.factory.get("/", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(_extract_secret_key(Request(wsgi_request)), token)

    def test_body_token_ignored(self):
        token = "sk-" + "y" * 35
        wsgi_request = self.factory.post(
            "/",
            data=json.dumps({"secret_api_key": token}),
            content_type="application/json",
        )
        request = Request(wsgi_request)
        request.parsers = [JSONParser()]
        self.assertIsNone(_extract_secret_key(request))

    def test_no_token_anywhere_returns_none(self):
        wsgi_request = self.factory.get("/")
        self.assertIsNone(_extract_secret_key(Request(wsgi_request)))


class TestProjectSecretAPIKeyAuthentication(APIBaseTest):
    def setUp(self):
        super().setUp()
        self.factory = APIRequestFactory()
        self.token = "sk-" + "a" * 35
        self.psak = ProjectSecretAPIKey.objects.create(
            team=self.team,
            label="psak-test",
            mask_value="sk-...aaaa",
            secure_value=hash_key_value(self.token),
            scopes=["endpoint:read"],
        )

    def _request_with_header(self, token):
        wsgi_request = self.factory.get("/", HTTP_AUTHORIZATION=f"Bearer {token}")
        return Request(wsgi_request)

    def test_authenticate_with_valid_psak_in_header(self):
        authenticator = ProjectSecretAPIKeyAuthentication()
        result = authenticator.authenticate(self._request_with_header(self.token))

        assert result is not None
        user, _ = result
        self.assertIsInstance(user, ProjectSecretAPIKeyUser)
        self.assertEqual(user.team, self.team)
        self.assertEqual(user.project_secret_api_key.pk, self.psak.pk)
        self.assertEqual(authenticator.project_secret_api_key.pk, self.psak.pk)

    def test_authenticate_tags_queries_with_psak_access_method(self):
        authenticator = ProjectSecretAPIKeyAuthentication()
        with patch("insights.auth.tag_authentication") as mock_tag_authentication:
            authenticator.authenticate(self._request_with_header(self.token))
        mock_tag_authentication.assert_called_once_with(
            user_id=None,
            team_id=self.team.id,
            access_method=AccessMethod.PROJECT_SECRET_API_KEY,
            api_key_mask=self.psak.mask_value,
            api_key_label=self.psak.label,
        )

    def test_authenticate_with_psak_in_body_returns_none(self):
        # PSAK auth is header-only: a token in the request body must not authenticate.
        wsgi_request = self.factory.post(
            "/",
            data=json.dumps({"secret_api_key": self.token}),
            content_type="application/json",
        )
        request = Request(wsgi_request)
        request.parsers = [JSONParser()]

        authenticator = ProjectSecretAPIKeyAuthentication()
        result = authenticator.authenticate(request)

        self.assertIsNone(result)

    def test_authenticate_with_unknown_token_returns_none(self):
        unknown_token = "sk-" + "z" * 35
        authenticator = ProjectSecretAPIKeyAuthentication()
        result = authenticator.authenticate(self._request_with_header(unknown_token))
        self.assertIsNone(result)

    def test_does_not_fall_back_to_team_secret_api_token(self):
        # Set Team.secret_api_token to a legacy token; PSAK auth should ignore it.
        legacy_token = "sk-" + "b" * 35
        self.team.secret_api_token = legacy_token
        self.team.save()

        authenticator = ProjectSecretAPIKeyAuthentication()
        result = authenticator.authenticate(self._request_with_header(legacy_token))
        self.assertIsNone(result)

    def test_authenticate_without_token_returns_none(self):
        wsgi_request = self.factory.get("/")
        authenticator = ProjectSecretAPIKeyAuthentication()
        result = authenticator.authenticate(Request(wsgi_request))
        self.assertIsNone(result)

    @parameterized.expand(
        [
            ("public_token", "pk-test_public_token"),
            ("unprefixed", "some_random_token"),
            ("empty", ""),
        ]
    )
    def test_authenticate_with_wrong_prefix_returns_none(self, _name, token):
        authenticator = ProjectSecretAPIKeyAuthentication()
        result = authenticator.authenticate(self._request_with_header(token))
        self.assertIsNone(result)

    def test_last_used_at_updates_on_first_use(self):
        assert self.psak.last_used_at is None
        authenticator = ProjectSecretAPIKeyAuthentication()
        authenticator.authenticate(self._request_with_header(self.token))

        self.psak.refresh_from_db()
        self.assertIsNotNone(self.psak.last_used_at)

    def test_last_used_at_hourly_throttle_skips_recent(self):
        recent = timezone.now() - timedelta(minutes=30)
        ProjectSecretAPIKey.objects.filter(pk=self.psak.pk).update(last_used_at=recent)

        authenticator = ProjectSecretAPIKeyAuthentication()
        authenticator.authenticate(self._request_with_header(self.token))

        self.psak.refresh_from_db()
        # Should not update if less than 1 hour has passed
        assert self.psak.last_used_at is not None
        assert abs((self.psak.last_used_at - recent).total_seconds()) < 1

    def test_last_used_at_updates_after_one_hour(self):
        old = timezone.now() - timedelta(hours=2)
        ProjectSecretAPIKey.objects.filter(pk=self.psak.pk).update(last_used_at=old)

        authenticator = ProjectSecretAPIKeyAuthentication()
        authenticator.authenticate(self._request_with_header(self.token))

        self.psak.refresh_from_db()
        assert self.psak.last_used_at is not None
        # Should have updated to a recent timestamp
        self.assertGreater(self.psak.last_used_at, old + timedelta(hours=1))


class TestOAuthAccessTokenAuthentication(APIBaseTest):
    def setUp(self):
        super().setUp()
        self.factory = APIRequestFactory()

        self.oauth_app = OAuthApplication.objects.create(
            name="Test App",
            client_type=OAuthApplication.CLIENT_CONFIDENTIAL,
            authorization_grant_type=OAuthApplication.GRANT_AUTHORIZATION_CODE,
            redirect_uris="https://example.com/callback",
            algorithm="RS256",
            skip_authorization=False,
            organization=self.organization,
            user=self.user,
        )

        self.access_token = OAuthAccessToken.objects.create(
            user=self.user,
            application=self.oauth_app,
            token="at-test_access_token_123",
            expires=timezone.now() + timedelta(hours=1),
            scope="openid profile",
        )

    def test_authenticate_with_valid_oauth_token(self):
        wsgi_request = self.factory.get(
            "/",
            headers={"AUTHORIZATION": f"Bearer {self.access_token.token}"},
        )
        request = Request(wsgi_request)

        authenticator = OAuthAccessTokenAuthentication()
        result = authenticator.authenticate(request)

        self.assertIsNotNone(result)
        user, _ = cast(tuple[User, None], result)

        self.assertEqual(user, self.user)
        self.assertIsNone(_)

    def test_authenticate_with_invalid_oauth_token(self):
        wsgi_request = self.factory.get(
            "/",
            headers={"AUTHORIZATION": "Bearer at-invalid_token_123"},
        )
        request = Request(wsgi_request)

        authenticator = OAuthAccessTokenAuthentication()

        with self.assertRaises(AuthenticationFailed) as context:
            authenticator.authenticate(request)

        self.assertEqual(str(context.exception.detail), "Invalid access token.")

    def test_authenticate_with_expired_oauth_token(self):
        expired_token = OAuthAccessToken.objects.create(
            user=self.user,
            application=self.oauth_app,
            token="at-expired_token_123",
            expires=timezone.now() - timedelta(hours=1),
            scope="openid profile",
        )

        wsgi_request = self.factory.get(
            "/",
            headers={"AUTHORIZATION": f"Bearer {expired_token.token}"},
        )
        request = Request(wsgi_request)

        authenticator = OAuthAccessTokenAuthentication()

        with self.assertRaises(AuthenticationFailed) as context:
            authenticator.authenticate(request)

        self.assertIn("Access token has expired", str(context.exception))

    def test_authenticate_with_inactive_user(self):
        self.user.is_active = False
        self.user.save()

        wsgi_request = self.factory.get(
            "/",
            headers={"AUTHORIZATION": f"Bearer {self.access_token.token}"},
        )
        request = Request(wsgi_request)

        authenticator = OAuthAccessTokenAuthentication()

        with self.assertRaises(AuthenticationFailed) as context:
            authenticator.authenticate(request)

        self.assertIn("User associated with access token is disabled", str(context.exception))

    def test_authenticate_without_bearer_token(self):
        wsgi_request = self.factory.get("/")
        request = Request(wsgi_request)

        authenticator = OAuthAccessTokenAuthentication()
        result = authenticator.authenticate(request)

        self.assertIsNone(result)

    @patch("insights.auth.tag_authentication")
    def test_authenticate_tags_queries_correctly(self, mock_tag_authentication):
        wsgi_request = self.factory.get(
            "/",
            headers={"AUTHORIZATION": f"Bearer {self.access_token.token}"},
        )
        request = Request(wsgi_request)

        authenticator = OAuthAccessTokenAuthentication()
        result = authenticator.authenticate(request)

        self.assertIsNotNone(result)

        mock_tag_authentication.assert_called_once_with(
            user_id=self.user.pk,
            team_id=self.team.pk,
            access_method="oauth",
        )

    def test_authenticate_header_returns_correct_value(self):
        wsgi_request = self.factory.get("/")
        request = Request(wsgi_request)

        authenticator = OAuthAccessTokenAuthentication()
        header = authenticator.authenticate_header(request)

        self.assertEqual(header, "Bearer")

    def test_authenticate_with_nonexistent_token_returns_none_for_next_auth_method(self):
        """Test that when a token doesn't exist in the database, the method returns None
        to allow the next authentication method to have a go."""
        wsgi_request = self.factory.get(
            "/",
            headers={"AUTHORIZATION": "Bearer nonexistent_token_123"},
        )
        request = Request(wsgi_request)

        authenticator = OAuthAccessTokenAuthentication()
        result = authenticator.authenticate(request)

        # Should return None, not raise an exception
        self.assertIsNone(result)

    def test_authenticate_with_token_validation_error_raises_exception(self):
        """Test that when there's an error during token validation (not just token not found),
        an AuthenticationFailed exception is raised."""
        # Create a token without an associated application
        invalid_token = OAuthAccessToken.objects.create(
            user=self.user,
            application=None,  # This will cause a validation error
            token="at-invalid_app_token_123",
            expires=timezone.now() + timedelta(hours=1),
            scope="openid profile",
        )

        wsgi_request = self.factory.get(
            "/",
            headers={"AUTHORIZATION": f"Bearer {invalid_token.token}"},
        )
        request = Request(wsgi_request)

        authenticator = OAuthAccessTokenAuthentication()

        with self.assertRaises(AuthenticationFailed) as context:
            authenticator.authenticate(request)

        self.assertIn("Access token is not associated with a valid application", str(context.exception))

    def test_authenticate_with_user_not_found_raises_exception(self):
        """Test that when the user associated with the token is not found,
        an AuthenticationFailed exception is raised."""
        # Create a token without a user
        token_without_user = OAuthAccessToken.objects.create(
            user=None,
            application=self.oauth_app,
            token="at-no_user_token_123",
            expires=timezone.now() + timedelta(hours=1),
            scope="openid profile",
        )

        wsgi_request = self.factory.get(
            "/",
            headers={"AUTHORIZATION": f"Bearer {token_without_user.token}"},
        )
        request = Request(wsgi_request)

        authenticator = OAuthAccessTokenAuthentication()

        with self.assertRaises(AuthenticationFailed) as context:
            authenticator.authenticate(request)

        self.assertIn("User associated with access token not found", str(context.exception))

    def test_oauth_access_token_user_properties_are_accessible(self):
        """Test that user.id and user.current_team_id are accessible for tag_queries."""
        # Test that the user has the required properties
        self.assertIsNotNone(self.access_token.user.id)
        self.assertIsInstance(self.access_token.user.id, int)
        self.assertEqual(self.access_token.user.id, self.user.pk)

        # Test that current_team_id is accessible
        self.assertIsNotNone(self.access_token.user.current_team_id)
        self.assertIsInstance(self.access_token.user.current_team_id, int)
        self.assertEqual(self.access_token.user.current_team_id, self.team.pk)

    def test_oauth_access_token_calls_tag_queries_with_correct_parameters(self):
        """Test that tag_queries is called with the correct user_id and team_id."""
        with patch("insights.auth.tag_authentication") as mock_tag_authentication:
            wsgi_request = self.factory.get(
                "/",
                headers={"AUTHORIZATION": f"Bearer {self.access_token.token}"},
            )
            request = Request(wsgi_request)

            authenticator = OAuthAccessTokenAuthentication()
            result = authenticator.authenticate(request)

            self.assertIsNotNone(result)
            self.assertIsInstance(self.user.pk, int)
            self.assertIsInstance(self.user.current_team_id, int)

            # Verify tag_queries was called with correct parameters
            mock_tag_authentication.assert_called_once_with(
                user_id=self.user.pk,
                team_id=self.user.current_team_id,
                access_method="oauth",
            )

    def test_authenticate_without_pha_prefix_returns_none(self):
        """Test that tokens without the at- prefix are skipped by OAuth authentication,
        allowing PersonalAPIKeyAuthentication to handle them."""
        wsgi_request = self.factory.get(
            "/",
            headers={"AUTHORIZATION": "Bearer random_token_without_prefix"},
        )
        request = Request(wsgi_request)

        authenticator = OAuthAccessTokenAuthentication()
        result = authenticator.authenticate(request)

        self.assertIsNone(result)


class TestOAuthLoginNotification(APIBaseTest):
    CONFIG_AUTO_LOGIN = False

    @staticmethod
    def _build_strategy(rf: RequestFactory, user_agent: str, ip: str, cookies: dict | None = None):
        req = rf.get("/", HTTP_USER_AGENT=user_agent, REMOTE_ADDR=ip)
        if cookies:
            req.COOKIES.update(cookies)

        class Strategy:
            def __init__(self, r):
                self.request = r

            def session_get(self, key, default=None):
                return None

        return Strategy(req)

    def test_notification_sent_on_new_device_login(self):
        user = User.objects.create(email="test@gmail.com", distinct_id=str(uuid.uuid4()))
        rf = RequestFactory()
        Backend = type("Backend", (), {"name": "google-oauth2"})
        ua1, ip1 = "BrowserA/99.0 (X11; Linux x86_64)", "1.1.1.1"

        # test SMTP email notification
        set_instance_setting("EMAIL_HOST", "localhost")
        with self.settings(CELERY_TASK_ALWAYS_EAGER=True, CUSTOMER_IO_API_KEY=None):
            social_login_notification(self._build_strategy(rf, ua1, ip1), Backend(), user)
            assert len(mail.outbox) == 1

    def test_notification_not_sent_on_same_device_second_login(self):
        user = User.objects.create(email="test@gmail.com", distinct_id=str(uuid.uuid4()))
        rf = RequestFactory()
        Backend = type("Backend", (), {"name": "google-oauth2"})
        ua1, ip1 = "BrowserA/99.0 (X11; Linux x86_64)", "1.1.1.1"

        # test SMTP email notification
        set_instance_setting("EMAIL_HOST", "localhost")
        with self.settings(CELERY_TASK_ALWAYS_EAGER=True, CUSTOMER_IO_API_KEY=None):
            social_login_notification(self._build_strategy(rf, ua1, ip1), Backend(), user)
            assert len(mail.outbox) == 1
            social_login_notification(self._build_strategy(rf, ua1, ip1), Backend(), user)
            assert len(mail.outbox) == 1

    def test_notification_sent_on_second_distinct_device_login(self):
        user = User.objects.create(email="test@gmail.com", distinct_id=str(uuid.uuid4()))
        rf = RequestFactory()
        Backend = type("Backend", (), {"name": "google-oauth2"})
        ua1, ip1 = "BrowserA/99.0 (X11; Linux x86_64)", "1.1.1.1"
        ua2, ip2 = "BrowserB/100.0 (Macintosh; Intel Mac OS X)", "2.2.2.2"

        # test SMTP email notification
        set_instance_setting("EMAIL_HOST", "localhost")
        with self.settings(CELERY_TASK_ALWAYS_EAGER=True, CUSTOMER_IO_API_KEY=None):
            social_login_notification(self._build_strategy(rf, ua1, ip1), Backend(), user)
            assert len(mail.outbox) == 1
            social_login_notification(self._build_strategy(rf, ua2, ip2), Backend(), user)
            assert len(mail.outbox) == 2

    def test_notification_skipped_when_known_device_cookie_present(self):
        user = User.objects.create(email="test@gmail.com", distinct_id=str(uuid.uuid4()))
        rf = RequestFactory()
        Backend = type("Backend", (), {"name": "google-oauth2"})
        ua1, ip1 = "BrowserA/99.0 (X11; Linux x86_64)", "1.1.1.1"
        ua2, ip2 = "BrowserB/100.0 (Macintosh; Intel Mac OS X)", "2.2.2.2"

        set_instance_setting("EMAIL_HOST", "localhost")
        with self.settings(CELERY_TASK_ALWAYS_EAGER=True, CUSTOMER_IO_API_KEY=None):
            # First login from device 1 — notification sent
            social_login_notification(self._build_strategy(rf, ua1, ip1), Backend(), user)
            assert len(mail.outbox) == 1

            # Second login with different fingerprint BUT valid signed cookie — notification skipped
            signed_value = build_known_device_cookie_value(user)
            social_login_notification(
                self._build_strategy(rf, ua2, ip2, cookies={KNOWN_DEVICE_COOKIE.format(user_id=user.id): signed_value}),
                Backend(),
                user,
            )
            assert len(mail.outbox) == 1

    def test_notification_sent_when_cookie_value_is_forged(self):
        user = User.objects.create(email="test@gmail.com", distinct_id=str(uuid.uuid4()))
        rf = RequestFactory()
        Backend = type("Backend", (), {"name": "google-oauth2"})
        ua1, ip1 = "BrowserA/99.0 (X11; Linux x86_64)", "1.1.1.1"

        set_instance_setting("EMAIL_HOST", "localhost")
        with self.settings(CELERY_TASK_ALWAYS_EAGER=True, CUSTOMER_IO_API_KEY=None):
            # Attacker-forged cookie without a valid signature should not suppress the notification
            social_login_notification(
                self._build_strategy(rf, ua1, ip1, cookies={KNOWN_DEVICE_COOKIE.format(user_id=user.id): "1"}),
                Backend(),
                user,
            )
            assert len(mail.outbox) == 1

    def test_signup_then_same_device_login_no_notification(self):
        user = User.objects.create(email="test@gmail.com", distinct_id=str(uuid.uuid4()))
        rf = RequestFactory()
        Backend = type("Backend", (), {"name": "google-oauth2"})
        ua1, ip1 = "BrowserA/99.0 (X11; Linux x86_64)", "1.1.1.1"

        # test SMTP email notification
        set_instance_setting("EMAIL_HOST", "localhost")
        with self.settings(CELERY_TASK_ALWAYS_EAGER=True, CUSTOMER_IO_API_KEY=None):
            # simulating signup with post_login signal
            req_signup = rf.get("/", HTTP_USER_AGENT=ua1, REMOTE_ADDR=ip1)
            middleware = SessionMiddleware(lambda r: r)
            middleware.process_request(req_signup)
            req_signup.session.save()
            post_login(None, user, req_signup)
            assert len(mail.outbox) == 0

            social_login_notification(self._build_strategy(rf, ua1, ip1), Backend(), user)
            assert len(mail.outbox) == 0


class TestKnownLoginDeviceCookieMiddleware(APIBaseTest):
    CONFIG_AUTO_LOGIN = False

    def test_middleware_sets_signed_cookie_after_login(self):
        response = self.client.post("/v1/login/", {"email": self.CONFIG_EMAIL, "password": self.CONFIG_PASSWORD})
        cookie = response.cookies.get(KNOWN_DEVICE_COOKIE.format(user_id=self.user.id))
        assert cookie is not None
        assert cookie.value != "1"  # signed, not a plain flag
        assert cookie["httponly"] is True
        assert cookie["samesite"] == "Lax"

        # Pass cookie back into a request and confirm the verifier accepts the signature
        req = RequestFactory().get("/")
        req.COOKIES[KNOWN_DEVICE_COOKIE.format(user_id=self.user.id)] = cookie.value
        assert has_valid_known_device_cookie(req, self.user)

    def test_known_cookie_suppresses_notification(self):
        set_instance_setting("EMAIL_HOST", "localhost")
        new_device_subject = "A new device logged into your account"
        with self.settings(CELERY_TASK_ALWAYS_EAGER=True, CUSTOMER_IO_API_KEY=None):
            # First login - sets cookie and sends new-device notification
            self.client.post("/v1/login/", {"email": self.CONFIG_EMAIL, "password": self.CONFIG_PASSWORD})
            initial_count = sum(1 for m in mail.outbox if m.subject == new_device_subject)

            # Second login - signed cookie is present, new-device notification must be skipped
            self.client.post("/v1/login/", {"email": self.CONFIG_EMAIL, "password": self.CONFIG_PASSWORD})
            assert sum(1 for m in mail.outbox if m.subject == new_device_subject) == initial_count

    @patch("insights.middleware.is_impersonated_session", return_value=True)
    def test_middleware_does_not_set_cookie_during_impersonation(self, _mock_is_impersonated):
        # Log in first so the client has an authenticated session
        self.client.post("/v1/login/", {"email": self.CONFIG_EMAIL, "password": self.CONFIG_PASSWORD})

        response = self.client.get("/v1/users/@me/")
        assert response.status_code == 200
        assert KNOWN_DEVICE_COOKIE.format(user_id=self.user.id) not in response.cookies

    def test_does_not_set_known_device_cookie_for_internal_api_user(self):
        request = RequestFactory().get("/v1/internal/insights_flows/process_due_schedules")
        SessionMiddleware(lambda r: HttpResponse()).process_request(request)
        # Simulate a session that *looks* logged-in to prove the synthetic-user guard wins on its own
        request.session[BACKEND_SESSION_KEY] = "django.contrib.auth.backends.ModelBackend"
        request.__dict__["user"] = InternalAPIUser()

        response = KnownLoginDeviceCookieMiddleware(lambda r: HttpResponse())(request)

        assert response.status_code == 200
        assert not any(name.startswith("ph_device_") for name in response.cookies)

    def test_does_not_set_known_device_cookie_when_session_accessed_without_login(self):
        # Regression: under ASGI, hanzo_insights' middleware awaits `request.auser`, which reads
        # the session and sets `session.accessed=True` even on requests that never went through
        # `auth.login()`. The gate must rely on `BACKEND_SESSION_KEY`, not on `session.accessed`.
        request = RequestFactory().get("/v1/some_endpoint")
        SessionMiddleware(lambda r: HttpResponse()).process_request(request)
        # Touch the session the way an upstream middleware would — flips `accessed` but does not log in
        request.session.get("anything")
        assert request.session.accessed is True
        assert BACKEND_SESSION_KEY not in request.session
        request.__dict__["user"] = self.user

        response = KnownLoginDeviceCookieMiddleware(lambda r: HttpResponse())(request)

        assert response.status_code == 200
        assert not any(name.startswith("ph_device_") for name in response.cookies)


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_known_device_cookie_async_chain_with_project_secret_api_key():
    """Reproduces the production crash on the original (pre-fix) middleware: against the
    initial known-device cookie code (commit 177ab2ded11), this test fails with the exact
    prod stack trace —

        File "insights/middleware.py", in __call__
            set_known_device_cookie(response, request.user)
        File "insights/helpers/user_devices.py", in set_known_device_cookie
            KNOWN_DEVICE_COOKIE.format(user_id=user.id),
        AttributeError: 'ProjectSecretAPIKeyUser' object has no attribute 'id'

    Drives the real ASGI middleware chain via httpx + ASGITransport (patterned after
    insights-python's integration_tests/django5). Sync `Client` skips the ASGI app and so
    cannot reproduce the failure — the chain depends on InsightsContextMiddleware.__acall__
    awaiting request.auser(), which goes through Django's separate `_acached_user` cache
    and re-reads the session that InsightsTokenCookieMiddleware reset mid-chain, flipping
    `accessed=True` and opening the gate against the non-User principal.
    """

    @sync_to_async
    def setup_team_and_flag():
        org = Organization.objects.create(name="Test Org")
        user = User.objects.create_user(
            email=f"test-{uuid.uuid4()}@example.com",
            first_name="Test",
            password=VALID_TEST_PASSWORD,
        )
        org.members.add(user)
        team = Team.objects.create(organization=org, name="Test Team")
        team.rotate_secret_token_and_save(user=user, is_impersonated_session=False)
        FeatureFlag.objects.create(
            team=team,
            key="rc-async-test",
            name="RC",
            active=True,
            filters={
                "groups": [{"properties": [], "rollout_percentage": 100}],
                "payloads": {"true": '{"x": 1}'},
            },
            is_remote_configuration=True,
        )
        return team

    team = await setup_team_and_flag()

    asgi_app = get_asgi_application()
    # httpx ASGITransport's `app` type spec is stricter than Django's ASGIHandler signature; the
    # protocols are compatible at runtime, just disagree on dict/MutableMapping in the typing.
    async with AsyncClient(transport=ASGITransport(app=asgi_app), base_url="http://testserver") as ac:  # type: ignore[arg-type]
        response = await ac.get(
            f"/v1/projects/{team.id}/feature_flags/rc-async-test/remote_config",
            headers={"authorization": f"Bearer {team.secret_api_token}"},
        )

    assert response.status_code == status.HTTP_200_OK, response.text
    assert not any(name.startswith("ph_device_") for name in response.cookies)
