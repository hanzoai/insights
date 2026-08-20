import re

import structlog
from loginas.utils import is_impersonated_session
from rest_framework.exceptions import PermissionDenied
from rest_framework.request import Request

from insights.models.organization import OrganizationMembership
from insights.models.organization_domain import OrganizationDomain
from insights.models.user import User

logger = structlog.get_logger(__name__)

VERIFIED_DOMAIN_REQUIRED_ERROR = (
    "Your organization only allows members with a verified email domain. Contact your organization's admin for access."
)

_ORGANIZATION_DETAIL_PATH = re.compile(r"^/v1/organizations/[^/]+/?$")

# Paths a blocked member must still reach: to see why they are blocked, to leave,
# and to come back through Hanzo IAM. Everything else is denied.
_EXEMPT_PATHS = frozenset(
    {
        "/logout/",
        "/v1/logout/",
        "/v1/users/@me/",
        "/_health/",
    }
)

_EXEMPT_PREFIXES = (
    "/static/",
    "/uploaded_media/",
    "/login/oidc",
    "/complete/oidc",
    "/v1/social_signup",
)


def _is_path_exempt(path: str) -> bool:
    return path in _EXEMPT_PATHS or path.startswith(_EXEMPT_PREFIXES)


def is_enforcement_disable_request(request: Request) -> bool:
    """
    The escape hatch: a PATCH to the organization itself passes the domain gates so a blocked
    admin can turn `enforce_verified_domains` off.
    `OrganizationSerializer.validate` rejects every other field change from a blocked admin, and the
    standard admin-write permission still applies.
    """
    return request.method == "PATCH" and bool(_ORGANIZATION_DETAIL_PATH.match(request.path))


def enforce_verified_domain(request: Request, user: User) -> None:
    """
    Deny requests from members whose email is outside their current organization's verified domains,
    so enabling the setting cuts off sessions that are already live. The authoritative boundary is
    `VerifiedDomainEnforcementPermission`, which checks the URL-resolved organization and covers
    non-session authenticators too.

    An IdP login proves who the user is, not that the organization admits their email domain, so
    an OIDC session is not exempt either.
    """
    if _is_path_exempt(request.path):
        return

    if is_enforcement_disable_request(request):
        return

    if is_impersonated_session(request._request):
        return

    if OrganizationDomain.objects.is_access_blocked_by_domain_enforcement(user):
        raise PermissionDenied(detail=VERIFIED_DOMAIN_REQUIRED_ERROR, code="verified_domain_required")


def resolve_login_organization(user: User) -> bool:
    """
    Settle which organization `user` lands in at login, and return whether login may proceed.

    When the current organization no longer admits their email, they're moved to one that does.
    When no organization admits them, only admins may still log in — the per-request gate then
    denies everything except the whitelist and the enforcement escape hatch, so they can disable
    the setting after their session expired. Members have no recovery action a session would
    enable, so they're refused outright with a clear error instead of a fully gated app.
    """
    if not OrganizationDomain.objects.is_access_blocked_by_domain_enforcement(user):
        return True

    permitted_organization = next(
        (
            organization
            for organization in user.organizations.all()
            if not OrganizationDomain.objects.is_email_blocked_by_domain_enforcement(user.email, organization)
        ),
        None,
    )
    if permitted_organization is None:
        return user.organization_memberships.filter(level__gte=OrganizationMembership.Level.ADMIN).exists()

    logger.info(
        "domain_enforcement_moved_user_to_permitted_organization",
        user_id=user.pk,
        organization=str(permitted_organization.id),
    )
    user.current_organization = permitted_organization
    user.current_team = permitted_organization.teams.first()
    user.save(update_fields=["current_organization", "current_team"])
    # `user.organization` / `user.team` are cached properties, already read above with the blocked
    # organization; drop the cached values so later code in this request sees the new one.
    user.__dict__.pop("organization", None)
    user.__dict__.pop("team", None)
    return True
