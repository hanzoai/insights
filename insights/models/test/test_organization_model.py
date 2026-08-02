from datetime import datetime, timedelta

from insights.test.base import BaseTest
from unittest import mock
from unittest.mock import patch

from django.core.cache import cache
from django.utils import timezone

from parameterized import parameterized

from insights.constants import AvailableFeature
from insights.models import Organization, OrganizationInvite, Plugin
from insights.models.organization import PRODUCT_FEATURES, OrganizationMembership
from insights.plugins.test.mock import mocked_plugin_requests_get
from insights.plugins.test.plugin_archives import HELLO_WORLD_PLUGIN_GITHUB_ZIP


class TestOrganization(BaseTest):
    def setUp(self):
        super().setUp()
        cache.clear()

    def test_organization_active_invites(self):
        self.assertEqual(self.organization.invites.count(), 0)
        self.assertEqual(self.organization.active_invites.count(), 0)

        OrganizationInvite.objects.create(organization=self.organization)
        self.assertEqual(self.organization.invites.count(), 1)
        self.assertEqual(self.organization.active_invites.count(), 1)

        expired_invite = OrganizationInvite.objects.create(organization=self.organization)
        OrganizationInvite.objects.filter(id=expired_invite.id).update(created_at=timezone.now() - timedelta(hours=73))
        self.assertEqual(self.organization.invites.count(), 2)
        self.assertEqual(self.organization.active_invites.count(), 1)

    @mock.patch("requests.get", side_effect=mocked_plugin_requests_get)
    def test_plugins_are_preinstalled_on_self_hosted(self, mock_get):
        with self.is_cloud(False):
            with self.settings(PLUGINS_PREINSTALLED_URLS=["https://github.com/Hanzo Insights/helloworldplugin/"]):
                new_org, _, _ = Organization.objects.bootstrap(
                    self.user,
                    plugins_access_level=Organization.PluginsAccessLevel.INSTALL,
                )

        self.assertEqual(Plugin.objects.filter(organization=new_org, is_preinstalled=True).count(), 1)
        self.assertEqual(
            Plugin.objects.filter(organization=new_org, is_preinstalled=True).get().name,
            "helloworldplugin",
        )
        self.assertEqual(mock_get.call_count, 2)
        mock_get.assert_any_call(
            f"https://github.com/Hanzo Insights/helloworldplugin/archive/{HELLO_WORLD_PLUGIN_GITHUB_ZIP[0]}.zip",
            headers={},
        )

    @mock.patch("requests.get", side_effect=mocked_plugin_requests_get)
    def test_plugins_are_not_preinstalled_on_cloud(self, mock_get):
        with self.is_cloud(True):
            with self.settings(PLUGINS_PREINSTALLED_URLS=["https://github.com/Hanzo Insights/helloworldplugin/"]):
                new_org, _, _ = Organization.objects.bootstrap(
                    self.user,
                    plugins_access_level=Organization.PluginsAccessLevel.INSTALL,
                )

        self.assertEqual(Plugin.objects.filter(organization=new_org, is_preinstalled=True).count(), 0)
        self.assertEqual(mock_get.call_count, 0)

    def test_plugins_access_level_is_determined_based_on_realm(self):
        with self.is_cloud(True):
            new_org, _, _ = Organization.objects.bootstrap(self.user)
            assert new_org.plugins_access_level == Organization.PluginsAccessLevel.CONFIG

        with self.is_cloud(False):
            new_org, _, _ = Organization.objects.bootstrap(self.user)
            assert new_org.plugins_access_level == Organization.PluginsAccessLevel.ROOT

    def test_default_anonymize_ips_based_on_deployment(self):
        # EU deployment should default to True
        with self.settings(CLOUD_DEPLOYMENT="EU"):
            eu_org, _, _ = Organization.objects.bootstrap(self.user, name="EU Org")
            self.assertTrue(eu_org.default_anonymize_ips)

        # US deployment should default to False
        with self.settings(CLOUD_DEPLOYMENT="US"):
            us_org, _, _ = Organization.objects.bootstrap(self.user, name="US Org")
            self.assertFalse(us_org.default_anonymize_ips)

        # No deployment setting should default to False
        with self.settings(CLOUD_DEPLOYMENT=None):
            no_deployment_org, _, _ = Organization.objects.bootstrap(self.user, name="No Deployment Org")
            self.assertFalse(no_deployment_org.default_anonymize_ips)

        # Explicit value should override deployment setting
        with self.settings(CLOUD_DEPLOYMENT="EU"):
            explicit_org, _, _ = Organization.objects.bootstrap(
                self.user, name="Explicit Org", default_anonymize_ips=False
            )
            self.assertFalse(explicit_org.default_anonymize_ips)

    def test_update_available_product_features_states_what_the_build_carries(self):
        # The answer comes from the build, not from a subscription, so it does not vary with
        # `usage` or with whether this is called cloud — there is one build and one answer.
        with self.is_cloud(False):
            new_org, _, _ = Organization.objects.bootstrap(self.user)

            new_org.available_product_features = [{"key": "test1", "name": "test1"}]
            new_org.update_available_product_features()
            assert new_org.available_product_features == PRODUCT_FEATURES

            new_org.available_product_features = [{"key": "test1", "name": "test1"}]
            new_org.usage = {"events": {"usage": 1000, "limit": None}}
            new_org.update_available_product_features()
            assert new_org.available_product_features == PRODUCT_FEATURES

    def test_features_whose_implementation_is_gone_stay_unavailable(self):
        # The point of the list is as much what it withholds as what it grants: each of these names
        # an endpoint that answers 404, or a policy that raises. Granting one lights up UI that
        # cannot save, which is worse than a surface that says it is not here.
        new_org, _, _ = Organization.objects.bootstrap(self.user)
        for feature in (
            AvailableFeature.SUBSCRIPTIONS,
            AvailableFeature.ROLE_BASED_ACCESS,
            AvailableFeature.ADVANCED_PERMISSIONS,
            AvailableFeature.ACCESS_CONTROL,
            AvailableFeature.GROUP_ANALYTICS,
            AvailableFeature.SAML,
            AvailableFeature.SCIM,
            AvailableFeature.APPROVALS,
        ):
            assert not new_org.is_feature_available(feature), feature

    def test_each_organization_gets_its_own_feature_entries(self):
        """Down to the entries, not just the list holding them.

        A shallow copy passes an identity check on the list and still shares every dict inside it,
        so editing one organization's entry would edit every organization's and the constant.
        """
        one = Organization(name="one")
        another = Organization(name="another")
        one.update_available_product_features()
        another.update_available_product_features()

        assert one.available_product_features is not PRODUCT_FEATURES
        one.available_product_features[0]["limit"] = 999

        assert another.available_product_features[0]["limit"] is None
        assert PRODUCT_FEATURES[0]["limit"] is None

    def test_session_age_caching(self):
        # Test caching when session_cookie_age is set
        self.organization.session_cookie_age = 3600
        self.organization.save()
        self.assertEqual(cache.get(f"org_session_age:{self.organization.id}"), 3600)

        # Test cache deletion when session_cookie_age is set to None
        self.organization.session_cookie_age = None
        self.organization.save()
        self.assertIsNone(cache.get(f"org_session_age:{self.organization.id}"))

        # Test cache update when session_cookie_age changes
        self.organization.session_cookie_age = 7200
        self.organization.save()
        self.assertEqual(cache.get(f"org_session_age:{self.organization.id}"), 7200)

    @parameterized.expand(
        [
            ("valid_period", {"period": ["2024-01-01T00:00:00Z", "2024-02-01T00:00:00Z"]}, True),
            (
                "valid_period_with_other_data",
                {"period": ["2024-01-01T00:00:00Z", "2024-02-01T00:00:00Z"], "events": {"usage": 1000}},
                True,
            ),
            ("no_usage", None, False),
            ("empty_usage", {}, False),
            ("no_period_key", {"events": {"usage": 1000}}, False),
            ("period_none", {"period": None}, False),
            ("period_empty_list", {"period": []}, False),
            ("period_one_element", {"period": ["2024-01-01T00:00:00Z"]}, False),
            ("period_invalid_date_format", {"period": ["invalid", "2024-02-01T00:00:00Z"]}, False),
            ("period_non_iso_format", {"period": ["01/01/2024", "02/01/2024"]}, False),
        ]
    )
    def test_current_billing_period(self, name, usage_data, should_return_period):
        self.organization.usage = usage_data
        self.organization.save()

        result = self.organization.current_billing_period

        if should_return_period:
            self.assertIsNotNone(result)
            assert result is not None  # Type narrowing for mypy
            self.assertIsInstance(result, tuple)
            self.assertEqual(len(result), 2)
            self.assertIsInstance(result[0], datetime)
            self.assertIsInstance(result[1], datetime)
            self.assertLess(result[0], result[1])
        else:
            self.assertIsNone(result)


class TestOrganizationMembership(BaseTest):
    @patch("hanzo_insights.capture")
    def test_event_sent_when_membership_level_changed(
        self,
        mock_capture,
    ):
        user = self._create_user("user1")
        organization = Organization.objects.create(name="Test Org")
        membership = OrganizationMembership.objects.create(user=user, organization=organization, level=1)
        mock_capture.assert_not_called()
        # change the level
        membership.level = 15
        membership.save()
        # check that the event was sent
        mock_capture.assert_called_once_with(
            event="membership level changed",
            distinct_id=user.distinct_id,
            properties={"new_level": 15, "previous_level": 1, "$set": mock.ANY},
            groups=mock.ANY,
        )
