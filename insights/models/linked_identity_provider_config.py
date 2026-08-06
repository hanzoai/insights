from django.db import models

from insights.models.utils import UUIDModel


class LinkedIdentityProviderConfig(UUIDModel):
    organization_domain = models.ForeignKey(
        "insights.OrganizationDomain", on_delete=models.CASCADE, related_name="linked_identity_provider_configs"
    )
    identity_provider_config = models.ForeignKey(
        "insights.IdentityProviderConfig", on_delete=models.CASCADE, related_name="linked_identity_provider_configs"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("organization_domain", "identity_provider_config"),
                name="unique_linked_identity_provider_config",
            )
        ]
