"""Scope an SSO login to its Hanzo IAM organization.

Hanzo IAM (hanzo.id) is the single federated login, and it carries the tenant in
the `owner` claim of userinfo -- the org slug, e.g. "hanzo". This pipeline step
turns that claim into an Insights Organization, Team and Membership so a user
lands in their own tenant and nobody else's.

Invariants, all of which are the difference between a login and a tenancy bug:

  - Organizations are matched by SLUG ONLY. `slug` is the unique, immutable
    tenant key (LowercaseSlugField(unique=True)); `name` is user-editable and
    non-unique, so matching on it would let one tenant merge into or take over
    another simply by renaming itself.
  - Provisioning is atomic and race-safe, so two concurrent first logins cannot
    mint two organizations for one slug.
  - Login fails CLOSED. A login whose org claim is absent or unresolvable is
    denied, never allowed through into a self-created or arbitrary org: an
    authenticated user in the wrong tenant is worse than a failed login.
  - Membership level is derived from the IAM role claim and defaults to MEMBER.
    Being the first user in an organization grants nothing.
  - A team is born holding the ingest key Hanzo cloud minted for it. Cloud is the
    one authority that mints one, so a team no key could be obtained for is not
    created at all: a team holding a locally invented key looks configured and
    drops every event it is sent.
"""

from typing import Any, Optional, Union

from django.db import IntegrityError, transaction

import structlog
from social_core.exceptions import AuthFailed
from social_django.strategy import DjangoStrategy

from insights import ingest
from insights.models import Organization, OrganizationMembership, Team, User

logger = structlog.get_logger(__name__)

# IAM's own tenants, which are not customer organizations.
RESERVED_IAM_ORGS = ("built-in", "admin")


def _normalize_slug(org_slug: str) -> str:
    """IAM emits lowercase org names and LowercaseSlugField lowercases on save,
    so lookups have to normalize identically or they miss an existing tenant."""
    return org_slug.strip().lower()


def _extract_iam_org_slug(response: dict) -> Optional[str]:
    """Read the tenant claim. IAM puts it in `owner`; the alternatives are what
    other OIDC providers call the same thing."""
    org = response.get("owner") or response.get("org") or response.get("organization")

    if org and org.lower() in RESERVED_IAM_ORGS:
        return None

    return org or None


def _ensure_organization(org_slug: str) -> Organization:
    slug = _normalize_slug(org_slug)
    org_name = org_slug.replace("-", " ").replace("_", " ").title()

    org = Organization.objects.filter(slug=slug).first()
    if org:
        return org

    # Organization.objects.create derives a slug from the name, so the IAM slug
    # is pinned in the same transaction. The unique constraint makes that
    # race-safe: a concurrent login that wins the slug makes this pin raise
    # IntegrityError, which resolves by re-fetching the winner -- never a second
    # organization, and never a fallback to matching on name.
    try:
        with transaction.atomic():
            org = Organization.objects.create(name=org_name)
            updated = Organization.objects.filter(id=org.id).exclude(slug=slug).update(slug=slug)
            if updated:
                org.refresh_from_db()
        logger.info(
            "iam_org_pipeline_created_organization",
            org_id=str(org.id),
            org_slug=slug,
            org_name=org_name,
        )
        return org
    except IntegrityError:
        existing = Organization.objects.filter(slug=slug).first()
        if existing:
            return existing
        # The slug is taken but unreadable, so which tenant this user belongs to
        # is unknown. Guessing is the one thing that must not happen here.
        raise AuthFailed("hanzo-iam", f"Could not resolve organization for slug '{slug}'")


def _ensure_default_team(org: Organization, user: User, access_token: str) -> Team:
    """Every organization needs at least one team before it can ingest anything."""
    team = Team.objects.filter(organization=org).first()
    if team:
        return team

    # Asked for before the transaction opens: this is a network round trip, and
    # holding a write open across one holds its locks for the whole of it. The
    # token in hand is the one this login just minted, so cloud is asked as the
    # person signing in and puts the project in their org.
    name = f"{org.name} Default"
    api_token = ingest.key(name=name, user=user, fresh=access_token)

    with transaction.atomic():
        team = Team.objects.create(
            organization=org,
            name=name,
            api_token=api_token,
        )
        logger.info(
            "iam_org_pipeline_created_default_team",
            org_id=str(org.id),
            team_id=team.id,
        )

    return team


def _membership_level(response: dict) -> int:
    """Only an explicit owner/admin signal from IAM elevates a user."""
    raw_roles = response.get("roles") or []
    role_names = set()
    if isinstance(raw_roles, list):
        for r in raw_roles:
            name = r.get("name") if isinstance(r, dict) else r
            if name:
                role_names.add(str(name).lower())

    if response.get("isOwner") is True or "owner" in role_names:
        return OrganizationMembership.Level.OWNER
    if response.get("isAdmin") is True or "admin" in role_names:
        return OrganizationMembership.Level.ADMIN
    return OrganizationMembership.Level.MEMBER


def _ensure_membership(user: User, org: Organization, level: int) -> None:
    """Idempotent: an existing membership is left alone, because a level change
    is an explicit administrative act rather than a side effect of logging in."""
    existing = OrganizationMembership.objects.filter(user=user, organization=org).first()
    if existing:
        return

    with transaction.atomic():
        OrganizationMembership.objects.create(
            user=user,
            organization=org,
            level=level,
        )
        logger.info(
            "iam_org_pipeline_added_membership",
            user_id=str(user.uuid),
            org_id=str(org.id),
            level=level,
        )


def iam_org_assign(
    strategy: DjangoStrategy,
    details: dict,
    backend: Any,
    user: Union[User, None] = None,
    response: Optional[dict] = None,
    *args: Any,
    **kwargs: Any,
) -> Optional[dict]:
    if not user:
        return None

    if not response:
        response = {}

    org_slug = _extract_iam_org_slug(response)
    if not org_slug:
        logger.warning("iam_org_pipeline_no_org_slug_denied", user_id=str(user.uuid))
        raise AuthFailed(
            backend,
            "Your Hanzo IAM account is not a member of an organization authorized for Insights.",
        )

    logger.info("iam_org_pipeline_assigning", user_id=str(user.uuid), org_slug=org_slug)

    try:
        org = _ensure_organization(org_slug)
        _ensure_default_team(org, user, response.get("access_token", ""))
        _ensure_membership(user, org, _membership_level(response))

        if user.current_organization_id != org.id:
            user.current_organization = org
            user.save(update_fields=["current_organization"])
    except AuthFailed:
        raise
    except Exception:
        # If the user cannot be scoped to their tenant correctly, deny. The
        # alternative is an authenticated session pointing at the wrong data.
        logger.error(
            "iam_org_pipeline_error_denied",
            user_id=str(user.uuid),
            org_slug=org_slug,
            exc_info=True,
        )
        raise AuthFailed(backend, "Could not assign your Insights organization. Contact your administrator.")

    return None
