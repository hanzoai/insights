import pytest

import pytest_asyncio

from products.batch_exports.backend.tests.temporal.utils.datastore import (
    create_datastore_tables_and_views,
    truncate_events,
    truncate_persons,
    truncate_sessions,
)


# Since we autouse the `datastore_db_setup` below we need every test in this
# directory to have DB access, otherwise we can run into some strange errors
# during test setup. Requesting pytest-django's `db` fixture from an autouse
# fixture grants that access, and because this conftest is directory-scoped it
# only applies to tests under this directory.
@pytest.fixture(autouse=True)
def _enable_db(db):
    pass


@pytest_asyncio.fixture(scope="module", autouse=True, loop_scope="module")
async def datastore_db_setup(datastore_client, django_db_setup):
    await create_datastore_tables_and_views(datastore_client)


@pytest_asyncio.fixture(autouse=True)
async def truncate(datastore_client):
    """Fixture to automatically truncate data after a test.

    This is useful if during the test setup we insert a lot of data we wish to clean-up.
    """
    yield
    await truncate_events(datastore_client)
    await truncate_persons(datastore_client)
    await truncate_sessions(datastore_client)
