from celery import shared_task

from insights.exceptions_capture import capture_exception
from insights.scoping_audit import skip_team_scope_audit


@shared_task(ignore_result=True, rate_limit="5/s")
@skip_team_scope_audit
def sync_members_to_billing(organization_id: str) -> None:
    from insights.models import Organization, OrganizationMembership

    organization = Organization.objects.get(id=organization_id)

    first_owner = organization.members.filter(
        organization_membership__level__gte=OrganizationMembership.Level.OWNER
    ).first()

    if not first_owner:
        capture_exception(Exception(f"Organization has no owner", {"organization_id": organization.id}))
        return

    first_owner.update_billing_organization_users(organization)


@shared_task(ignore_result=True, rate_limit="5/s")
@skip_team_scope_audit
def sync_from_billing(organization_id: str) -> None:
    # Pulling an organization's plan down from the billing service is an enterprise
    # feature this fork does not carry. Callers fan this out per organization on
    # membership changes, so it stays a task and does nothing rather than raising.
    pass
