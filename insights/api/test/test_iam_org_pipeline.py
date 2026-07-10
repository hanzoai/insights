"""RED regression tests for the Hanzo IAM org pipeline (H2/M2/M3/M7)."""

from unittest.mock import MagicMock

import pytest
from social_core.exceptions import AuthFailed

from insights.api.iam_org_pipeline import (
    _extract_iam_org_slug,
    _membership_level,
    iam_org_assign,
)
from insights.models import Organization, OrganizationMembership, Team, User
from insights.test.base import BaseTest


class TestIAMOrgPipelinePure:
    """Pure-logic tests (no DB)."""

    def test_membership_level_defaults_to_member(self):
        # M3: no role signal -> MEMBER (NOT owner, even for a first user).
        assert _membership_level({}) == OrganizationMembership.Level.MEMBER
        assert _membership_level({"owner": "hanzo"}) == OrganizationMembership.Level.MEMBER

    def test_membership_level_from_iam_role(self):
        assert _membership_level({"isAdmin": True}) == OrganizationMembership.Level.ADMIN
        assert _membership_level({"isOwner": True}) == OrganizationMembership.Level.OWNER
        assert _membership_level({"roles": [{"name": "Admin"}]}) == OrganizationMembership.Level.ADMIN
        assert _membership_level({"roles": ["owner"]}) == OrganizationMembership.Level.OWNER

    def test_extract_skips_builtin_and_admin_orgs(self):
        assert _extract_iam_org_slug({"owner": "hanzo"}, {}) == "hanzo"
        assert _extract_iam_org_slug({"owner": "built-in"}, {}) is None
        assert _extract_iam_org_slug({"owner": "admin"}, {}) is None
        assert _extract_iam_org_slug({}, {}) is None

    def test_no_org_claim_fails_closed(self):
        # M2: a login with no resolvable IAM org is DENIED (AuthFailed), never
        # allowed to fall through to self-service org creation.
        user = MagicMock(spec=["uuid"])
        user.uuid = "u-1"
        backend = MagicMock()
        with pytest.raises(AuthFailed):
            iam_org_assign(MagicMock(), {}, backend, user=user, response={"sub": "u-1"})


class TestIAMOrgPipelineDB(BaseTest):
    """DB tests: slug-only isolation (H2) + race safety (M7)."""

    def _login(self, user, owner):
        return iam_org_assign(MagicMock(), {}, MagicMock(), user=user, response={"owner": owner})

    def test_distinct_slugs_same_title_do_not_merge(self):
        # H2: "acme-corp" and "acme_corp" both title-case to "Acme Corp" but are
        # DISTINCT tenants -> two orgs, never merged onto one.
        u1 = self._make_user("a@x.com")
        u2 = self._make_user("b@y.com")
        self._login(u1, "acme-corp")
        self._login(u2, "acme_corp")
        assert Organization.objects.filter(slug="acme-corp").count() == 1
        assert Organization.objects.filter(slug="acme_corp").count() == 1
        assert u1.current_organization_id != u2.current_organization_id

    def test_rename_cannot_hijack_via_name(self):
        # H2: an attacker renaming their org's display name to a victim's
        # title-cased slug must NOT capture a new victim login (slug-only match).
        victim = self._make_user("victim@v.com")
        self._login(victim, "victim")
        victim_org = Organization.objects.get(slug="victim")

        attacker_org = Organization.objects.get(slug=self.organization.slug)
        attacker_org.name = "Victim"  # collide on display name only
        attacker_org.save()

        newcomer = self._make_user("new@v.com")
        self._login(newcomer, "victim")
        # Newcomer lands in the real victim org (by slug), NOT the attacker's.
        assert newcomer.current_organization_id == victim_org.id
        assert newcomer.current_organization_id != attacker_org.id

    def test_first_user_is_not_owner(self):
        # M3: first user in a freshly-provisioned org is MEMBER, not OWNER.
        u = self._make_user("first@z.com")
        self._login(u, "zeta")
        org = Organization.objects.get(slug="zeta")
        m = OrganizationMembership.objects.get(user=u, organization=org)
        assert m.level == OrganizationMembership.Level.MEMBER
        assert Team.objects.filter(organization=org).exists()

    def _make_user(self, email):
        return User.objects.create(email=email, first_name="T", distinct_id=email)
