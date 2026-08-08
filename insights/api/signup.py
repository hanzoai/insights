import json
from typing import Any, Optional, Union
from urllib.parse import urlencode

from django import forms
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.shortcuts import redirect
from django.urls.base import reverse

import structlog
import hanzo_insights
from rest_framework import generics, serializers
from social_core.pipeline.partial import partial
from social_django.strategy import DjangoStrategy

from insights.event_usage import report_user_signed_up
from insights.exceptions_capture import capture_exception
from insights.helpers.email_utils import validate_display_name
from insights.helpers.verified_domain_enforcement import resolve_login_organization
from insights.models import InviteExpiredException, Organization, OrganizationDomain, OrganizationInvite, Team, User
from insights.permissions import CanCreateOrg
from insights.temporal.signup_enrichment.trigger import start_signup_enrichment_workflow
from insights.utils import get_can_create_org, get_trusted_client_ip

logger = structlog.get_logger(__name__)


# Social Signup
# views & serializers
class SocialSignupSerializer(serializers.Serializer):
    """
    Signup serializer for an account created through the identity provider.
    Collects the organization details the IdP doesn't supply, then creates the
    organization, team and user. The social pipeline resumes at `continue_url`
    and is what actually signs the user in.
    """

    organization_name: serializers.Field = serializers.CharField(max_length=64)
    first_name: serializers.Field = serializers.CharField(max_length=128)
    role_at_organization: serializers.Field = serializers.CharField(max_length=123, required=False, default="")
    referral_source: serializers.Field = serializers.CharField(
        max_length=1000, required=False, allow_blank=True, default=""
    )
    referral_source_ai_prompt: serializers.Field = serializers.CharField(
        max_length=1000, required=False, allow_blank=True, default=""
    )

    def validate_first_name(self, value: str) -> str:
        return validate_display_name(value)

    def validate_organization_name(self, value: str) -> str:
        return validate_display_name(value)

    def create(self, validated_data, **kwargs):
        request = self.context["request"]

        # The address comes from the IdP-populated session, never from the request body —
        # the caller only gets to name their organization.
        email = request.session.get("email")

        if not request.session.get("backend") or not email:
            raise serializers.ValidationError(
                "Inactive social login session. Go to /login and log in before continuing."
            )

        organization_name = validated_data["organization_name"]
        role_at_organization = validated_data["role_at_organization"]
        referral_source = validated_data.get("referral_source", "")
        referral_source_ai_prompt = validated_data.get("referral_source_ai_prompt", "")
        first_name = validated_data["first_name"]

        is_instance_first_user: bool = not User.objects.exists()

        try:
            with transaction.atomic():
                organization, _team, user = User.objects.bootstrap(
                    organization_name=organization_name,
                    email=email,
                    password=None,
                    first_name=first_name,
                    create_team=self.create_team,
                    is_staff=is_instance_first_user,
                    is_email_verified=True,
                    role_at_organization=role_at_organization,
                )
        except IntegrityError:
            raise serializers.ValidationError(
                {"email": "There is already an account with this email address."},
                code="unique",
            )

        report_user_signed_up(
            user,
            is_instance_first_user=is_instance_first_user,
            is_organization_first_user=True,
            new_onboarding_enabled=(not organization.setup_section_2_completed),
            backend_processor="SocialSignupSerializer",
            user_analytics_metadata=user.get_analytics_metadata(),
            org_analytics_metadata=user.organization.get_analytics_metadata() if user.organization else None,
            role_at_organization=role_at_organization,
            referral_source=referral_source,
            referral_source_ai_prompt=referral_source_ai_prompt,
        )

        # Fire-and-forget real-time enrichment for onboarding routing. Fully guarded and
        # never raises, so it cannot block or fail signup.
        start_signup_enrichment_workflow(
            organization_id=str(organization.id),
            distinct_id=user.distinct_id,
            email=user.email,
            role_at_organization=role_at_organization,
            # Trusted-proxy-validated: a spoofed X-Forwarded-For must not pick the scored country.
            ip_address=get_trusted_client_ip(request),
        )

        logger.info(
            "social_create_user_signup",
            full_name_len=len(first_name),
            email_len=len(email),
            user=user.id,
        )

        return {"continue_url": reverse("social:complete", args=[request.session["backend"]])}

    def create_team(self, organization: Organization, user: User) -> Team:
        return Team.objects.create_with_data(initiating_user=user, organization=organization)

    def to_representation(self, instance: Any) -> Any:
        return self.instance


class SocialSignupViewset(generics.CreateAPIView):
    serializer_class = SocialSignupSerializer
    permission_classes = (CanCreateOrg,)


class TeamInviteSurrogate:
    """This reimplements parts of OrganizationInvite that enable compatibility with the old Team.signup_token."""

    def __init__(self, signup_token: str):
        team = Team.objects.select_related("organization").get(signup_token=signup_token)
        self.organization = team.organization

    def validate(*args, **kwargs) -> bool:
        return True

    def use(self, user: Any, *args, **kwargs) -> None:
        user.join(organization=self.organization)


class CompanyNameForm(forms.Form):
    companyName = forms.CharField(max_length=64)
    emailOptIn = forms.BooleanField(required=False)


def lookup_invite_for_saml(email: str, organization_domain_id: str) -> Optional[OrganizationInvite]:
    # nosemgrep: idor-lookup-without-org (ID from SAML response)
    organization_domain = OrganizationDomain.objects.get(id=organization_domain_id)
    if not organization_domain:
        return None
    return (
        OrganizationInvite.objects.filter(target_email=email, organization=organization_domain.organization)
        .order_by("-created_at")
        .first()
    )


def process_social_invite_signup(
    strategy: DjangoStrategy, invite_id: str, email: str, full_name: str, user: Optional[User] = None
) -> Optional[User]:
    try:
        # nosemgrep: idor-lookup-without-org (invite UUID from server session serves as auth token)
        invite: Union[OrganizationInvite, TeamInviteSurrogate] = OrganizationInvite.objects.select_related(
            "organization"
        ).get(id=invite_id)
    except (OrganizationInvite.DoesNotExist, ValidationError):
        try:
            invite = TeamInviteSurrogate(invite_id)
        except Team.DoesNotExist:
            return None
        # Legacy team signup tokens bind to no email and never expire, so this branch must run the
        # domain gate itself — real invites get it upstream via their resolved organization.
        if OrganizationDomain.objects.is_email_blocked_by_domain_enforcement(email, invite.organization):
            return None

    # Capture before invite.use() — use() deletes the invite row, so the in-memory boolean is
    # the only safe source of truth for delegation routing.
    is_delegation = bool(getattr(invite, "is_setup_delegation", False))
    if user:
        invite.validate(user=user, email=email)
        invite.use(user, prevalidated=True)
        if is_delegation:
            strategy.session_set("next", "/onboarding")
        return user
    else:
        invite.validate(user=None, email=email)

        try:
            _user = strategy.create_user(email=email, first_name=full_name, password=None, is_email_verified=True)
            invite.use(_user, prevalidated=True)
        except Exception as e:
            capture_exception(e)
            message = "Account unable to be created. This account may already exist. Please try again or use different credentials."
            raise ValidationError(message, code="unknown", params={"source": "social_create_user"})

        if is_delegation:
            strategy.session_set("next", "/onboarding")
        return _user


def process_social_domain_jit_provisioning_signup(
    strategy: DjangoStrategy, email: str, full_name: str, user: Optional[User] = None
) -> Optional[User]:
    # Check if the user is on an allowed domain
    domain = email.split("@")[-1]
    try:
        logger.info(f"process_social_domain_jit_provisioning_signup", domain=domain)
        domain_instance = OrganizationDomain.objects.get(domain__iexact=domain)
    except OrganizationDomain.DoesNotExist:
        logger.info(
            f"process_social_domain_jit_provisioning_signup_domain_does_not_exist",
            domain=domain,
        )
        return user
    else:
        logger.info(
            f"process_social_domain_jit_provisioning_signup_domain_exists",
            domain=domain,
            is_verified=domain_instance.is_verified,
            jit_provisioning_enabled=domain_instance.jit_provisioning_enabled,
            scim_enabled=domain_instance.idp_config.scim_enabled,
        )
        if domain_instance.is_verified and domain_instance.jit_provisioning_enabled:
            if not user:
                try:
                    invite: OrganizationInvite = OrganizationInvite.objects.get(
                        target_email=email, organization=domain_instance.organization
                    )
                    invite.validate(user=None, email=email)
                    # Capture before invite.use() deletes the invite row.
                    is_delegation = bool(getattr(invite, "is_setup_delegation", False))

                    try:
                        user = strategy.create_user(
                            email=email, first_name=full_name, password=None, is_email_verified=True
                        )
                        assert isinstance(user, User)  # type hinting
                        invite.use(user, prevalidated=True)
                    except Exception as e:
                        capture_exception(e)
                        message = "Account unable to be created. This account may already exist. Please try again or use different credentials."
                        raise ValidationError(message, code="unknown", params={"source": "social_create_user"})

                    if is_delegation:
                        strategy.session_set("next", "/onboarding")

                except (OrganizationInvite.DoesNotExist, InviteExpiredException):
                    user = User.objects.create_and_join(
                        organization=domain_instance.organization,
                        email=email,
                        password=None,
                        first_name=full_name,
                        is_email_verified=True,
                    )
                    logger.info(
                        f"process_social_domain_jit_provisioning_join_complete",
                        domain=domain,
                        user=user.email,
                        organization=domain_instance.organization_id,
                    )

            # Existing user:
            # Auto-join because JIT provisioning is enabled
            # SCIM (if enabled) will update roles/groups after they join
            if not user.organizations.filter(pk=domain_instance.organization_id).exists():
                user.join(organization=domain_instance.organization)
                logger.info(
                    f"process_social_domain_jit_provisioning_join_existing",
                    domain=domain,
                    user=user.email,
                    organization=domain_instance.organization_id,
                    scim_enabled=domain_instance.idp_config.scim_enabled,
                )

    return user


def _resolve_invite_organization(invite_id: str) -> Optional[Organization]:
    """Organization an invite grants access to, or None for legacy team-invite surrogates / missing invites."""
    try:
        # nosemgrep: idor-lookup-without-org (invite UUID from server session serves as auth token)
        invite = OrganizationInvite.objects.select_related("organization").get(id=invite_id)
    except (OrganizationInvite.DoesNotExist, ValidationError):
        return None
    return invite.organization


@partial
def social_create_user(
    strategy: DjangoStrategy,
    details,
    backend,
    request,
    user: Union[User, None] = None,
    *args,
    **kwargs,
):
    hanzo_insights.tag("details", json.dumps(details))
    invite_id = strategy.session_get("invite_id")
    backend_processor = "social_create_user"
    email = details["email"][0] if isinstance(details["email"], list | tuple) else details["email"]
    full_name = (
        details.get("fullname")
        or f"{details.get('first_name') or ''} {details.get('last_name') or ''}".strip()
        or details.get("username")
    )

    # Handle SAML invites (organization_domain_id is the relay_state)
    organization_domain_id = kwargs.get("response", {}).get("idp_name")
    if not invite_id and organization_domain_id:
        invite = lookup_invite_for_saml(email, organization_domain_id)
        invite_id = invite.id if invite else None

    # Domain enforcement: refuse blocked members — blocked admins still get a gated session.
    # Joins (below) stay blocked for everyone.
    if user and not resolve_login_organization(user):
        logger.warning("social_create_user_blocked_domain_enforcement", user_id=user.pk)
        return redirect("/login?error_code=verified_domain_required")

    invite_organization = _resolve_invite_organization(invite_id) if invite_id else None
    enforcement_email = user.email if user else email
    if (
        invite_organization is not None
        and enforcement_email
        and OrganizationDomain.objects.is_email_blocked_by_domain_enforcement(enforcement_email, invite_organization)
    ):
        logger.warning(
            "social_create_user_blocked_domain_enforcement",
            organization=str(invite_organization.id),
        )
        return redirect("/login?error_code=verified_domain_required")

    if user:
        # If the user is already authenticated, we're looking for outstanding invites for them
        # on the organization domain or if JIT provisioning is enabled, we'll provision them.
        logger.info(f"social_create_user_is_not_new")

        if not user.is_email_verified:
            # The IdP asserted this address, so it counts as verified from here on.
            user.is_email_verified = True
            user.save(update_fields=["is_email_verified"])

        if invite_id:
            process_social_invite_signup(strategy, invite_id, user.email, user.first_name, user)
        else:
            process_social_domain_jit_provisioning_signup(strategy, user.email, user.first_name, user)

        return {"is_new": False}

    strategy.session_set("user_name", full_name)
    strategy.session_set("backend", backend.name)
    from_invite = False

    if not email or not full_name:
        missing_attr = "email" if not email else "name"
        hanzo_insights.tag("email", email)
        hanzo_insights.tag("name", full_name)
        raise ValidationError(
            {missing_attr: "This field is required and was not provided by the IdP."},
            code="required",
        )

    # If we get here then it's a new user. We'll check for outstanding invites for them
    # on the organization domain or if JIT provisioning is enabled, we'll provision them.
    # And fallback to a form where they can create an organization.
    logger.info(f"social_create_user", full_name_len=len(full_name), email_len=len(email))

    if invite_id:
        from_invite = True
        user = process_social_invite_signup(strategy, invite_id, email, full_name)
        if user is None:
            return redirect("/login?error_code=invalid_invite")

    else:
        # JIT Provisioning?
        user = process_social_domain_jit_provisioning_signup(strategy, email, full_name)
        logger.info(
            f"social_create_user_jit_user",
            full_name_len=len(full_name),
            email_len=len(email),
            user=user.id if user else None,
        )
        if user:
            backend_processor = "domain_whitelist"  # This is actually `jit_provisioning` (name kept for backwards-compatibility purposes)
            from_invite = True  # jit_provisioning means they're definitely not organization_first_user

        if not user:
            logger.info(
                f"social_create_user_jit_failed",
                full_name_len=len(full_name),
                email_len=len(email),
            )

            if not get_can_create_org(request.user):
                if email and OrganizationDomain.objects.get_verified_for_email_address(email):
                    # There's a claimed and verified domain for the user's email address domain, but JIT provisioning is not enabled. To avoid confusion
                    # don't let the user create a new org (very likely they won't want this) and show an appropriate error response.
                    return redirect("/login?error_code=jit_not_enabled")
                else:
                    return redirect("/login?error_code=no_new_organizations")
            strategy.session_set("email", email)
            organization_name = strategy.session_get("organization_name")
            next_url = strategy.session_get("next")

            query_params = {
                "organization_name": organization_name or "",
                "first_name": full_name or "",
                "email": email or "",
                "next": next_url or "",
            }
            query_params_string = urlencode(query_params)
            logger.info(
                "social_create_user_confirm_organization",
                full_name_len=len(full_name),
                email_len=len(email),
            )

            return redirect(f"/organization/confirm-creation?{query_params_string}")

    report_user_signed_up(
        user,
        is_instance_first_user=User.objects.count() == 1,
        is_organization_first_user=not from_invite,
        new_onboarding_enabled=False,
        backend_processor=backend_processor,
        social_provider=backend.name,
        user_analytics_metadata=user.get_analytics_metadata(),
        org_analytics_metadata=user.organization.get_analytics_metadata() if user.organization else None,
        referral_source="social signup - no info",
    )

    return {"is_new": True, "user": user}
