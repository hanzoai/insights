import uuid
from datetime import timedelta
from typing import cast
from urllib.parse import quote, unquote

import pytest
from freezegun.api import freeze_time
from insights.test.base import APIBaseTest, NonAtomicBaseTest
from unittest import mock
from unittest.mock import ANY, patch

from django.core.cache import cache
from django.db import connection
from django.test import SimpleTestCase
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from django.utils.text import slugify

from parameterized import parameterized
from rest_framework import status

from insights.api.oauth.toolbar_service import ToolbarOAuthState, build_toolbar_oauth_state, new_state_nonce
from insights.api.user import UserSerializer
from insights.constants import AvailableFeature
from insights.models import Team, User
from insights.models.oauth import OAuthAccessToken, OAuthApplication, OAuthGrant, OAuthRefreshToken
from insights.models.organization import Organization, OrganizationMembership
from insights.models.organization_domain import OrganizationDomain
from insights.models.personal_api_key import PersonalAPIKey
from insights.models.user import default_ui_configuration_for_new_users
from insights.models.utils import generate_random_token_personal, hash_key_value
from insights.models.webauthn_credential import WebauthnCredential
from insights.temporal.tests.delete_teams.inline import execute_deletion_workflows_inline

from products.dashboards.backend.models.dashboard import Dashboard

try:
    from insights.models.ee_models import AccessControl
except ImportError:
    pass


def create_user(email: str, password: str, organization: Organization):
    """
    Helper that just creates a user. It currently uses the orm, but we
    could use either the api, or django admin to create, to get better parity
    with real world scenarios.
    """
    return User.objects.create_and_join(organization, email, password)


class TestUserAPI(APIBaseTest):
    new_org: Organization = None  # type: ignore
    new_project: Team = None  # type: ignore
    CONFIG_PASSWORD = "testpassword12345"

    def _assert_current_org_and_team_unchanged(self):
        self.user.refresh_from_db()
        self.assertEqual(self.user.current_team, self.team)
        self.assertEqual(self.user.current_organization, self.organization)

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.new_org = Organization.objects.create(name="New Organization")
        cls.new_project = Team.objects.create(name="New Project", organization=cls.new_org)
        cls.user.join(organization=cls.new_org)
        cls.user.current_organization = cls.organization
        cls.user.current_team = cls.team
        cls.user.save()

    def setUp(self):
        # prevent throttling of user requests to pass on from one test
        # to the next
        cache.clear()
        return super().setUp()

    # RETRIEVING USER

    def test_retrieve_current_user(self):
        response = self.client.get("/v1/users/@me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()

        self.assertEqual(response_data["uuid"], str(self.user.uuid))
        self.assertEqual(response_data["distinct_id"], self.user.distinct_id)
        self.assertEqual(response_data["first_name"], self.user.first_name)
        self.assertEqual(response_data["email"], self.user.email)
        self.assertEqual(response_data["is_staff"], False)
        self.assertNotIn("password", response_data)
        self.assertNotIn("current_password", response_data)
        self.assertNotIn("has_password", response_data)
        self.assertNotIn("set_current_team", response_data)
        self.assertEqual(response_data["team"]["id"], self.team.id)
        self.assertEqual(response_data["team"]["name"], self.team.name)
        self.assertEqual(response_data["team"]["api_token"], "token123")
        self.assertNotIn("test_account_filters", response_data["team"])  # Ensure we're not returning the full `Team`
        self.assertNotIn("event_names", response_data["team"])
        self.assertEqual(response_data["role_at_organization"], self.user.role_at_organization)

        self.assertEqual(response_data["organization"]["name"], self.organization.name)
        self.assertEqual(response_data["organization"]["membership_level"], 1)
        self.assertEqual(response_data["organization"]["teams"][0]["id"], self.team.id)
        self.assertEqual(response_data["organization"]["teams"][0]["name"], self.team.name)
        self.assertNotIn(
            "test_account_filters", response_data["organization"]["teams"][0]
        )  # Ensure we're not returning the full `Team`
        self.assertNotIn("event_names", response_data["organization"]["teams"][0])

        self.assertCountEqual(
            response_data["organizations"],
            [
                {
                    "id": str(self.organization.id),
                    "name": self.organization.name,
                    "slug": slugify(self.organization.name),
                    "logo_media_id": None,
                    "membership_level": 1,
                    "members_can_use_personal_api_keys": True,
                    "is_active": True,
                    "is_not_active_reason": None,
                    "is_pending_deletion": False,
                },
                {
                    "id": str(self.new_org.id),
                    "name": "New Organization",
                    "slug": "new-organization",
                    "logo_media_id": None,
                    "membership_level": 1,
                    "members_can_use_personal_api_keys": True,
                    "is_active": True,
                    "is_not_active_reason": None,
                    "is_pending_deletion": False,
                },
            ],
        )

    def test_me_membership_queries_do_not_scale_with_org_count(self):
        def me_membership_queries(user: User) -> tuple[int, dict]:
            self.client.force_login(user)
            with CaptureQueriesContext(connection) as ctx:
                response = self.client.get("/v1/users/@me/")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            count = sum(
                1
                for q in ctx.captured_queries
                if "insights_organizationmembership" in q["sql"] and q["sql"].lstrip()[:6].upper() == "SELECT"
            )
            return count, response.json()

        user_in_one_org = create_user(
            "one-org@example.com", self.CONFIG_PASSWORD, Organization.objects.create(name="Solo Org")
        )

        owner_org = Organization.objects.create(name="Owner Org")
        user_in_many_orgs = create_user("many-orgs@example.com", self.CONFIG_PASSWORD, owner_org)
        OrganizationMembership.objects.filter(organization=owner_org, user=user_in_many_orgs).update(
            level=OrganizationMembership.Level.OWNER
        )
        member_orgs = [Organization.objects.create(name=f"Member Org {i}") for i in range(5)]
        for org in member_orgs:
            OrganizationMembership.objects.create(
                organization=org, user=user_in_many_orgs, level=OrganizationMembership.Level.MEMBER
            )

        few, _ = me_membership_queries(user_in_one_org)
        many, many_body = me_membership_queries(user_in_many_orgs)

        assert few > 0, "membership query predicate matched nothing; the table/SELECT filter is wrong"
        assert many == few, f"membership_level is N+1: {many} membership queries for 6 orgs vs {few} for 1 org"

        levels_by_org = {org["id"]: org["membership_level"] for org in many_body["organizations"]}
        assert levels_by_org[str(owner_org.id)] == OrganizationMembership.Level.OWNER
        assert levels_by_org[str(member_orgs[0].id)] == OrganizationMembership.Level.MEMBER

    def test_current_user_includes_pending_invites(self):
        from insights.models import OrganizationInvite

        other_org = Organization.objects.create(name="Other Org For Pending Invites Test")
        matching_invite = OrganizationInvite.objects.create(
            organization=other_org,
            target_email=self.user.email,
            created_by=self.user,
        )

        # Invite for a different email — should be ignored.
        OrganizationInvite.objects.create(
            organization=self.organization,
            target_email="someone-else@example.com",
            created_by=self.user,
        )

        # Invite to an org the user already belongs to — should be ignored.
        OrganizationInvite.objects.create(
            organization=self.organization,
            target_email=self.user.email,
            created_by=self.user,
        )

        response = self.client.get("/v1/users/@me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        pending_invites = response.json()["pending_invites"]
        self.assertEqual(len(pending_invites), 1)
        self.assertEqual(pending_invites[0]["id"], str(matching_invite.id))
        self.assertEqual(pending_invites[0]["organization_id"], str(other_org.id))
        self.assertEqual(pending_invites[0]["organization_name"], "Other Org For Pending Invites Test")
        self.assertEqual(pending_invites[0]["target_email"], self.user.email)

    def test_current_user_pending_invites_matches_email_case_insensitively(self):
        from insights.models import OrganizationInvite

        other_org = Organization.objects.create(name="Other Org For Pending Invites Test")
        OrganizationInvite.objects.create(
            organization=other_org,
            target_email=self.user.email.upper(),
            created_by=self.user,
        )

        response = self.client.get("/v1/users/@me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["pending_invites"]), 1)

    def test_current_user_pending_invites_excludes_expired(self):
        from insights.constants import INVITE_DAYS_VALIDITY
        from insights.models import OrganizationInvite

        other_org = Organization.objects.create(name="Other Org For Pending Invites Test")
        with freeze_time(timezone.now() - timedelta(days=INVITE_DAYS_VALIDITY + 1)):
            OrganizationInvite.objects.create(
                organization=other_org,
                target_email=self.user.email,
                created_by=self.user,
            )

        response = self.client.get("/v1/users/@me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["pending_invites"]), 0)

    def test_mascot_config_is_unset(self):
        self.user.mascot_config = None
        self.user.save()

        response = self.client.get(f"/v1/users/@me/mascot_config/")
        assert response.status_code == status.HTTP_200_OK
        # the front end assumes it will _always_ get JSON
        assert response.json() == {}

    def test_mascot_config_is_set(self):
        self.user.mascot_config = {"a bag": "of data"}
        self.user.save()

        response = self.client.get(f"/v1/users/@me/mascot_config/")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"a bag": "of data"}

    def test_can_update_ui_configuration(self):
        configuration = {
            "version": 1,
            "sidebar": {
                "sections": {"recents": {"visible": False}},
                "items": {"data": {"visible": False}},
            },
        }

        response = self.client.patch("/v1/users/@me/", {"ui_configuration": configuration})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["ui_configuration"], configuration)
        self.user.refresh_from_db()
        self.assertEqual(self.user.ui_configuration, configuration)

    def test_cannot_update_ui_configuration_not_matching_schema(self):
        configuration_before = self.user.ui_configuration

        response = self.client.patch(
            "/v1/users/@me/",
            {"ui_configuration": {"version": 1, "sidebar": {"items": {"bogus": {"visible": False}}}}},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()["attr"], "ui_configuration")
        self.user.refresh_from_db()
        self.assertEqual(self.user.ui_configuration, configuration_before)

    def test_users_me_includes_active_realtime_notification_types(self):
        self.client.force_login(self.user)
        response = self.client.get("/v1/users/@me/")
        assert response.status_code == 200
        body = response.json()
        assert "active_realtime_notification_types" in body
        assert "comment_mention" in body["active_realtime_notification_types"]

    @parameterized.expand(
        [
            ("unreviewed_nothing", False, False, False, False),
            ("unreviewed_pat_only", False, True, False, True),
            ("unreviewed_passkey_only", False, False, True, True),
            ("unreviewed_pat_and_passkey", False, True, True, True),
            ("reviewed_pat_only", True, True, False, False),
            ("reviewed_passkey_only", True, False, True, False),
            ("reviewed_pat_and_passkey", True, True, True, False),
            ("reviewed_nothing", True, False, False, False),
        ]
    )
    def test_requires_credential_review(
        self,
        _name: str,
        reviewed: bool,
        with_key: bool,
        with_passkey: bool,
        expected: bool,
    ):
        self.user.credentials_reviewed_at = timezone.now() if reviewed else None
        self.user.save(update_fields=["credentials_reviewed_at"])
        if with_key:
            PersonalAPIKey.objects.create(
                user=self.user,
                label="Test key",
                secure_value=hash_key_value("sk-test_value_1234567890"),
                scopes=["*"],
            )
        if with_passkey:
            WebauthnCredential.objects.create(
                user=self.user,
                label="Test passkey",
                credential_id=b"test-credential-id",
                public_key=b"test-public-key",
                algorithm=-7,
                transports=["internal"],
                verified=True,
            )
        response = self.client.get("/v1/users/@me/")
        assert response.status_code == 200
        assert response.json()["requires_credential_review"] is expected

    def test_requires_credential_review_unverified_passkey(self):
        # Unverified passkeys are the realistic pre-claim attack artifact - a partner
        # session can register a credential without ever completing verification.
        self.user.credentials_reviewed_at = None
        self.user.save(update_fields=["credentials_reviewed_at"])
        WebauthnCredential.objects.create(
            user=self.user,
            label="Unverified passkey",
            credential_id=b"unverified-credential-id",
            public_key=b"test-public-key",
            algorithm=-7,
            transports=["internal"],
            verified=False,
        )
        response = self.client.get("/v1/users/@me/")
        assert response.status_code == 200
        assert response.json()["requires_credential_review"] is True

    def test_credentials_review_complete_endpoint(self):
        User.objects.filter(pk=self.user.pk).update(credentials_reviewed_at=None)
        PersonalAPIKey.objects.create(
            user=self.user,
            label="Test key",
            secure_value=hash_key_value("sk-test_value_1234567890"),
            scopes=["*"],
        )

        response = self.client.get("/v1/users/@me/")
        assert response.json()["requires_credential_review"] is True

        response = self.client.post("/v1/users/@me/credentials_review_complete/")
        assert response.status_code == 204

        refreshed = User.objects.get(pk=self.user.pk)
        assert refreshed.credentials_reviewed_at is not None

        response = self.client.get("/v1/users/@me/")
        assert response.json()["requires_credential_review"] is False

        first_ts = refreshed.credentials_reviewed_at
        response = self.client.post("/v1/users/@me/credentials_review_complete/")
        assert response.status_code == 204
        assert User.objects.get(pk=self.user.pk).credentials_reviewed_at == first_ts

    def test_credentials_review_complete_requires_auth(self):
        self.client.logout()
        response = self.client.post("/v1/users/@me/credentials_review_complete/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_credentials_review_complete_rejects_personal_api_key_auth(self):
        # The partner-issued wildcard PAK is the thing this feature surfaces;
        # accepting it as auth here would let the attacker silently dismiss
        # their own review before the legit owner ever logs in.
        api_key_value = generate_random_token_personal()
        PersonalAPIKey.objects.create(
            user=self.user,
            label="Partner-minted key",
            secure_value=hash_key_value(api_key_value),
            scopes=["*"],
        )
        User.objects.filter(pk=self.user.pk).update(credentials_reviewed_at=None)

        self.client.logout()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key_value}")
        response = self.client.post("/v1/users/@me/credentials_review_complete/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        assert User.objects.get(pk=self.user.pk).credentials_reviewed_at is None

    def test_can_only_list_yourself(self):
        """
        At this moment only the current user can be retrieved from this endpoint.
        """
        response = self.client.get("/v1/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["uuid"], str(self.user.uuid))

        user = self._create_user("newtest@hanzo.ai")
        response = self.client.get(f"/v1/users/{user.uuid}")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            response.json(),
            {
                "type": "authentication_error",
                "code": "permission_denied",
                "detail": "As a non-staff user you're only allowed to access the `@me` user instance.",
                "attr": None,
            },
        )

    def test_unauthenticated_user_cannot_fetch_endpoint(self):
        self.client.logout()
        response = self.client.get("/v1/users/@me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.json(), self.unauthenticated_response())

    def test_non_admin_filter_users_by_email(self):
        org = Organization.objects.create()
        team = Team.objects.create(organization=org, name="Another team")
        user = User.objects.create_and_join(
            org, "foo@bar.com", "<PASSWORD>", first_name="", level=OrganizationMembership.Level.MEMBER
        )
        user.current_team = team
        user.save(update_fields=["current_team"])

        response = self.client.get(f"/v1/users/?email={user.email}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["count"], 0, "Should not return users from another orgs")

    def test_admin_filter_users_by_email(self):
        admin = User.objects.create_and_join(
            self.organization, "admin@admin.com", "pw", first_name="", level=OrganizationMembership.Level.MEMBER
        )
        admin.current_team = self.team
        admin.is_staff = True
        admin.save(update_fields=["current_team", "is_staff"])
        self.client.force_authenticate(admin)
        org = Organization.objects.create()
        team = Team.objects.create(organization=org, name="Another team")
        user = User.objects.create_and_join(
            org, "foo@bar.com", "<PASSWORD>", first_name="", level=OrganizationMembership.Level.MEMBER
        )
        user.current_team = team
        user.save(update_fields=["current_team"])

        response = self.client.get(f"/v1/users/?email={user.email}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["count"], 1, "Admin users should be able to list users from other orgs")
        response_user = response.json()["results"][0]
        self.assertEqual(response_user["email"], user.email)
        self.assertEqual(response_user["id"], user.id, "User id should be returned")

    # CREATING USERS

    def test_creating_users_on_this_endpoint_is_not_supported(self):
        """
        At this moment we don't support creating users on this endpoint. Refer to /v1/signup or
        /v1/organization/@current/members to add users.
        """
        count = User.objects.count()

        response = self.client.post("/v1/users/", {"first_name": "James", "email": "test+james@hanzo.ai"})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(response.json(), self.method_not_allowed_response("POST"))

        self.assertEqual(User.objects.count(), count)

    # UPDATING USER

    @patch("hanzo_insights.capture")
    def test_update_current_user(self, mock_capture):
        another_org = Organization.objects.create(name="Another Org")
        another_team = Team.objects.create(name="Another Team", organization=another_org)
        user = self._create_user("old@hanzo.ai", password="12345678")
        self.client.force_login(user)
        response = self.client.patch(
            "/v1/users/@me/",
            {
                "first_name": "Cooper",
                "anonymize_data": True,
                "events_column_config": {"active": ["column_1", "column_2"]},
                "notification_settings": {"plugin_disabled": False},
                "has_seen_product_intro_for": {"feature_flags": True},
                "uuid": 1,  # should be ignored
                "id": 1,  # should be ignored
                "organization": str(another_org.id),  # should be ignored
                "team": str(another_team.id),  # should be ignored
                "role_at_organization": "engineering",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()

        self.assertNotEqual(response_data["uuid"], 1)
        self.assertEqual(response_data["first_name"], "Cooper")
        self.assertEqual(response_data["anonymize_data"], True)
        self.assertEqual(response_data["events_column_config"], {"active": ["column_1", "column_2"]})
        self.assertEqual(response_data["organization"]["id"], str(self.organization.id))
        self.assertEqual(response_data["team"]["id"], self.team.id)
        self.assertEqual(response_data["has_seen_product_intro_for"], {"feature_flags": True})
        self.assertEqual(response_data["role_at_organization"], "engineering")

        user.refresh_from_db()
        self.assertNotEqual(user.pk, 1)
        self.assertNotEqual(user.uuid, 1)
        self.assertEqual(user.first_name, "Cooper")
        self.assertEqual(user.anonymize_data, True)
        self.assertLessEqual({"plugin_disabled": False}.items(), user.notification_settings.items())
        self.assertEqual(user.has_seen_product_intro_for, {"feature_flags": True})
        self.assertEqual(user.role_at_organization, "engineering")

        # UserSerializer.to_representation also fires hanzo_insights.capture
        # for the "update user properties" identify, so use assert_any_call to
        # find the "user updated" event we actually care about here.
        mock_capture.assert_any_call(
            event="user updated",
            distinct_id=user.distinct_id,
            properties={
                "updated_attrs": [
                    "anonymize_data",
                    "events_column_config",
                    "first_name",
                    "has_seen_product_intro_for",
                    "partial_notification_settings",
                    "role_at_organization",
                ],
                "$set": mock.ANY,
            },
            groups={
                "instance": ANY,
                "organization": str(self.team.organization_id),
                "project": str(self.team.uuid),
            },
        )

    @patch("hanzo_insights.capture")
    def test_set_scene_personalisation_for_user_dashboard_must_be_in_current_team(self, _mock_capture):
        a_third_team = Team.objects.create(name="A Third Team", organization=self.organization)

        dashboard_one = Dashboard.objects.create(team=a_third_team, name="Dashboard 1")

        response = self.client.post(
            "/v1/users/@me/scene_personalisation",
            # even if someone tries to send a different user or team they are ignored
            {
                "user": 12345,
                "team": 12345,
                "dashboard": str(dashboard_one.id),
                "scene": "Person",
            },
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch("hanzo_insights.capture")
    def test_set_scene_personalisation_for_user_dashboard_must_exist(self, _mock_capture):
        response = self.client.post(
            "/v1/users/@me/scene_personalisation",
            # even if someone tries to send a different user or team they are ignored
            {"user": 12345, "team": 12345, "dashboard": 12345, "scene": "Person"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch("hanzo_insights.capture")
    def test_set_scene_personalisation_for_user_must_send_dashboard(self, _mock_capture):
        response = self.client.post(
            "/v1/users/@me/scene_personalisation",
            # even if someone tries to send a different user or team they are ignored
            {"user": 12345, "team": 12345, "scene": "Person"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch("hanzo_insights.capture")
    def test_set_scene_personalisation_for_user_must_send_scene(self, _mock_capture):
        dashboard_one = Dashboard.objects.create(team=self.team, name="Dashboard 1")

        response = self.client.post(
            "/v1/users/@me/scene_personalisation",
            # even if someone tries to send a different user or team they are ignored
            {
                "user": 12345,
                "team": 12345,
                "dashboard": str(dashboard_one.id),
            },
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch("hanzo_insights.capture")
    def test_set_scene_personalisation_for_user(self, _mock_capture):
        another_org = Organization.objects.create(name="Another Org")
        another_team = Team.objects.create(name="Another Team", organization=another_org)
        user = self._create_user("the-user@hanzo.ai", password="12345678")
        user.current_team = another_team
        user.save()
        self.client.force_login(user)

        dashboard_one = Dashboard.objects.create(team=another_team, name="Dashboard 1")
        dashboard_two = Dashboard.objects.create(team=another_team, name="Dashboard 2")

        self._assert_set_scene_choice(
            "Person",
            dashboard_one,
            user,
            [
                {
                    "dashboard": dashboard_one.pk,
                    "scene": "Person",
                },
            ],
        )

        self._assert_set_scene_choice(
            "Person",
            dashboard_two,
            user,
            [
                {
                    "dashboard": dashboard_two.pk,
                    "scene": "Person",
                },
            ],
        )

        self._assert_set_scene_choice(
            "Group",
            dashboard_two,
            user,
            [
                {
                    "dashboard": dashboard_two.pk,
                    "scene": "Person",
                },
                {
                    "dashboard": dashboard_two.pk,
                    "scene": "Group",
                },
            ],
        )

    def _assert_set_scene_choice(
        self, scene: str, dashboard: Dashboard, user: User, expected_choices: list[dict]
    ) -> None:
        response = self.client.post(
            "/v1/users/@me/scene_personalisation",
            # even if someone tries to send a different user or team they are ignored
            {
                "user": 12345,
                "team": 12345,
                "dashboard": str(dashboard.id),
                "scene": scene,
            },
        )
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert response_data["uuid"] == str(user.uuid)
        assert response_data["scene_personalisation"] == expected_choices

    def test_cannot_upgrade_yourself_to_staff_user(self):
        response = self.client.patch("/v1/users/@me/", {"is_staff": True})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            response.json(),
            self.permission_denied_response("You are not a staff user, contact your instance admin."),
        )

        self.user.refresh_from_db()
        self.assertEqual(self.user.is_staff, False)

    @patch("hanzo_insights.capture")
    def test_can_update_current_organization(self, mock_capture):
        response = self.client.patch("/v1/users/@me/", {"set_current_organization": str(self.new_org.id)})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data["organization"]["id"], str(self.new_org.id))
        self.assertEqual(response_data["organization"]["name"], self.new_org.name)

        # Team is set too
        self.assertEqual(response_data["team"]["id"], self.new_project.id)
        self.assertEqual(response_data["team"]["name"], self.new_project.name)

        self.user.refresh_from_db()
        self.assertEqual(self.user.current_organization, self.new_org)
        self.assertEqual(self.user.current_team, self.new_project)

        mock_capture.assert_any_call(
            event="user updated",
            distinct_id=self.user.distinct_id,
            properties={"updated_attrs": ["current_organization", "current_team"], "$set": mock.ANY},
            groups={
                "instance": ANY,
                "organization": str(self.new_org.id),
                "project": str(self.new_project.uuid),
            },
        )

    @patch("hanzo_insights.capture")
    def test_can_update_current_project(self, mock_capture):
        team = Team.objects.create(name="Local Team", organization=self.new_org)
        response = self.client.patch("/v1/users/@me/", {"set_current_team": team.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data["team"]["id"], team.id)
        self.assertEqual(response_data["team"]["name"], "Local Team")

        # Org is updated too
        self.assertEqual(response_data["organization"]["id"], str(self.new_org.id))

        self.user.refresh_from_db()
        self.assertEqual(self.user.current_organization, self.new_org)
        self.assertEqual(self.user.current_team, team)

        mock_capture.assert_any_call(
            event="user updated",
            distinct_id=self.user.distinct_id,
            properties={"updated_attrs": ["current_organization", "current_team"], "$set": mock.ANY},
            groups={
                "instance": ANY,
                "organization": str(self.new_org.id),
                "project": str(team.uuid),
            },
        )

    def test_cannot_set_mismatching_org_and_team(self):
        org = Organization.objects.create(name="Isolated Org")
        first_team = Team.objects.create(name="Isolated Team", organization=org)
        team = Team.objects.create(name="Isolated Team 2", organization=org)
        self.user.join(organization=org)

        response = self.client.patch(
            "/v1/users/@me/",
            {
                "set_current_team": team.id,
                "set_current_organization": self.organization.id,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json(),
            {
                "type": "validation_error",
                "code": "invalid_input",
                "detail": "Team must belong to the same organization in set_current_organization.",
                "attr": "set_current_team",
            },
        )

        self.user.refresh_from_db()
        self.assertEqual(self.user.current_team, first_team)
        self.assertEqual(self.user.current_organization, org)

    def test_cannot_switch_current_organization_into_one_that_blocks_the_member(self):
        # /v1/users/@me/ is on the enforcement whitelist, so the switch must refuse on its own —
        # otherwise a blocked member could point their session back at the org that moved them off.
        blocking_org = Organization.objects.create(name="Enforcing org", enforce_verified_domains=True)
        OrganizationMembership.objects.create(organization=blocking_org, user=self.user)
        OrganizationDomain.objects.create(domain="hogflix.com", organization=blocking_org, verified_at=timezone.now())

        response = self.client.patch("/v1/users/@me/", {"set_current_organization": str(blocking_org.id)})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()["code"], "verified_domain_required")
        self.user.refresh_from_db()
        self.assertEqual(self.user.current_organization, self.organization)

    def test_cannot_set_an_organization_without_permissions(self):
        org = Organization.objects.create(name="Isolated Org")

        response = self.client.patch("/v1/users/@me/", {"set_current_organization": org.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json(),
            {
                "type": "validation_error",
                "code": "does_not_exist",
                "detail": f"Object with id={org.id} does not exist.",
                "attr": "set_current_organization",
            },
        )

        self._assert_current_org_and_team_unchanged()

    def test_cannot_set_a_team_without_permissions(self):
        org = Organization.objects.create(name="Isolated Org")
        team = Team.objects.create(name="Isolated Team", organization=org)

        response = self.client.patch("/v1/users/@me/", {"set_current_team": team.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json(),
            {
                "type": "validation_error",
                "code": "does_not_exist",
                "detail": f"Object with id={team.id} does not exist.",
                "attr": "set_current_team",
            },
        )

        self._assert_current_org_and_team_unchanged()

    def test_cannot_set_a_non_existent_org_or_team(self):
        response = self.client.patch("/v1/users/@me/", {"set_current_team": 3983838})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json(),
            {
                "type": "validation_error",
                "code": "does_not_exist",
                "detail": f"Object with id=3983838 does not exist.",
                "attr": "set_current_team",
            },
        )

        _uuid = str(uuid.uuid4())
        response = self.client.patch("/v1/users/@me/", {"set_current_organization": _uuid})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json(),
            {
                "type": "validation_error",
                "code": "does_not_exist",
                "detail": f"Object with id={_uuid} does not exist.",
                "attr": "set_current_organization",
            },
        )

        self._assert_current_org_and_team_unchanged()

    def test_current_team_prefer_current_organization(self):
        """
        If current_organization is set but current_team isn't (for example when a team is deleted), make sure we set the team in the current organization
        """
        org2 = Organization.objects.create(name="bla")
        OrganizationMembership.objects.create(organization=org2, user=self.user)
        team2 = Team.objects.create(organization=org2)

        # select current organization
        self.user.current_organization = org2
        self.user.current_team = None
        self.user.save()

        response = self.client.get("/v1/users/@me/").json()
        self.assertEqual(response["team"]["id"], team2.pk)

    def test_team_property_does_not_save_when_no_teams_found(self):
        """
        Test that the team property doesn't trigger a save when the teams query returns None
        """
        # Create a brand new user that belongs to no organizations or teams
        new_user = User.objects.create_user(
            email="newuser@hanzo.ai", password="testpass123", first_name="New", last_name="User"
        )

        # Clear the cached properties to force re-evaluation
        if hasattr(new_user, "_cached_team"):
            delattr(new_user, "_cached_team")
        if hasattr(new_user, "_cached_organization"):
            delattr(new_user, "_cached_organization")

        # Now test the team property - this should not trigger a save since no teams exist
        with mock.patch.object(new_user, "save") as mock_save:
            team = new_user.team  # Property access, but it can actually perform a save

            # Verify no save was called for the team property
            mock_save.assert_not_called()

            # Verify team is None
            self.assertIsNone(team)
            self.assertIsNone(new_user.current_team)

    def test_team_property_saves_when_team_found(self):
        """
        Test that the team property does trigger a save when a team is found
        """
        # Set current organization but no current team
        self.user.current_team = None
        self.user.save()

        # Clear the cached property to force re-evaluation
        if hasattr(self.user, "_cached_team"):
            delattr(self.user, "_cached_team")

        # Mock the save method to track if it's called
        with mock.patch.object(self.user, "save") as mock_save:
            # Access the team property - this should trigger a save since a team exists
            result_team = self.user.team

            # Verify save was called with correct parameters
            mock_save.assert_called_once_with(update_fields=["current_team"])

            # Verify team is set correctly
            self.assertEqual(result_team, self.team)
            self.assertEqual(self.user.current_team, self.team)

    def test_organization_property_does_not_save_when_no_organizations_found(self):
        """
        Test that the organization property doesn't trigger a save when no organizations exist
        """
        # Create a brand new user that belongs to no organizations or teams
        new_user = User.objects.create_user(
            email="newuser2@hanzo.ai", password="testpass123", first_name="New", last_name="User"
        )

        # Access the organization property - this should NOT trigger a save since no organizations exist
        with mock.patch.object(new_user, "save") as mock_save:
            organization = new_user.organization

            # Verify no save was called for the organization property
            mock_save.assert_not_called()

            # Verify organization is None
            self.assertIsNone(organization)
            self.assertIsNone(new_user.current_organization)

    def test_organization_property_saves_when_organization_found(self):
        """
        Test that the organization property does trigger a save when an organization is found
        """
        # Create a new organization and add the user to it
        new_org = Organization.objects.create(name="Test Organization")
        self.user.join(organization=new_org)

        # Set current organization to None to simulate the property needing to find and set it
        self.user.current_organization = None
        self.user.save()

        # Clear the cached property to force re-evaluation
        if hasattr(self.user, "_cached_organization"):
            delattr(self.user, "_cached_organization")

        # Mock the save method to track if it's called
        with mock.patch.object(self.user, "save") as mock_save:
            # Access the organization property - this should trigger a save since an organization exists
            result_organization = self.user.organization

            # Verify save was called with correct parameters
            mock_save.assert_called_once_with(update_fields=["current_organization"])

            # Verify organization is set correctly (should be one of the user's organizations)
            self.assertIsNotNone(result_organization)
            self.assertIn(result_organization, [self.organization, new_org])
            self.assertEqual(self.user.current_organization, result_organization)

    def test_unauthenticated_user_cannot_update_anything(self):
        self.client.logout()
        response = self.client.patch(
            "/v1/users/@me/",
            {
                "id": str(self.user.uuid),
                "first_name": "Hijacked",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.json(), self.unauthenticated_response())

        self.user.refresh_from_db()
        self.assertNotEqual(self.user.first_name, "Hijacked")

    def test_no_ratelimit_for_get_requests_for_users(self):
        for _ in range(6):
            response = self.client.get("/v1/users/@me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        for _ in range(4):
            # below rate limit, so shouldn't be throttled
            response = self.client.patch("/v1/users/@me/", {"role_at_organization": "not-a-real-role"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        for _ in range(2):
            response = self.client.get("/v1/users/@me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        for _ in range(2):
            # finally above rate limit, so should be throttled
            response = self.client.patch("/v1/users/@me/", {"role_at_organization": "not-a-real-role"})
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_no_ratelimit_for_ordinary_updates(self):
        for _ in range(10):
            response = self.client.patch("/v1/users/@me/", {"organization_name": "new name"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cannot_delete_user_with_organization_memberships(self):
        user = self._create_user("activeorgmemberships@hanzo.ai", password="test")

        self.client.force_login(user)

        user.join(organization=self.new_org, level=OrganizationMembership.Level.MEMBER)

        assert OrganizationMembership.objects.filter(user=user, organization=self.new_org).exists()

        response = self.client.delete(f"/v1/users/@me/")
        assert response.status_code == status.HTTP_409_CONFLICT

    @patch("hanzo_insights.capture")
    def test_can_delete_user_with_no_organization_memberships(self, mock_capture):
        user = self._create_user("noactiveorgmemberships@hanzo.ai", password="test")

        self.client.force_login(user)

        user.join(organization=self.new_org, level=OrganizationMembership.Level.MEMBER)

        assert OrganizationMembership.objects.filter(user=user, organization=self.new_org).exists()

        OrganizationMembership.objects.filter(user=user).delete()

        assert not OrganizationMembership.objects.filter(user=user).exists()

        response = self.client.delete(f"/v1/users/@me/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(uuid=user.uuid).exists()

        mock_capture.assert_called_once_with(
            distinct_id=user.distinct_id,
            event="user account deleted",
            properties=mock.ANY,
        )

    def test_cannot_delete_another_user_with_no_org_memberships(self):
        user = self._create_user("deleteanotheruser@hanzo.ai", password="test")

        user_with_no_org_memberships = self._create_user("userwithnoorgmemberships@hanzo.ai", password="test")

        OrganizationMembership.objects.filter(user=user_with_no_org_memberships).delete()

        assert not OrganizationMembership.objects.filter(user=user_with_no_org_memberships).exists()

        self.client.force_login(user)

        response = self.client.delete(f"/v1/users/{user_with_no_org_memberships.uuid}/")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert User.objects.filter(uuid=user_with_no_org_memberships.uuid).exists()

    def test_forbidden_to_delete_another_user_with_org_memberships(self):
        user = self._create_user("deleteanotheruser@hanzo.ai", password="test")

        user_with_org_memberships = self._create_user("userwithorgmemberships@hanzo.ai", password="test")

        assert OrganizationMembership.objects.filter(user=user_with_org_memberships).exists()

        self.client.force_login(user)

        response = self.client.delete(f"/v1/users/{user_with_org_memberships.uuid}/")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert User.objects.filter(uuid=user_with_org_memberships.uuid).exists()

    def test_cannot_delete_own_user_account_with_personal_api_key(self):
        api_key_value = generate_random_token_personal()
        PersonalAPIKey.objects.create(
            label="Test Delete User Account Key",
            user=self.user,
            secure_value=hash_key_value(api_key_value),
            scopes=["*"],
        )

        OrganizationMembership.objects.filter(user=self.user).delete()

        assert not OrganizationMembership.objects.filter(user=self.user).exists()

        self.client.logout()

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {api_key_value}")
        response = self.client.delete(f"/v1/users/@me/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_redirect_user_to_site_with_toolbar(self):
        self.team.app_urls = ["http://127.0.0.1:8010"]
        self.team.save()

        response = self.client.get(
            "/v1/user/redirect_to_site/?userIntent=add-action&appUrl=http%3A%2F%2F127.0.0.1%3A8010"
        )
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        locationHeader = response.headers.get("location", "not found")
        self.assertIn("22apiURL%22%3A%20%22http%3A%2F%2Ftestserver%22", locationHeader)
        self.maxDiff = None
        assert (
            unquote(locationHeader)
            == 'http://127.0.0.1:8010#__insights={"action": "ph_authorize", "token": "token123", "actionId": null, "experimentId": null, "productTourId": null, "userIntent": "add-action", "toolbarVersion": "toolbar", "apiURL": "http://testserver", "dataAttributes": ["data-attr"]}'
        )

    def test_generate_params_for_user_to_load_toolbar(self):
        self.team.app_urls = ["http://127.0.0.1:8010"]
        self.team.save()

        response = self.client.get(
            "/v1/user/redirect_to_site/?userIntent=add-action&appUrl=http%3A%2F%2F127.0.0.1%3A8010&generateOnly=1"
        )
        assert response.status_code == status.HTTP_200_OK
        assert (
            unquote(response.json()["toolbarParams"])
            == '{"action": "ph_authorize", "token": "token123", "actionId": null, "experimentId": null, "productTourId": null, "userIntent": "add-action", "toolbarVersion": "toolbar", "apiURL": "http://testserver", "dataAttributes": ["data-attr"]}'
        )

    def test_generate_only_param_can_be_falsy(self):
        self.team.app_urls = ["http://127.0.0.1:8010"]
        self.team.save()

        response = self.client.get(
            "/v1/user/redirect_to_site/?userIntent=add-action&appUrl=http%3A%2F%2F127.0.0.1%3A8010&generateOnly=0"
        )
        assert response.status_code == status.HTTP_302_FOUND

    def test_redirect_user_to_site_with_experiments_toolbar(self):
        self.team.app_urls = ["http://127.0.0.1:8010"]
        self.team.save()

        response = self.client.get(
            "/v1/user/redirect_to_site/?userIntent=edit-experiment&experimentId=12&appUrl=http%3A%2F%2F127.0.0.1%3A8010"
        )
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        locationHeader = response.headers.get("location", "not found")
        self.assertIn("22apiURL%22%3A%20%22http%3A%2F%2Ftestserver%22", locationHeader)
        self.maxDiff = None
        self.assertEqual(
            unquote(locationHeader),
            'http://127.0.0.1:8010#__insights={"action": "ph_authorize", "token": "token123", "actionId": null, "experimentId": "12", "productTourId": null, "userIntent": "edit-experiment", "toolbarVersion": "toolbar", "apiURL": "http://testserver", "dataAttributes": ["data-attr"]}',
        )

    def test_redirect_only_to_allowed_urls(self):
        self.team.app_urls = [
            "https://www.example.com",
            "https://*.otherexample.com",
            "https://anotherexample.com",
        ]
        self.team.save()

        def assert_allowed_url(url):
            response = self.client.get(f"/v1/user/redirect_to_site/?appUrl={quote(url)}")
            location = cast(str | None, response.headers.get("location")) or ""
            self.assertEqual(response.status_code, status.HTTP_302_FOUND)
            self.assertTrue(f"{url}#__insights=" in location)

        def assert_forbidden_url(url):
            response = self.client.get(f"/v1/user/redirect_to_site/?appUrl={quote(url)}")
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
            self.assertEqual(response.headers.get("location"), None)

        # hostnames
        assert_allowed_url("https://www.example.com")
        assert_forbidden_url("https://www.notexample.com")
        # www.anotherexample.com is equivalent to anotherexample.com
        assert_allowed_url("https://www.anotherexample.com")

        # bare domain matches www entry
        assert_allowed_url("https://example.com")

        # wildcard domains and folders
        assert_forbidden_url("https://subdomain.example.com")
        assert_allowed_url("https://subdomain.otherexample.com")
        assert_allowed_url("https://sub.subdomain.otherexample.com")

    @patch("insights.api.user.secrets.token_urlsafe")
    @patch("insights.api.user.get_flags_from_service")
    def test_prepare_toolbar_preloaded_flags_with_feature_flags(self, mock_get_flags, patched_token):
        """Test that prepare_toolbar_preloaded_flags creates a cache entry with feature flags"""
        from django.core.cache import cache

        from products.feature_flags.backend.models.feature_flag import FeatureFlag

        patched_token.return_value = "test-cache-key-123"

        # Mock the Rust service V2 response format
        mock_get_flags.return_value = {
            "flags": {
                "test-flag-1": {"enabled": True, "variant": None},
                "test-flag-2": {"enabled": True, "variant": "test-variant"},
            }
        }

        # Create some feature flags
        FeatureFlag.objects.create(team=self.team, key="test-flag-1", created_by=self.user)
        FeatureFlag.objects.create(
            team=self.team,
            key="test-flag-2",
            created_by=self.user,
            filters={"groups": [{"properties": [], "rollout_percentage": 100, "variant": "test-variant"}]},
        )

        response = self.client.post(
            "/v1/user/prepare_toolbar_preloaded_flags/", {"distinct_id": "user123"}, content_type="application/json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should return cache key and flag count
        self.assertIn("key", data)
        self.assertIn("flag_count", data)
        self.assertEqual(data["key"], "test-cache-key-123")
        self.assertGreater(data["flag_count"], 0)

        # Verify flags are cached with security metadata
        cached_data = cache.get(f"toolbar_flags_{data['key']}")
        self.assertIsNotNone(cached_data)
        self.assertIn("feature_flags", cached_data)
        self.assertIn("team_id", cached_data)
        self.assertEqual(cached_data["team_id"], self.team.id)
        self.assertIn("test-flag-1", cached_data["feature_flags"])
        self.assertIn("test-flag-2", cached_data["feature_flags"])

    @patch("insights.api.user.get_flags_from_service")
    def test_prepare_toolbar_preloaded_flags_passes_internal_request_token(self, mock_get_flags):
        """The toolbar prep handler is internal Insights traffic, not customer SDK
        traffic — it must forward INTERNAL_REQUEST_TOKEN so the Rust service skips
        the per-team billing limiter."""
        mock_get_flags.return_value = {"flags": {}}

        with self.settings(INTERNAL_REQUEST_TOKEN="test-internal-token"):
            response = self.client.post(
                "/v1/user/prepare_toolbar_preloaded_flags/",
                {"distinct_id": "user123"},
                content_type="application/json",
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(mock_get_flags.call_args.kwargs["internal_request_token"], "test-internal-token")

    def test_get_toolbar_preloaded_flags_retrieves_from_cache(self):
        """Test that get_toolbar_preloaded_flags retrieves flags from cache"""
        from django.core.cache import cache

        # Set up cached flags with metadata
        test_flags = {"flag1": True, "flag2": "variant-a", "flag3": False}
        cache_data = {"feature_flags": test_flags, "team_id": self.team.id}
        cache_key = "toolbar_flags_test-key-456"
        cache.set(cache_key, cache_data, timeout=300)

        response = self.client.get("/v1/user/get_toolbar_preloaded_flags/?key=test-key-456")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["featureFlags"], test_flags)

    def test_get_toolbar_preloaded_flags_returns_404_for_missing_key(self):
        """Test that get_toolbar_preloaded_flags returns 404 for expired/missing cache key"""
        response = self.client.get("/v1/user/get_toolbar_preloaded_flags/?key=nonexistent-key")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.json())

    def test_get_toolbar_preloaded_flags_prevents_cross_team_access(self):
        """Test that users cannot access flags from other teams"""
        from django.core.cache import cache

        # Create flags for a different team
        other_team = Team.objects.create(name="Other Team", organization=self.organization)
        test_flags = {"secret-flag": True}
        cache_data = {"feature_flags": test_flags, "team_id": other_team.id}
        cache_key = "toolbar_flags_test-key-789"
        cache.set(cache_key, cache_data, timeout=300)

        # Try to access with current user (who belongs to self.team, not other_team)
        response = self.client.get("/v1/user/get_toolbar_preloaded_flags/?key=test-key-789")

        # Should be forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.json())

    def test_redirect_to_site_with_toolbar_flags_key(self):
        self.team.app_urls = ["http://127.0.0.1:8010"]
        self.team.save()

        response = self.client.get(
            "/v1/user/redirect_to_site/?userIntent=add-action&appUrl=http%3A%2F%2F127.0.0.1%3A8010&toolbarFlagsKey=test-key-789"
        )

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        location_header = response.headers.get("location", "not found")

        # Verify toolbarFlagsKey is in the redirect URL params
        self.assertIn("toolbarFlagsKey", unquote(location_header))
        self.assertIn("test-key-789", unquote(location_header))

        # Verify the full params structure
        decoded_location = unquote(location_header)
        self.assertIn('"toolbarFlagsKey": "test-key-789"', decoded_location)

    def test_user_cannot_update_protected_fields(self):
        self.user.is_staff = False
        self.user.save()
        fields = {
            "date_joined": "2021-01-01T00:00:00Z",
            "uuid": str(uuid.uuid4()),
            "distinct_id": "distinct_id",
            # The identity provider owns the address; the API must never write it.
            "email": "changed@example.com",
            "is_email_verified": True,
        }

        initial_user = self.client.get("/v1/users/@me/").json()

        for field, value in fields.items():
            response = self.client.patch("/v1/users/@me/", {field: value})
            assert response.json()[field] == initial_user[field], (
                f"Updating field '{field}' to '{value}' worked when it shouldn't! Was {initial_user[field]} and is now {response.json()[field]}"
            )

    def test_can_update_notification_settings(self):
        response = self.client.patch(
            "/v1/users/@me/",
            {
                "notification_settings": {
                    "plugin_disabled": False,
                    "discussions_mentioned": False,
                    "error_tracking_issue_assigned": False,
                    "project_weekly_digest_disabled": {123: True},
                    "all_weekly_digest_disabled": True,
                    "data_pipeline_error_threshold": 0.1,
                    "materialized_view_sync_failed": True,
                }
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(
            response_data["notification_settings"],
            {
                "plugin_disabled": False,
                "discussions_mentioned": False,
                "project_weekly_digest_disabled": {"123": True},  # Note: JSON converts int keys to strings
                "all_weekly_digest_disabled": True,
                "error_tracking_issue_assigned": False,
                "error_tracking_weekly_digest": True,
                "data_pipeline_error_threshold": 0.1,
                "project_api_key_exposed": True,
                "materialized_view_sync_failed": True,
                "web_analytics_weekly_digest": True,
                "organization_member_join_email_disabled": {},
                "realtime_notifications_disabled": {},
                "pipeline_notifications_disabled": {},
            },
        )

        self.user.refresh_from_db()
        self.assertEqual(
            self.user.partial_notification_settings,
            {
                "plugin_disabled": False,
                "discussions_mentioned": False,
                "project_weekly_digest_disabled": {"123": True},
                "all_weekly_digest_disabled": True,
                "error_tracking_issue_assigned": False,
                "error_tracking_weekly_digest": True,
                "data_pipeline_error_threshold": 0.1,
                "project_api_key_exposed": True,
                "materialized_view_sync_failed": True,
                "web_analytics_weekly_digest": True,
                "organization_member_join_email_disabled": {},
                "realtime_notifications_disabled": {},
                "pipeline_notifications_disabled": {},
            },
        )

    def test_notification_settings_project_settings_are_merged_not_replaced(self):
        # First update
        response = self.client.patch(
            "/v1/users/@me/", {"notification_settings": {"project_weekly_digest_disabled": {123: True}}}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Second update with different project
        response = self.client.patch(
            "/v1/users/@me/", {"notification_settings": {"project_weekly_digest_disabled": {456: True}}}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response_data = response.json()
        self.assertEqual(
            response_data["notification_settings"]["project_weekly_digest_disabled"], {"123": True, "456": True}
        )

    def test_notification_settings_organization_member_join_settings_are_merged_not_replaced(self):
        # First update
        response = self.client.patch(
            "/v1/users/@me/",
            {
                "notification_settings": {
                    "organization_member_join_email_disabled": {"00000000-0000-0000-0000-000000000001": True}
                }
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Second update with different organization
        response = self.client.patch(
            "/v1/users/@me/",
            {
                "notification_settings": {
                    "organization_member_join_email_disabled": {"00000000-0000-0000-0000-000000000002": True}
                }
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response_data = response.json()
        self.assertEqual(
            response_data["notification_settings"]["organization_member_join_email_disabled"],
            {
                "00000000-0000-0000-0000-000000000001": True,
                "00000000-0000-0000-0000-000000000002": True,
            },
        )

    def test_notification_settings_default_includes_realtime_disabled_empty_dict(self):
        user = self._create_user("rt-defaults@test.com")
        assert user.notification_settings["realtime_notifications_disabled"] == {}

    def test_realtime_notifications_disabled_accepts_valid_payload(self):
        self.client.force_login(self.user)
        response = self.client.patch(
            "/v1/users/@me/",
            {
                "notification_settings": {
                    "realtime_notifications_disabled": {"comment_mention": {str(self.team.id): True}}
                }
            },
            format="json",
        )
        assert response.status_code == 200, response.json()
        self.user.refresh_from_db()
        assert self.user.partial_notification_settings is not None
        assert self.user.partial_notification_settings["realtime_notifications_disabled"] == {
            "comment_mention": {str(self.team.id): True}
        }

    @parameterized.expand(
        [
            ("unknown_type", {"made_up_type": {"1": True}}, "Unknown notification type"),
            ("non_bool_value", {"comment_mention": {"1": "yes"}}, "must be boolean"),
            ("non_dict_top_level", "not_a_dict", "must be a dict"),
            ("non_dict_inner", {"comment_mention": "not_a_dict"}, "must be a dict of team_id"),
        ]
    )
    def test_realtime_notifications_disabled_rejects_invalid_payload(self, _name, payload, expected_message_substr):
        self.client.force_login(self.user)
        response = self.client.patch(
            "/v1/users/@me/",
            {"notification_settings": {"realtime_notifications_disabled": payload}},
            format="json",
        )
        assert response.status_code == 400, response.json()
        assert expected_message_substr in response.json()["detail"], response.json()

    def test_realtime_notifications_disabled_false_overwrites_true_for_same_pair(self):
        self.user.partial_notification_settings = {"realtime_notifications_disabled": {"comment_mention": {"1": True}}}
        self.user.save()
        self.client.force_login(self.user)
        response = self.client.patch(
            "/v1/users/@me/",
            {"notification_settings": {"realtime_notifications_disabled": {"comment_mention": {"1": False}}}},
            format="json",
        )
        assert response.status_code == 200, response.json()
        self.user.refresh_from_db()
        assert self.user.partial_notification_settings is not None
        assert self.user.partial_notification_settings["realtime_notifications_disabled"] == {
            "comment_mention": {"1": False}
        }

    def test_realtime_notifications_disabled_two_level_merge_preserves_other_pairs(self):
        self.user.partial_notification_settings = {
            "realtime_notifications_disabled": {
                "comment_mention": {"7": True, "8": True},
                "alert_firing": {"7": True},
            }
        }
        self.user.save()
        self.client.force_login(self.user)
        response = self.client.patch(
            "/v1/users/@me/",
            {"notification_settings": {"realtime_notifications_disabled": {"comment_mention": {"9": True}}}},
            format="json",
        )
        assert response.status_code == 200, response.json()
        self.user.refresh_from_db()
        assert self.user.partial_notification_settings is not None
        assert self.user.partial_notification_settings["realtime_notifications_disabled"] == {
            "comment_mention": {"7": True, "8": True, "9": True},
            "alert_firing": {"7": True},
        }

    @parameterized.expand(
        [
            ("bool_scalar", "all_weekly_digest_disabled", False),
            ("plugin_disabled_bool", "plugin_disabled", True),
            ("project_dict", "project_weekly_digest_disabled", {"99": True}),
            ("org_dict", "organization_member_join_email_disabled", {"00000000-0000-0000-0000-000000000099": True}),
            ("realtime_two_level_dict", "realtime_notifications_disabled", {"comment_mention": {"99": True}}),
            ("float_threshold", "data_pipeline_error_threshold", 0.99),
        ]
    )
    def test_partial_notification_settings_patch_preserves_unrelated_keys(self, _name, patched_key, patched_value):
        # Pre-seed every key with a non-default value so any clobber is visible.
        pre_seeded = {
            "plugin_disabled": False,
            "error_tracking_issue_assigned": False,
            "discussions_mentioned": False,
            "project_weekly_digest_disabled": {"1": True, "2": True},
            "all_weekly_digest_disabled": True,
            "data_pipeline_error_threshold": 0.42,
            "project_api_key_exposed": False,
            "materialized_view_sync_failed": True,
            "web_analytics_weekly_digest": False,
            "organization_member_join_email_disabled": {"00000000-0000-0000-0000-000000000001": True},
            "realtime_notifications_disabled": {"comment_mention": {"1": True}},
        }
        self.user.partial_notification_settings = pre_seeded
        self.user.save()
        self.client.force_login(self.user)

        response = self.client.patch(
            "/v1/users/@me/",
            {"notification_settings": {patched_key: patched_value}},
            format="json",
        )

        assert response.status_code == 200, response.json()
        self.user.refresh_from_db()
        assert self.user.partial_notification_settings is not None
        for unrelated_key, original_value in pre_seeded.items():
            if unrelated_key == patched_key:
                continue
            assert self.user.partial_notification_settings[unrelated_key] == original_value, (
                f"Patching {patched_key!r} clobbered {unrelated_key!r}"
            )

    def test_pipeline_notifications_rejects_malformed_pipeline_ids(self):
        for bad_key in [
            "<script>alert(1)</script>",
            "random_garbage_key",
            "insights_function:",
            "insights_function:not a uuid",
            "unknown_type:abc",
            "",
        ]:
            response = self.client.patch(
                "/v1/users/@me/",
                {"notification_settings": {"pipeline_notifications_disabled": {bad_key: True}}},
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, f"key {bad_key!r} was accepted")
            self.assertEqual(response.json()["code"], "invalid_input")

    def test_pipeline_notifications_accepts_valid_pipeline_ids(self):
        for good_key in [
            "insights_function:019dcf05-db1d-0000-682a-935c8e1ad2c9",
            "batch_export:019dcf05-dac4-0000-07d4-cf53026deba6",
            "plugin_config:42",
        ]:
            response = self.client.patch(
                "/v1/users/@me/",
                {"notification_settings": {"pipeline_notifications_disabled": {good_key: True}}},
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK, f"key {good_key!r} was rejected")

    def test_pipeline_notifications_caps_total_entries(self):
        from insights.api.user import MAX_PIPELINE_NOTIFICATIONS

        too_many = {f"insights_function:fake-{i}": True for i in range(MAX_PIPELINE_NOTIFICATIONS + 1)}
        response = self.client.patch(
            "/v1/users/@me/",
            {"notification_settings": {"pipeline_notifications_disabled": too_many}},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("more than", response.json()["detail"])

    def test_invalid_notification_settings_returns_error(self):
        response = self.client.patch("/v1/users/@me/", {"notification_settings": {"invalid_key": True}})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json(),
            {
                "type": "validation_error",
                "code": "invalid_input",
                "detail": "Key invalid_key is not valid as a key for notification settings",
                "attr": "notification_settings",
            },
        )

    def test_notification_settings_wrong_type_returns_error(self):
        response = self.client.patch(
            "/v1/users/@me/",
            {
                "notification_settings": {
                    "project_weekly_digest_disabled": {"123": "not a boolean"}  # This should be True or False
                }
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json(),
            {
                "type": "validation_error",
                "code": "invalid_input",
                "detail": "Notification setting values must be boolean, got <class 'str'> instead",
                "attr": "notification_settings",
            },
        )

    def test_can_disable_all_notifications(self):
        response = self.client.patch("/v1/users/@me/", {"notification_settings": {"all_weekly_digest_disabled": True}})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(
            response_data["notification_settings"],
            {
                "plugin_disabled": True,  # Default value
                "discussions_mentioned": True,  # Default value
                "project_weekly_digest_disabled": {},  # Default value
                "all_weekly_digest_disabled": True,
                "error_tracking_issue_assigned": True,  # Default value
                "error_tracking_weekly_digest": True,  # Default value
                "data_pipeline_error_threshold": 0.01,  # Default value
                "project_api_key_exposed": True,  # Default value
                "materialized_view_sync_failed": False,  # Default value
                "web_analytics_weekly_digest": True,  # Default value
                "organization_member_join_email_disabled": {},  # Default value
                "realtime_notifications_disabled": {},  # Default value
                "pipeline_notifications_disabled": {},  # Default value
            },
        )


class TestUserUIConfigurationValidation(SimpleTestCase):
    @parameterized.expand(
        [
            ("not_an_object", ["version"]),
            ("missing_version", {"sidebar": {}}),
            ("unknown_section", {"version": 1, "sidebar": {"sections": {"bogus": {"visible": False}}}}),
            ("unknown_item", {"version": 1, "sidebar": {"items": {"bogus": {"visible": False}}}}),
            ("activity_not_customizable", {"version": 1, "sidebar": {"items": {"activity": {"visible": False}}}}),
            ("non_boolean_visible", {"version": 1, "sidebar": {"items": {"home": {"visible": "nope"}}}}),
            ("unknown_node_key", {"version": 1, "sidebar": {"items": {"home": {"visible": False, "size": 1}}}}),
        ]
    )
    def test_invalid_ui_configuration_is_rejected(self, _name, value):
        serializer = UserSerializer(data={"ui_configuration": value}, partial=True)

        self.assertFalse(serializer.is_valid())
        self.assertIn("ui_configuration", serializer.errors)

    @parameterized.expand(
        [
            ("null", None),
            ("minimal", {"version": 1}),
            ("unknown_top_level_key", {"version": 1, "surprise": True}),
            ("unknown_sidebar_key", {"version": 1, "sidebar": {"density": "compact", "surprise": True}}),
            (
                "full",
                {
                    "version": 1,
                    "sidebar": {
                        "sections": {"project": {"visible": True}, "recents": {}, "my_tools": {"visible": False}},
                        "items": {
                            "home": {"visible": False},
                            "inbox": {"visible": False},
                            "data": {"visible": False},
                            "files": {"visible": False},
                            "tools": {"visible": False},
                            "starred": {"visible": False},
                            "notifications": {"visible": False},
                            "help": {"visible": False},
                        },
                    },
                },
            ),
            ("new_user_default", default_ui_configuration_for_new_users()),
        ]
    )
    def test_valid_ui_configuration_is_accepted(self, _name, value):
        serializer = UserSerializer(data={"ui_configuration": value}, partial=True)

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["ui_configuration"], value)


@pytest.mark.ee
class TestToolbarAccessControl(APIBaseTest):
    """The toolbar launch endpoints must respect the `toolbar` resource's access control."""

    def setUp(self):
        super().setUp()
        self.organization.available_product_features = [
            {"key": AvailableFeature.ACCESS_CONTROL, "name": AvailableFeature.ACCESS_CONTROL},
        ]
        self.organization.save()
        self.team.app_urls = ["http://127.0.0.1:8010"]
        self.team.save()

    def _deny_toolbar_access(self):
        membership = OrganizationMembership.objects.get(user=self.user, organization=self.organization)
        AccessControl.objects.create(
            team=self.team,
            resource="toolbar",
            resource_id=None,
            access_level="none",
            organization_member=membership,
        )

    def test_redirect_to_site_denied_without_toolbar_access(self):
        self._deny_toolbar_access()

        response = self.client.get("/v1/user/redirect_to_site/?appUrl=http%3A%2F%2F127.0.0.1%3A8010")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_redirect_to_site_allowed_with_default_access(self):
        response = self.client.get("/v1/user/redirect_to_site/?appUrl=http%3A%2F%2F127.0.0.1%3A8010")

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)

    def test_redirect_to_site_returns_404_without_crashing_when_user_has_no_team(self):
        """`team.app_urls` must not be dereferenced before the `team is None` guard, or a
        session-authed user with no current project crashes with an AttributeError instead of
        getting the expected 404."""
        new_user = User.objects.create_user(email="no-team@hanzo.ai", password="testpass123", first_name="")
        self.client.force_login(new_user)

        response = self.client.get("/v1/user/redirect_to_site/?appUrl=http%3A%2F%2F127.0.0.1%3A8010")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch("insights.api.user.get_or_create_toolbar_oauth_application")
    def test_toolbar_oauth_authorize_denied_without_toolbar_access(self, mock_get_or_create_app):
        self._deny_toolbar_access()

        response = self.client.get(
            "/toolbar_oauth/authorize/?redirect=http%3A%2F%2F127.0.0.1%3A8010&code_challenge=abc"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        mock_get_or_create_app.assert_not_called()

    def test_get_toolbar_preloaded_flags_denied_without_toolbar_access(self):
        cache.set("toolbar_flags_test-key", {"feature_flags": {"a-flag": True}, "team_id": self.team.id}, timeout=300)
        self._deny_toolbar_access()

        response = self.client.get("/v1/user/get_toolbar_preloaded_flags/?key=test-key")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch("insights.api.user.get_flags_from_service")
    def test_prepare_toolbar_preloaded_flags_denied_without_toolbar_access(self, mock_get_flags):
        mock_get_flags.return_value = {"flags": {}}
        self._deny_toolbar_access()

        response = self.client.post(
            "/v1/user/prepare_toolbar_preloaded_flags/", {"distinct_id": "user123"}, content_type="application/json"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        mock_get_flags.assert_not_called()

    def test_toolbar_oauth_callback_denied_without_toolbar_access(self):
        self._deny_toolbar_access()

        response = self.client.get("/toolbar_oauth/callback?code=abc123&state=fake-state")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_toolbar_oauth_callback_narrows_grant_to_verified_team(self):
        """The generic first-party OAuth auto-approval issues the grant with scoped_teams=[]
        (unrestricted across every team in the org) since it has no notion of which team a toolbar
        launch was verified for. The callback must narrow it to that team, or the resulting tokens
        could be replayed against a different team in the same org where toolbar access is denied."""
        oauth_app = OAuthApplication.objects.create(
            name="Test Toolbar OAuth App",
            client_id="test_toolbar_client_id_scoping",
            client_type=OAuthApplication.CLIENT_PUBLIC,
            authorization_grant_type=OAuthApplication.GRANT_AUTHORIZATION_CODE,
            redirect_uris="https://example.com/callback",
            algorithm="RS256",
            user=self.user,
        )
        grant = OAuthGrant.objects.create(
            application=oauth_app,
            user=self.user,
            code="test-grant-code",
            expires=timezone.now() + timedelta(minutes=10),
            redirect_uri="https://example.com/callback",
            scope="openid",
            code_challenge="abc",
            code_challenge_method="S256",
            scoped_teams=[],
            scoped_organizations=[str(self.organization.id)],
        )
        signed_state, _ = build_toolbar_oauth_state(
            ToolbarOAuthState(
                nonce=new_state_nonce(),
                user_id=self.user.id,
                team_id=self.team.id,
                app_url="http://127.0.0.1:8010",
            )
        )

        with patch("insights.api.user.get_or_create_toolbar_oauth_application", return_value=oauth_app):
            response = self.client.get(f"/toolbar_oauth/callback?code={grant.code}&state={signed_state}")

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        grant.refresh_from_db()
        self.assertEqual(grant.scoped_teams, [self.team.id])

    def test_toolbar_oauth_refresh_denied_after_access_revoked(self):
        """A refresh token minted before access was revoked must not be usable to mint new
        tokens afterwards - the refresh endpoint has no session auth, so it must re-check
        the token owner's current toolbar access itself."""
        oauth_app = OAuthApplication.objects.create(
            name="Test Toolbar OAuth App",
            client_id="test_toolbar_client_id",
            client_type=OAuthApplication.CLIENT_PUBLIC,
            authorization_grant_type=OAuthApplication.GRANT_AUTHORIZATION_CODE,
            redirect_uris="https://example.com/callback",
            algorithm="RS256",
            user=self.user,
        )
        refresh_token = OAuthRefreshToken.objects.create(
            user=self.user,
            application=oauth_app,
            token="test_toolbar_refresh_token",
            scoped_teams=[self.team.id],
        )
        self._deny_toolbar_access()

        with patch("insights.api.user.refresh_tokens") as mock_refresh_tokens:
            response = self.client.post(
                "/v1/user/toolbar_oauth_refresh/",
                {"refresh_token": refresh_token.token, "client_id": oauth_app.client_id},
                content_type="application/json",
            )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        mock_refresh_tokens.assert_not_called()

    def test_toolbar_oauth_refresh_denied_when_access_revoked_in_scoped_team_despite_switching_active_team(self):
        """The refresh check must gate on the token's scoped team, not the user's mutable current
        team - otherwise a user whose access was revoked in the project the token is scoped to
        could keep refreshing it by switching their active team to one where access remains."""
        other_team = Team.objects.create(organization=self.organization, name="Other team")
        oauth_app = OAuthApplication.objects.create(
            name="Test Toolbar OAuth App",
            client_id="test_toolbar_client_id_team_switch",
            client_type=OAuthApplication.CLIENT_PUBLIC,
            authorization_grant_type=OAuthApplication.GRANT_AUTHORIZATION_CODE,
            redirect_uris="https://example.com/callback",
            algorithm="RS256",
            user=self.user,
        )
        refresh_token = OAuthRefreshToken.objects.create(
            user=self.user,
            application=oauth_app,
            token="test_toolbar_refresh_token_team_switch",
            scoped_teams=[self.team.id],
        )
        self._deny_toolbar_access()
        self.user.current_team = other_team
        self.user.save()

        with patch("insights.api.user.refresh_tokens") as mock_refresh_tokens:
            response = self.client.post(
                "/v1/user/toolbar_oauth_refresh/",
                {"refresh_token": refresh_token.token, "client_id": oauth_app.client_id},
                content_type="application/json",
            )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        mock_refresh_tokens.assert_not_called()

    def test_toolbar_oauth_refresh_denied_when_token_owner_has_no_team(self):
        """A refresh token with no scoped team (e.g. one minted before grants were narrowed to a
        single verified team) must be denied rather than allowed through - the check fails closed
        when it can't resolve exactly one scoped team to verify access against."""
        no_team_user = User.objects.create_user(email="no-team-refresh@hanzo.ai", password="testpass123", first_name="")
        oauth_app = OAuthApplication.objects.create(
            name="Test Toolbar OAuth App",
            client_id="test_toolbar_client_id_no_team",
            client_type=OAuthApplication.CLIENT_PUBLIC,
            authorization_grant_type=OAuthApplication.GRANT_AUTHORIZATION_CODE,
            redirect_uris="https://example.com/callback",
            algorithm="RS256",
            user=no_team_user,
        )
        refresh_token = OAuthRefreshToken.objects.create(
            user=no_team_user,
            application=oauth_app,
            token="test_toolbar_refresh_token_no_team",
        )

        with patch("insights.api.user.refresh_tokens") as mock_refresh_tokens:
            response = self.client.post(
                "/v1/user/toolbar_oauth_refresh/",
                {"refresh_token": refresh_token.token, "client_id": oauth_app.client_id},
                content_type="application/json",
            )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        mock_refresh_tokens.assert_not_called()


class TestSessionAuthEndpoints(APIBaseTest):
    """
    Tests that certain endpoints require session authentication and reject Personal API Keys.

    These endpoints (redirect_to_site, etc.) are browser-interactive
    features that should not be accessible via API keys.
    """

    def setUp(self):
        super().setUp()
        self.api_key_value = generate_random_token_personal()
        PersonalAPIKey.objects.create(
            label="Test API Key",
            user=self.user,
            secure_value=hash_key_value(self.api_key_value),
            scopes=["*"],
        )
        self.team.app_urls = ["http://127.0.0.1:8010"]
        self.team.save()

    def test_redirect_to_site_rejects_personal_api_key(self):
        """Personal API Keys should not be able to call redirect_to_site."""
        self.client.logout()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.api_key_value}")

        response = self.client.get("/v1/user/redirect_to_site/?appUrl=http%3A%2F%2F127.0.0.1%3A8010")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.json()["detail"], "Authentication credentials were not provided.")

    def test_redirect_to_site_works_with_session_auth(self):
        """Session authentication should still work for redirect_to_site."""
        response = self.client.get("/v1/user/redirect_to_site/?appUrl=http%3A%2F%2F127.0.0.1%3A8010")

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)

    def test_prepare_toolbar_preloaded_flags_rejects_personal_api_key(self):
        """Personal API Keys should not be able to call prepare_toolbar_preloaded_flags."""
        self.client.logout()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.api_key_value}")

        response = self.client.post(
            "/v1/user/prepare_toolbar_preloaded_flags/",
            {"distinct_id": "test-user"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.json()["detail"], "Authentication credentials were not provided.")

    def test_get_toolbar_preloaded_flags_rejects_personal_api_key(self):
        """Personal API Keys should not be able to call get_toolbar_preloaded_flags."""
        self.client.logout()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.api_key_value}")

        response = self.client.get("/v1/user/get_toolbar_preloaded_flags/?key=test-key")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.json()["detail"], "Authentication credentials were not provided.")


class TestLoginViews(APIBaseTest):
    def test_redirect_to_preflight_when_no_users(self):
        User.objects.all().delete()
        response = self.client.get("/", follow=True)
        self.assertRedirects(response, "/preflight")


class TestStaffUserAPI(APIBaseTest):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.user.is_staff = True
        cls.user.save()

    def test_can_list_staff_users(self):
        response = self.client.get("/v1/users/?is_staff=true")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data["count"], 1)
        self.assertEqual(response_data["results"][0]["is_staff"], True)
        self.assertEqual(response_data["results"][0]["email"], self.CONFIG_EMAIL)

    def test_only_staff_can_list_other_users(self):
        self.user.is_staff = False
        self.user.save()

        response = self.client.get("/v1/users")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["uuid"], str(self.user.uuid))

    def test_update_staff_user(self):
        user = self._create_user("newuser@hanzo.ai", password="12345678")
        self.assertEqual(user.is_staff, False)

        # User becomes staff
        response = self.client.patch(f"/v1/users/{user.uuid}/", {"is_staff": True})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data["is_staff"], True)
        user.refresh_from_db()
        self.assertEqual(user.is_staff, True)

        # User is no longer staff
        response = self.client.patch(f"/v1/users/{user.uuid}/", {"is_staff": False})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data["is_staff"], False)
        user.refresh_from_db()
        self.assertEqual(user.is_staff, False)

    def test_only_staff_user_can_update_staff_prop(self):
        user = self._create_user("newuser@hanzo.ai", password="12345678")

        self.user.is_staff = False
        self.user.save()

        response = self.client.patch(f"/v1/users/{user.uuid}/", {"is_staff": True})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            response.json(),
            {
                "type": "authentication_error",
                "code": "permission_denied",
                "detail": "As a non-staff user you're only allowed to access the `@me` user instance.",
                "attr": None,
            },
        )

        user.refresh_from_db()
        self.assertEqual(user.is_staff, False)


class TestUserOAuthAccess(APIBaseTest):
    def setUp(self):
        super().setUp()
        # prevent throttling of user requests to pass on from one test
        # to the next
        cache.clear()

    def test_team_scoped_oauth_token_with_user_read_can_access_me_endpoint(self):
        oauth_app = OAuthApplication.objects.create(
            name="Test OAuth App",
            client_id="test_client_id",
            client_type=OAuthApplication.CLIENT_CONFIDENTIAL,
            authorization_grant_type=OAuthApplication.GRANT_AUTHORIZATION_CODE,
            redirect_uris="https://example.com/callback",
            algorithm="RS256",
            user=self.user,
        )

        access_token = OAuthAccessToken.objects.create(
            application=oauth_app,
            user=self.user,
            token="test_oauth_token",
            scope="user:read project:read",
            expires=timezone.now() + timedelta(hours=1),
            scoped_teams=[self.team.id],
        )

        response = self.client.get("/v1/users/@me/", headers={"authorization": f"Bearer {access_token.token}"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data["uuid"], str(self.user.uuid))


class TestUserDeletionAfterOrgDeletion(NonAtomicBaseTest):
    """Deleting a user's only organization (which runs on Temporal) must let them delete their account.

    The org-deletion workflow runs inline so the membership cascade actually completes; that requires a
    non-atomic test case, since the workflow's activities run on their own database connections.
    """

    CLASS_DATA_LEVEL_SETUP = False

    @patch("hanzo_insights.capture")
    def test_can_delete_account_after_deleting_only_organization(self, mock_capture):
        org = Organization.objects.create(name="Solo Org")
        user = User.objects.create(email="solo@hanzo.ai", password="testpassword")
        OrganizationMembership.objects.create(
            user=user,
            organization=org,
            level=OrganizationMembership.Level.OWNER,
        )
        self.client.force_login(user)

        # User belongs to exactly one organization
        response = self.client.get("/v1/users/@me/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()["organizations"]) == 1

        # Cannot delete account while still a member of an organization
        response = self.client.delete("/v1/users/@me/")
        assert response.status_code == status.HTTP_409_CONFLICT

        # Delete the organization (runs the deletion workflow to completion)
        with execute_deletion_workflows_inline():
            response = self.client.delete(f"/v1/organizations/{org.id}")
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # The membership cascade removed the user's memberships, so they now see zero organizations
        assert not OrganizationMembership.objects.filter(user=user).exists()
        response = self.client.get("/v1/users/@me/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()["organizations"]) == 0

        # Now the user can delete their account
        response = self.client.delete("/v1/users/@me/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(pk=user.pk).exists()
