import uuid
from typing import Any, Optional

from insights.test.base import APIBaseTest

from django.utils import timezone

from rest_framework import status

from insights.api.signup import process_social_domain_jit_provisioning_signup, process_social_invite_signup
from insights.models import Organization, Team, User
from insights.models.organization import OrganizationMembership
from insights.models.organization_domain import OrganizationDomain
from insights.models.organization_invite import OrganizationInvite


class FakeStrategy:
    """The slice of social-auth's `DjangoStrategy` these pipeline functions actually touch."""

    def __init__(self) -> None:
        self.session: dict[str, Any] = {}

    def create_user(self, **kwargs: Any) -> User:
        return User.objects.create_user(**kwargs)

    def session_set(self, key: str, value: Any) -> None:
        self.session[key] = value

    def session_get(self, key: str, default: Optional[Any] = None) -> Any:
        return self.session.get(key, default)


class TestSocialSignupAPI(APIBaseTest):
    """`/v1/social_signup`: name the organization once the IdP has authenticated but before the pipeline resumes."""

    CONFIG_EMAIL = None

    def test_creates_organization_and_user_from_the_social_session(self):
        Organization.objects.all().delete()  # organizations can only be created on a fresh instance
        session = self.client.session
        session.update({"backend": "oidc", "email": "max@hanzo.ai"})
        session.save()

        response = self.client.post(
            "/v1/social_signup",
            {"organization_name": "Scriptflix", "first_name": "Max"},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # The pipeline resumes here, and it — not this endpoint — signs the user in.
        self.assertEqual(response.json(), {"continue_url": "/complete/oidc/"})
        self.assertEqual(User.objects.filter(email="max@hanzo.ai", first_name="Max", is_email_verified=True).count(), 1)
        self.assertEqual(Organization.objects.filter(name="Scriptflix").count(), 1)

    def test_takes_the_address_from_the_session_not_the_request(self):
        Organization.objects.all().delete()
        session = self.client.session
        session.update({"backend": "oidc", "email": "asserted@hanzo.ai"})
        session.save()

        response = self.client.post(
            "/v1/social_signup",
            {"organization_name": "Scriptflix", "first_name": "Max", "email": "attacker@hanzo.ai"},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="asserted@hanzo.ai").exists())
        self.assertFalse(User.objects.filter(email="attacker@hanzo.ai").exists())

    def test_refuses_without_an_active_social_session(self):
        Organization.objects.all().delete()

        response = self.client.post(
            "/v1/social_signup",
            {"organization_name": "Tech R Us", "first_name": "Max"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json(),
            {
                "type": "validation_error",
                "code": "invalid_input",
                "detail": "Inactive social login session. Go to /login and log in before continuing.",
                "attr": None,
            },
        )
        self.assertEqual(len(self.client.session.keys()), 0)  # nothing is saved in the session

    def test_refuses_without_an_organization_name(self):
        Organization.objects.all().delete()

        response = self.client.post("/v1/social_signup", {})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json(),
            {
                "type": "validation_error",
                "code": "required",
                "detail": "This field is required.",
                "attr": "organization_name",
            },
        )
        self.assertEqual(len(self.client.session.keys()), 0)


class TestSocialInviteSignup(APIBaseTest):
    """Invite acceptance now runs entirely through the identity provider: /login -> IdP -> `social_create_user`."""

    def _invite(self, target_email: str, **kwargs: Any) -> OrganizationInvite:
        return OrganizationInvite.objects.create(
            organization=self.organization,
            target_email=target_email,
            created_by=self.user,
            **kwargs,
        )

    def test_invite_creates_the_user_and_joins_the_organization(self):
        invite = self._invite("invitee@hanzo.ai")
        strategy = FakeStrategy()

        user = process_social_invite_signup(strategy, str(invite.id), "invitee@hanzo.ai", "Ingrid Invitee")

        assert user is not None
        self.assertEqual(user.email, "invitee@hanzo.ai")
        self.assertTrue(user.is_email_verified)  # the IdP asserted the address
        self.assertTrue(OrganizationMembership.objects.filter(organization=self.organization, user=user).exists())
        self.assertFalse(OrganizationInvite.objects.filter(id=invite.id).exists())  # consumed

    def test_invite_joins_an_existing_user(self):
        other_organization = Organization.objects.create(name="Other org")
        existing = User.objects.create_and_join(
            organization=other_organization, email="existing@hanzo.ai", password=None, first_name="Ex"
        )
        invite = self._invite("existing@hanzo.ai")
        strategy = FakeStrategy()

        user = process_social_invite_signup(strategy, str(invite.id), existing.email, existing.first_name, existing)

        self.assertEqual(user, existing)
        self.assertTrue(OrganizationMembership.objects.filter(organization=self.organization, user=existing).exists())
        self.assertFalse(OrganizationInvite.objects.filter(id=invite.id).exists())

    def test_setup_delegation_invite_routes_to_onboarding(self):
        invite = self._invite("delegate@hanzo.ai", is_setup_delegation=True)
        strategy = FakeStrategy()

        process_social_invite_signup(strategy, str(invite.id), "delegate@hanzo.ai", "Dee Delegate")

        self.assertEqual(strategy.session_get("next"), "/onboarding")

    def test_returns_none_for_a_nonexistent_invite(self):
        strategy = FakeStrategy()

        result = process_social_invite_signup(strategy, str(uuid.uuid4()), "nobody@hanzo.ai", "No Body")

        self.assertIsNone(result)


class TestSocialDomainJitProvisioning(APIBaseTest):
    def _domain(self, domain: str, *, verified: bool, jit: bool) -> OrganizationDomain:
        organization = Organization.objects.create(name=f"Org for {domain}")
        Team.objects.create(organization=organization, name="Test project")
        return OrganizationDomain.objects.create(
            domain=domain,
            organization=organization,
            verified_at=timezone.now() if verified else None,
            jit_provisioning_enabled=jit,
        )

    def test_provisions_a_new_user_on_a_verified_jit_domain(self):
        organization_domain = self._domain("scriptflix.hanzo.ai", verified=True, jit=True)
        strategy = FakeStrategy()

        user = process_social_domain_jit_provisioning_signup(strategy, "new@scriptflix.hanzo.ai", "New Person")

        assert user is not None
        self.assertTrue(user.is_email_verified)
        self.assertTrue(
            OrganizationMembership.objects.filter(organization=organization_domain.organization, user=user).exists()
        )

    def test_does_not_provision_on_an_unverified_domain(self):
        self._domain("unverified.hanzo.ai", verified=False, jit=True)
        strategy = FakeStrategy()

        user = process_social_domain_jit_provisioning_signup(strategy, "new@unverified.hanzo.ai", "New Person")

        self.assertIsNone(user)
        self.assertFalse(User.objects.filter(email="new@unverified.hanzo.ai").exists())

    def test_does_not_provision_when_jit_is_disabled(self):
        self._domain("nojit.hanzo.ai", verified=True, jit=False)
        strategy = FakeStrategy()

        user = process_social_domain_jit_provisioning_signup(strategy, "new@nojit.hanzo.ai", "New Person")

        self.assertIsNone(user)
        self.assertFalse(User.objects.filter(email="new@nojit.hanzo.ai").exists())

    def test_leaves_an_unknown_domain_alone(self):
        strategy = FakeStrategy()

        user = process_social_domain_jit_provisioning_signup(strategy, "new@unknown.hanzo.ai", "New Person")

        self.assertIsNone(user)
