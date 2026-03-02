import pytest
from insights.test.base import BaseTest, ClickhouseTestMixin

from insights.clickhouse.client import sync_execute
from insights.models.async_deletion.delete_person import remove_deleted_person_data
from insights.models.person.util import create_person


@pytest.mark.ee
class TestDeletePerson(BaseTest, ClickhouseTestMixin):
    CLASS_DATA_LEVEL_SETUP = False

    def test_delete_person(self):
        uuid = create_person(team_id=self.team.pk, version=0, is_deleted=False)
        create_person(uuid=uuid, team_id=self.team.pk, version=1, is_deleted=True)
        create_person(team_id=self.team.pk, version=0, is_deleted=True)
        create_person(team_id=self.team.pk, version=0)

        remove_deleted_person_data(mutations_sync=True)

        count = sync_execute("SELECT count() FROM person")[0][0]

        assert count == 1
