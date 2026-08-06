import structlog

logger = structlog.get_logger(__name__)


def rbac_feature_flag_role_access_migration(organization_id: str) -> None:
    """Migrate legacy feature flag permissions onto access controls.

    The legacy sources of truth were `FeatureFlagRoleAccess` and
    `OrganizationResourceAccess`, enterprise-licensed models this fork does not carry,
    so their tables are never populated here and there is nothing to read. Flag
    permissions come from access controls directly. Kept as a no-op because
    `migrate_access_control` still calls it and reports the outcome.
    """
    logger.info("Skipping RBAC feature flag migration: no legacy flag permissions", organization_id=organization_id)
