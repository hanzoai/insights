import pytest

from insights.insightsql.context import InsightsQLContext
from insights.insightsql.database.database import Database

from insights.models.organization import Organization
from insights.models.team.team import Team
from insights.models.user import User

from products.data_warehouse.backend.max_tools import _get_schema_description, _get_system_prompt, _get_user_prompt


@pytest.mark.django_db
def test_get_schema_description(snapshot):
    org = Organization.objects.create(name="org")
    team = Team.objects.create(organization=org)
    user = User.objects.create(email="test@test.com")

    query = "select * from events"
    database = Database.create_for(team=team, user=user)
    insightsql_context = InsightsQLContext(team_id=team.id, user=user, enable_select_queries=True, database=database)

    res = _get_schema_description({"insightsql_query": query}, insightsql_context, database)

    assert res == snapshot


@pytest.mark.django_db
def test_get_system_prompt(snapshot):
    org = Organization.objects.create(name="org")
    team = Team.objects.create(organization=org)

    database = Database.create_for(team.id)
    all_table_names = database.get_all_table_names()

    res = _get_system_prompt(all_table_names)

    assert res == snapshot


@pytest.mark.django_db
def test_get_user_prompt(snapshot):
    org = Organization.objects.create(name="org")
    team = Team.objects.create(organization=org)

    query = "select * from events"
    database = Database.create_for(team.id)
    insightsql_context = InsightsQLContext(team_id=team.id, enable_select_queries=True, database=database)

    schema_description = _get_schema_description({"insightsql_query": query}, insightsql_context, database)

    res = _get_user_prompt(schema_description)

    assert res == snapshot
