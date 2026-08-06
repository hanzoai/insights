import pytest
from unittest.mock import MagicMock

from insights.schema import NodeKind

import insights.schema_migrations as schema_migrations_module
from insights.schema_migrations import LATEST_VERSIONS, MIGRATIONS
from insights.schema_migrations.validate import validate_migrations


@pytest.fixture(autouse=True)
def _reset_migration_state():
    yield
    LATEST_VERSIONS.clear()
    MIGRATIONS.clear()
    schema_migrations_module._migrations_discovered = False


def test_linear():
    """Validation of the actual migrations."""
    validate_migrations()


def test_validate_migrations():
    MIGRATIONS.clear()
    MIGRATIONS[NodeKind.TRENDS_QUERY] = {1: MagicMock()}
    MIGRATIONS[NodeKind.EVENTS_NODE] = {1: MagicMock()}
    # Mark as discovered so validate_migrations() doesn't replace the stubs with the real migrations
    schema_migrations_module._migrations_discovered = True

    # Should not raise
    validate_migrations()

    # Gap in versions for EVENTS_NODE
    MIGRATIONS[NodeKind.EVENTS_NODE] = {1: MagicMock(), 3: MagicMock()}
    with pytest.raises(Exception):
        validate_migrations()

    # Wrong order of versions for EVENTS_NODE
    MIGRATIONS[NodeKind.EVENTS_NODE] = {2: MagicMock(), 1: MagicMock()}
    with pytest.raises(Exception):
        validate_migrations()
