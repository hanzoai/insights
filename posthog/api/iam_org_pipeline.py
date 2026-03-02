"""
Hanzo IAM Organization Pipeline for PostHog Social Auth.

This pipeline function runs during OIDC/SSO login and ensures the user
is assigned to the correct PostHog Organization based on their IAM org claim.

IAM (Casdoor/hanzo.id) provides the `owner` claim in userinfo which contains
the organization slug (e.g., "hanzo", "lux", "zoo").

This module:
  1. Extracts the org slug from the OIDC response `owner` field
  2. Creates or finds a PostHog Organization matching the IAM org
  3. Ensures a default Team exists within the organization
  4. Adds the user as a member of the organization (if not already)

This prevents cross-org data leakage by ensuring all PostHog data
(events, dashboards, insights, feature flags, etc.) is scoped to the
correct Organization->Team hierarchy.
"""

from typing import Any, Optional, Union

import structlog
from django.db import transaction
from social_django.strategy import DjangoStrategy

from posthog.models import Organization, OrganizationMembership, Team, User

logger = structlog.get_logger(__name__)


def _extract_iam_org_slug(response: dict, kwargs: dict) -> Optional[str]:
    """Extract the IAM organization slug from the OIDC response.

    Casdoor puts the org in the `owner` field. We also check common
    alternatives for other OIDC providers.
    """
    # Primary: Casdoor `owner` field
    org = response.get("owner") or response.get("org") or response.get("organization")

    # Skip the Casdoor built-in org -- it's not a real tenant
    if org and org.lower() in ("built-in", "admin"):
        return None

    return org or None


def _ensure_organization(org_slug: str) -> Organization:
    """Find or create a PostHog Organization for the given IAM org slug.

    Uses the slug as a stable identifier. The Organization name is
    title-cased from the slug.
    """
    org_name = org_slug.replace("-", " ").replace("_", " ").title()

    # Try to find by slug first (PostHog organizations have a slug field)
    try:
        org = Organization.objects.get(slug=org_slug)
        return org
    except Organization.DoesNotExist:
        pass

    # Try to find by name as fallback
    try:
        org = Organization.objects.get(name=org_name)
        return org
    except Organization.DoesNotExist:
        pass

    # Create new organization
    with transaction.atomic():
        org = Organization.objects.create(name=org_name)
        # Update the slug to match the IAM org slug
        # (PostHog auto-generates slugs, but we want deterministic mapping)
        Organization.objects.filter(id=org.id).update(slug=org_slug)
        org.refresh_from_db()

        logger.info(
            "iam_org_pipeline_created_organization",
            org_id=str(org.id),
            org_slug=org_slug,
            org_name=org_name,
        )

    return org


def _ensure_default_team(org: Organization) -> Team:
    """Ensure the organization has at least one team (project).

    PostHog requires a Team for event ingestion. If the org has no teams,
    create a default one.
    """
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


def _ensure_membership(user: User, org: Organization) -> None:
    """Ensure the user is a member of the organization.

    If the user has no membership, they are added with Member level.
    If the org has no other members, they become an Owner.
    """
    existing = OrganizationMembership.objects.filter(
        user=user, organization=org
    ).first()

    if existing:
        return

    # First member becomes Owner, subsequent members are Members
    member_count = OrganizationMembership.objects.filter(organization=org).count()
    level = (
        OrganizationMembership.Level.OWNER
        if member_count == 0
        else OrganizationMembership.Level.MEMBER
    )

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
    """Social auth pipeline: assign user to IAM org in PostHog.

    This function is called during the OIDC login pipeline. It:
      1. Reads the IAM org slug from the OIDC response
      2. Finds or creates the PostHog Organization
      3. Ensures a default Team exists
      4. Adds the user as a member

    Add to SOCIAL_AUTH_PIPELINE in settings:
        "posthog.api.iam_org_pipeline.iam_org_assign",
    """
    if not user:
        return None

    if not response:
        response = {}

    org_slug = _extract_iam_org_slug(response, kwargs)
    if not org_slug:
        logger.debug("iam_org_pipeline_no_org_slug", user_id=str(user.uuid))
        return None

    logger.info(
        "iam_org_pipeline_assigning",
        user_id=str(user.uuid),
        org_slug=org_slug,
    )

    try:
        org = _ensure_organization(org_slug)
        _ensure_default_team(org)
        _ensure_membership(user, org)

        # Set the user's current organization if not already set
        if user.current_organization_id != org.id:
            user.current_organization = org
            user.save(update_fields=["current_organization"])

    except Exception:
        logger.exception(
            "iam_org_pipeline_error",
            user_id=str(user.uuid),
            org_slug=org_slug,
        )
        # Don't fail the login -- just log the error
        # User will need to be manually assigned

    return None
