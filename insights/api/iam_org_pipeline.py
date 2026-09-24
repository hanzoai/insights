"""
Hanzo IAM Organization Pipeline for Insights Social Auth.

This pipeline function runs during OIDC/SSO login and ensures the user
is assigned to the correct Insights Organization based on their IAM org claim.

IAM (hanzo.id) provides the `owner` claim in userinfo which contains
the organization slug (e.g., "hanzo", "lux", "zoo").

Security invariants (RED H2/M2/M3/M7):
  - Organizations are matched by SLUG ONLY. `slug` is the unique, immutable
    tenant key (LowercaseSlugField(unique=True)); `name` is user-editable and
    NON-unique, so matching by name would let one tenant merge into or take over
    another by renaming (cross-tenant org takeover). We never match by name.
  - Provisioning is ATOMIC and race-safe (unique-constraint + IntegrityError
    re-fetch), so two concurrent first-logins can never mint two orgs for one
    slug.
  - Login FAILS CLOSED: a login whose IAM org claim is absent/unresolvable, or
    for which we cannot correctly scope the user, is DENIED (AuthFailed) — never
    silently allowed into a self-created or wrong org.
  - Membership level is derived from the IAM role claim and DEFAULTS TO MEMBER.
    Being the first user in an org does NOT grant ownership.

Binding to the cloud project: cloud forwards every event it admits with a
project's publishable `pk-` key, and ingestion keeps an event only when that key
is some team's `api_token`. A team created here starts with a random token, so
until sign-in points it at the org's cloud project key, its events are dropped.
The lookup is `GET /v1/projects` asked as the signed-in user, with the IAM access
token this sign-in just issued: cloud answers only for an org the user belongs
to, and the token is used for that one call and never stored.
"""

from typing import Any, Optional, Union

import structlog
from django.conf import settings
from django.db import IntegrityError, transaction

import requests
from social_core.exceptions import AuthFailed
from social_django.strategy import DjangoStrategy

from insights.models import Organization, OrganizationMembership, Team, User
from insights.models.team.team_caching import set_team_in_cache

logger = structlog.get_logger(__name__)

# Sign-in waits on this call, so a slow cloud costs at most this much and the
# binding is retried at the next sign-in.
_CLOUD_TIMEOUT_SECONDS = 5


def _normalize_slug(org_slug: str) -> str:
    """The tenant key. IAM emits lowercase org names; LowercaseSlugField
    lowercases on save, so we normalize identically here for lookup parity."""
    return org_slug.strip().lower()


def _extract_iam_org_slug(response: dict, kwargs: dict) -> Optional[str]:
    """Extract the IAM organization slug from the OIDC response.

    IAM puts the org in the `owner` field. We also check common
    alternatives for other OIDC providers.
    """
    org = response.get("owner") or response.get("org") or response.get("organization")

    # Skip the IAM built-in / platform-admin orgs -- they are not tenants.
    if org and org.lower() in ("built-in", "admin"):
        return None

    return org or None


def _ensure_organization(org_slug: str) -> Organization:
    """Find or create the Insights Organization for an IAM org slug.

    SLUG-ONLY, atomic, race-safe. Never falls back to a name match (H2) and
    never rewrites an existing org's slug (which would hijack another tenant).
    """
    slug = _normalize_slug(org_slug)
    org_name = org_slug.replace("-", " ").replace("_", " ").title()

    org = Organization.objects.filter(slug=slug).first()
    if org:
        return org

    # Create under the deterministic IAM slug. Organization.objects.create
    # auto-generates a slug from the name, so we pin it to the IAM slug in the
    # SAME transaction. The unique constraint on slug makes this race-safe: a
    # concurrent login that wins the slug makes our pin raise IntegrityError,
    # which we resolve by re-fetching the winner (never a second org, never a
    # name match).
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
        # Slug is taken but not readable back -> refuse to guess. Fail closed.
        raise AuthFailed("hanzo-iam", f"Could not resolve organization for slug '{slug}'")


def _ensure_default_team(org: Organization) -> Team:
    """Ensure the organization has at least one team (project) for ingestion."""
    team = Team.objects.filter(organization=org).first()
    if team:
        return team

    with transaction.atomic():
        team = Team.objects.create(
            organization=org,
            name=f"{org.name} Default",
        )
        logger.info(
            "iam_org_pipeline_created_default_team",
            org_id=str(org.id),
            team_id=team.id,
        )

    return team


def _cloud_project(org_slug: str, access_token: str) -> Optional[dict]:
    """The org's cloud project whose publishable key its events carry.

    The oldest project with a `pk-` key, so the choice is the same at every
    sign-in. None when cloud does not answer or the org has no such project:
    analytics binding never decides whether a sign-in succeeds.
    """
    slug = _normalize_slug(org_slug)
    try:
        response = requests.get(
            f"{settings.HANZO_API_URL}/v1/projects",
            headers={"Authorization": f"Bearer {access_token}", "X-Org-Id": slug},
            timeout=_CLOUD_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        projects = response.json()
    except Exception as e:
        # The body is not logged: an error can echo back the bearer.
        logger.warning("iam_org_pipeline_cloud_projects_unavailable", org_slug=slug, error=type(e).__name__)
        return None

    if not isinstance(projects, list):
        logger.warning("iam_org_pipeline_cloud_projects_malformed", org_slug=slug)
        return None

    # Only the org that was asked about: a project of any other org is never
    # a key this org's team may carry.
    keyed = [
        p
        for p in projects
        if isinstance(p, dict)
        and str(p.get("org", "")).lower() == slug
        and isinstance(p.get("key"), str)
        and p["key"].startswith("pk-")
    ]
    if not keyed:
        return None
    return min(keyed, key=lambda p: (p.get("createdAt") or 0, str(p.get("id", ""))))


def _bind_cloud_project(org: Organization, org_slug: str, access_token: Optional[str]) -> None:
    """Give the org's first team its cloud project's key and name.

    Once any team of the org carries a `pk-` key this is one query and no call.
    A key already held by another org's team is never moved.
    """
    if not access_token:
        return
    if Team.objects.filter(organization=org, api_token__startswith="pk-").exists():
        return

    project = _cloud_project(org_slug, access_token)
    if project is None:
        return

    key = project["key"]
    if Team.objects.filter(api_token=key).exists():
        logger.warning("iam_org_pipeline_cloud_key_held_elsewhere", org_id=str(org.id), project=project.get("slug"))
        return

    team = Team.objects.filter(organization=org).order_by("id").first()
    if team is None:
        return

    old_token = team.api_token
    team.api_token = key
    if isinstance(project.get("name"), str) and project["name"]:
        team.name = project["name"][:200]
    try:
        with transaction.atomic():
            team.save(update_fields=["api_token", "name"])
    except IntegrityError:
        # Another org's team took the key between the check and the save.
        logger.warning("iam_org_pipeline_cloud_key_held_elsewhere", org_id=str(org.id), project=project.get("slug"))
        return
    set_team_in_cache(old_token, None)
    logger.info(
        "iam_org_pipeline_bound_cloud_project",
        org_id=str(org.id),
        team_id=team.id,
        project=project.get("slug"),
    )


def _membership_level(response: dict) -> int:
    """Derive the org membership level from the IAM role claim. Default MEMBER.

    Being the first user in an org grants NOTHING extra (M3). Only an explicit
    IAM owner/admin signal elevates the user.
    """
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
    """Ensure the user is a member of the organization at the given level.

    Idempotent: an existing membership is left as-is (level changes are an
    explicit admin action, not a per-login side effect).
    """
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
    """Social auth pipeline: scope the user to their IAM org in Insights.

    FAILS CLOSED: a login with no resolvable IAM org, or which cannot be
    correctly scoped, is DENIED (AuthFailed) rather than allowed into a
    self-created or wrong org.
    """
    if not user:
        return None

    if not response:
        response = {}

    org_slug = _extract_iam_org_slug(response, kwargs)
    if not org_slug:
        # RED M2: no IAM tenant claim -> deny. Never fall through to
        # self-service org creation or leave the user org-less-but-authed.
        logger.warning("iam_org_pipeline_no_org_slug_denied", user_id=str(user.uuid))
        raise AuthFailed(
            backend,
            "Your Hanzo IAM account is not a member of an organization authorized for Insights.",
        )

    logger.info("iam_org_pipeline_assigning", user_id=str(user.uuid), org_slug=org_slug)

    try:
        org = _ensure_organization(org_slug)
        _ensure_default_team(org)
        _bind_cloud_project(org, org_slug, response.get("access_token"))
        _ensure_membership(user, org, _membership_level(response))

        if user.current_organization_id != org.id:
            user.current_organization = org
            user.save(update_fields=["current_organization"])
    except AuthFailed:
        raise
    except Exception:
        # RED M2/M7: fail CLOSED. If we cannot correctly + safely scope the
        # user to their tenant, deny the login rather than risk mis-scoping.
        logger.error(
            "iam_org_pipeline_error_denied",
            user_id=str(user.uuid),
            org_slug=org_slug,
            exc_info=True,
        )
        raise AuthFailed(backend, "Could not assign your Insights organization. Contact your administrator.")

    return None
