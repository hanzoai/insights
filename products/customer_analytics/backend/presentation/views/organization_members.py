from uuid import UUID

from django.db.models import QuerySet

from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets

from insights.api.organization_member import organization_members_base_queryset
from insights.api.routing import TeamAndOrgViewSetMixin
from insights.models import OrganizationMembership
from insights.permissions import IsStaffUserOrImpersonating, InsightsFeatureFlagPermission

from products.customer_analytics.backend.facade.constants import CUSTOMER_ANALYTICS_CSP_FLAG
from products.customer_analytics.backend.presentation.views.serializers import AccountOrganizationMemberSerializer


# Excluded from the generated OpenAPI clients: this is an INTERNAL, staff-only endpoint
# consumed only by the customer-analytics Accounts UI via a handwritten api call (consistent
# with how the sibling organization-members endpoints are accessed).
@extend_schema(exclude=True)
class OrganizationMembersForAccountViewSet(
    TeamAndOrgViewSetMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """Members of the organization given by `organization_id`. Read-only, internal."""

    scope_object = "INTERNAL"
    serializer_class = AccountOrganizationMemberSerializer
    permission_classes = [InsightsFeatureFlagPermission, IsStaffUserOrImpersonating]
    insights_feature_flag = CUSTOMER_ANALYTICS_CSP_FLAG

    def dangerously_get_queryset(self) -> QuerySet:
        # Not scoped to the caller's org — the target org comes from the query param; the flag and is_staff gate access.
        organization_id = self.request.GET.get("organization_id")
        if not organization_id:
            return OrganizationMembership.objects.none()
        try:
            UUID(str(organization_id))
        except (ValueError, TypeError):
            return OrganizationMembership.objects.none()
        # Ordering kept (not removed): pagination needs a stable, index-backed order; `-joined_at`
        # is served by the (organization, -joined_at) composite index when filtering by organization_id.
        return organization_members_base_queryset().filter(organization_id=organization_id).order_by("-joined_at")
