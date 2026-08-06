import re
from typing import Any, cast

import hanzo_insights
from drf_spectacular.utils import extend_schema
from rest_framework import exceptions, request, response, serializers
from rest_framework.request import Request
from rest_framework.viewsets import ModelViewSet

from insights.api.routing import TeamAndOrgViewSetMixin
from insights.api.scoped_related_fields import OrgScopedPrimaryKeyRelatedField
from insights.api.utils import action
from insights.cloud_utils import is_cloud
from insights.constants import AvailableFeature
from insights.event_usage import groups
from insights.models import OrganizationDomain
from insights.models.identity_provider_config import IdentityProviderConfig
from insights.models.organization import Organization
from insights.permissions import OrganizationAdminWritePermissions, TimeSensitiveActionPermission
from insights.utils import get_instance_available_sso_providers

DOMAIN_REGEX = r"^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$"


class _OrgScopedIdentityProviderConfigField(OrgScopedPrimaryKeyRelatedField):
    # IdentityProviderConfig has a direct `organization` FK (not via team), so scope on it
    # directly. Scoping prevents linking a domain to (or probing) another org's config.
    scope_field = "organization"


def _capture_domain_event(request, domain: OrganizationDomain, event_type: str, properties: dict | None = None) -> None:
    if not properties:
        properties = {}

    properties.update(
        {
            "domain": domain.domain,
        }
    )

    hanzo_insights.capture(
        event=f"organization domain {event_type}",
        distinct_id=str(request.user.distinct_id),
        properties=properties,
        groups=groups(domain.organization),
    )


class OrganizationDomainSerializer(serializers.ModelSerializer):
    # Maps each verification-gated attribute's serializer source (the key seen in `validated_data`)
    # to the public field name used in error responses.
    UPDATE_ONLY_WHEN_VERIFIED = {
        "jit_provisioning_enabled": "jit_provisioning_enabled",
        "sso_enforcement": "sso_enforcement",
    }

    scim_base_url = serializers.SerializerMethodField()
    identity_provider_config = _OrgScopedIdentityProviderConfigField(
        queryset=IdentityProviderConfig.objects.all(),
        required=False,
        allow_null=True,
        help_text="Linked IdP configuration (SAML/SCIM/XAA) that backs this domain. Must belong to the same organization.",
    )

    class Meta:
        model = OrganizationDomain
        fields = (
            "id",
            "domain",
            "is_verified",
            "verified_at",
            "verification_challenge",
            "jit_provisioning_enabled",
            "sso_enforcement",
            "has_saml",
            "has_scim",
            "scim_base_url",
            "has_id_jag",
            "identity_provider_config",
        )
        extra_kwargs = {
            "verified_at": {"read_only": True},
            "verification_challenge": {"read_only": True},
            "is_verified": {"read_only": True},
            "has_saml": {"read_only": True},
            "has_scim": {"read_only": True},
            "scim_base_url": {"read_only": True},
            "has_id_jag": {"read_only": True},
        }

    def get_fields(self):
        fields = super().get_fields()
        if self.instance is not None:
            fields["domain"].read_only = True
        return fields

    def create(self, validated_data: dict[str, Any]) -> OrganizationDomain:
        organization: Organization = self.context["view"].organization
        if is_cloud() and not organization.is_feature_available(AvailableFeature.AUTOMATIC_PROVISIONING):
            raise exceptions.PermissionDenied("Automatic provisioning is not enabled for this organization.")
        validated_data["organization"] = self.context["view"].organization
        validated_data.pop(
            "jit_provisioning_enabled", None
        )  # can never be set on creation because domain must be verified
        validated_data.pop("sso_enforcement", None)  # can never be set on creation because domain must be verified
        instance: OrganizationDomain = super().create(validated_data)

        return instance

    def validate_domain(self, domain: str) -> str:
        if not re.match(DOMAIN_REGEX, domain):
            raise serializers.ValidationError("Please enter a valid domain or subdomain name.")
        return domain

    def validate_sso_enforcement(self, sso_enforcement: str) -> str:
        # The field is a free-text CharField with no choices and no validator, so any <=28-char
        # string could be persisted on a verified domain. An enforcement naming a provider this
        # instance does not build is unenforceable by construction -- there is no outcome in which
        # SSO actually happens -- and it is read from six UNAUTHENTICATED endpoints, where it used
        # to raise KeyError and answer 500 on every auth flow at that domain, SSO included.
        #
        # The read side now fails soft, which is the right behaviour for state that already exists.
        # This stops the state being created: refusing at the boundary is what keeps a login gate
        # from being configured into a shape that cannot gate anything.
        #
        # SAML is allowed even though it is absent from the instance-level providers, because it is
        # configured per domain rather than per instance.
        if not sso_enforcement:
            return sso_enforcement
        allowed = {"saml", *get_instance_available_sso_providers().keys()}
        if sso_enforcement not in allowed:
            raise serializers.ValidationError(
                f"Cannot enforce SSO with '{sso_enforcement}'. This instance offers: {', '.join(sorted(allowed))}.",
                code="sso_provider_unavailable",
            )
        return sso_enforcement

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        instance = cast(OrganizationDomain, self.instance)
        organization: Organization = self.context["view"].organization

        if instance and not instance.verified_at:
            for source_attr, public_name in self.UPDATE_ONLY_WHEN_VERIFIED.items():
                if source_attr in attrs:
                    raise serializers.ValidationError(
                        {public_name: "This attribute cannot be updated until the domain is verified."},
                        code="verification_required",
                    )
        if instance and attrs.get("jit_provisioning_enabled", None):
            if not organization.is_feature_available(AvailableFeature.AUTOMATIC_PROVISIONING):
                raise serializers.ValidationError(
                    {"jit_provisioning_enabled": "Automatic provisioning is not enabled for this organization."},
                    code="feature_not_available",
                )

        return attrs

    def update(self, instance: OrganizationDomain, validated_data: dict[str, Any]) -> OrganizationDomain:
        validated_data.pop("domain", None)  # domain is immutable after creation
        return super().update(instance, validated_data)

    def get_scim_base_url(self, obj: OrganizationDomain) -> str | None:
        # SCIM provisioning is an enterprise feature this fork does not carry, so no
        # domain has a provisioning endpoint to point a directory at.
        return None


@extend_schema(extensions={"x-product": "core"})
class OrganizationDomainViewset(TeamAndOrgViewSetMixin, ModelViewSet):
    scope_object = "organization"
    serializer_class = OrganizationDomainSerializer
    permission_classes = [OrganizationAdminWritePermissions, TimeSensitiveActionPermission]
    queryset = OrganizationDomain.objects.order_by("domain").all()

    @action(methods=["POST"], detail=True)
    def verify(self, request: request.Request, **kw) -> response.Response:
        instance = self.get_object()

        if instance.verified_at:
            raise exceptions.ValidationError("This domain has already been verified.", code="already_verified")

        instance, _ = instance.attempt_verification()

        serializer = self.get_serializer(instance=instance)
        return response.Response(serializer.data)

    def create(self, request: request.Request, *args: Any, **kwargs: Any) -> response.Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        _capture_domain_event(
            request,
            instance,
            "created",
            properties={
                "jit_provisioning_enabled": instance.jit_provisioning_enabled,
                "sso_enforcement": instance.sso_enforcement or None,
            },
        )

        return response.Response(serializer.data, status=201)

    def _capture_domain_setting_event(self, request: Request) -> None:
        data = request.data
        if "sso_enforcement" in data:
            event_type = "sso enforcement updated"
        elif data.get("jit_provisioning_enabled") is True:
            event_type = "jit provisioning enabled"
        else:
            return

        _capture_domain_event(request, self.get_object(), event_type)

    def update(self, request: request.Request, *args: Any, **kwargs: Any) -> response.Response:
        self._capture_domain_setting_event(request)
        return super().update(request, *args, **kwargs)

    def destroy(self, request: request.Request, *args: Any, **kwargs: Any) -> response.Response:
        instance = self.get_object()

        _capture_domain_event(
            request,
            instance,
            "deleted",
            properties={
                "is_verified": instance.is_verified,
                "had_saml": instance.has_saml,
                "had_jit_provisioning": instance.jit_provisioning_enabled,
                "had_sso_enforcement": bool(instance.sso_enforcement),
                "had_scim": instance.has_scim,
                "had_id_jag": instance.has_id_jag,
            },
        )

        instance.delete()
        return response.Response(status=204)
