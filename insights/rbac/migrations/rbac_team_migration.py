import structlog

logger = structlog.get_logger(__name__)


def rbac_team_access_control_migration(organization_id: int) -> None:
    """Migrate legacy per-team permissions onto access controls.

    The legacy source of truth was `ExplicitTeamMembership`, an enterprise-licensed
    model this fork does not carry, so its table is never populated here and there is
    nothing to read. Organizations start on access controls directly. Kept as a no-op
    because `migrate_access_control` still calls it and reports the outcome.
    """
    logger.info("Skipping RBAC team migration: no legacy team memberships", organization_id=organization_id)
