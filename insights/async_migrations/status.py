def async_migrations_ok() -> bool:
    from insights.async_migrations.runner import is_insights_version_compatible
    from insights.models.async_migration import AsyncMigration, MigrationStatus

    for migration in AsyncMigration.objects.all():
        migration_completed_or_running = migration.status in [
            MigrationStatus.CompletedSuccessfully,
            MigrationStatus.Running,
        ]
        migration_in_range = is_insights_version_compatible(migration.insights_min_version, migration.insights_max_version)

        if not migration_completed_or_running and migration_in_range:
            return False

    return True
