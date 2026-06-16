from django.db import models

from insights.helpers.encrypted_fields import EncryptedJSONField
from insights.models.organization import Organization
from insights.models.utils import UUIDModel


class OrganizationIntegration(UUIDModel):
    class OrganizationIntegrationKind(models.TextChoices):
        VERCEL = "vercel"

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    kind = models.CharField(max_length=50, choices=OrganizationIntegrationKind.choices)
    # The ID of the integration in the external system
    integration_id = models.TextField(null=True, blank=True)
    # Any config that COULD be passed to the frontend
    config = models.JSONField(default=dict)
    sensitive_config = EncryptedJSONField(
        default=dict,
    )

    created_by = models.ForeignKey("User", on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "kind", "integration_id"],
                name="insights_organization_integration_kind_id_unique",
            )
        ]
