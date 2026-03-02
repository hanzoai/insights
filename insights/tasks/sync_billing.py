from celery import shared_task


@shared_task(ignore_result=True, rate_limit="5/s")
def sync_members_to_billing(organization_id: str) -> None:
    from insights.models import Organization, OrganizationMembership

    organization = Organization.objects.get(id=organization_id)

    first_owner = organization.members.filter(
        organization_membership__level__gte=OrganizationMembership.Level.OWNER
    ).first()

    if not first_owner:
        return

    first_owner.update_billing_organization_users(organization)


@shared_task(ignore_result=True, rate_limit="5/s")
def sync_from_billing(organization_id: str) -> None:
    pass
