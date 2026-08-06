import json
from typing import Any, cast

from insights.test.base import QueryMatchingTest
from unittest.mock import Mock, patch

from django.test import TestCase

from insights.models.file_system.file_system import FileSystem
from insights.models.team.team import Team
from insights.models.user import User

from products.actions.backend.models.action import Action
from products.cdp.backend.models.insights_functions.insights_function import InsightsFunction, InsightsFunctionType
from products.cdp.backend.tasks.insights_functions import refresh_affected_insights_functions
from products.cohorts.backend.models.cohort import Cohort

from common.scriptvm.python.operation import INSIGHTSQL_BYTECODE_VERSION

to_dict = lambda x: json.loads(json.dumps(x))


def get_bytecode(filters: Any) -> Any:
    return cast(dict[str, Any], filters)["bytecode"]


class TestInsightsFunction(TestCase):
    def setUp(self):
        super().setUp()
        org, team, user = User.objects.bootstrap("Test org", "ben@hanzo.ai", None)
        self.team = team
        self.user = user
        self.org = org

    def test_insights_function_basic(self):
        item = InsightsFunction.objects.create(name="Test", team=self.team, type="destination")
        assert item.name == "Test"
        assert item.script == ""
        assert not item.enabled

    def test_insights_function_team_no_filters_compilation(self):
        item = InsightsFunction.objects.create(name="Test", team=self.team, type="destination")

        # Some json serialization is needed to compare the bytecode more easily in tests
        json_filters = to_dict(item.filters)
        assert json_filters["bytecode"] == ["_H", INSIGHTSQL_BYTECODE_VERSION, 29]  # TRUE

    def test_insights_function_filters_compilation(self):
        self.team.test_account_filters = [
            {"key": "$host", "operator": "not_regex", "value": r"^(localhost|127\.0\.0\.1)($|:)", "type": "event"},
        ]
        self.team.save()

        action = Action.objects.create(team=self.team, name="Test Action")
        item = InsightsFunction.objects.create(
            name="Test",
            type=InsightsFunctionType.DESTINATION,
            team=self.team,
            filters={
                "events": [{"id": "$pageview", "name": "$pageview", "type": "events", "order": 0}],
                "actions": [{"id": str(action.pk), "name": "Test Action", "type": "actions", "order": 1}],
                "filter_test_accounts": True,
            },
        )

        # Some json serialization is needed to compare the bytecode more easily in tests
        json_filters = to_dict(item.filters)
        assert json_filters == {
            "events": [{"id": "$pageview", "name": "$pageview", "type": "events", "order": 0}],
            "actions": [{"id": str(action.pk), "name": "Test Action", "type": "actions", "order": 1}],
            "filter_test_accounts": True,
            "bytecode": [
                "_H",
                1,
                32,
                "$host",
                32,
                "properties",
                1,
                2,
                2,
                "toString",
                1,
                32,
                "^(localhost|127\\.0\\.0\\.1)($|:)",
                2,
                "match",
                2,
                5,
                47,
                3,
                35,
                33,
                1,
                32,
                "$pageview",
                32,
                "event",
                1,
                1,
                11,
                29,
                4,
                2,
                3,
                2,
            ],
        }

    def test_insights_function_team_filters_only_compilation(self):
        self.team.test_account_filters = [
            {"key": "$host", "operator": "not_regex", "value": r"^(localhost|127\.0\.0\.1)($|:)", "type": "event"},
        ]
        self.team.save()

        item = InsightsFunction.objects.create(
            name="Test",
            type="destination",
            team=self.team,
            filters={
                "filter_test_accounts": True,
            },
        )

        # Some json serialization is needed to compare the bytecode more easily in tests
        json_filters = to_dict(item.filters)

        assert (
            json.dumps(json_filters["bytecode"])
            == f'["_H", {INSIGHTSQL_BYTECODE_VERSION}, 32, "$host", 32, "properties", 1, 2, 2, "toString", 1, 32, "^(localhost|127\\\\.0\\\\.0\\\\.1)($|:)", 2, "match", 2, 5, 47, 3, 35, 33, 1]'
        )


class TestInsightsFunctionsBackgroundReloading(TestCase, QueryMatchingTest):
    def setUp(self):
        super().setUp()
        org, team, user = User.objects.bootstrap("Test org", "ben@hanzo.ai", None)
        self.team = team
        self.user = user
        self.org = org

        self.action = Action.objects.create(
            team=self.team,
            name="Test Action",
            steps_json=[
                {
                    "event": "test-event",
                    "properties": [
                        {
                            "key": "prop-1",
                            "operator": "exact",
                            "value": "old-value-1",
                            "type": "event",
                        }
                    ],
                }
            ],
        )

        self.action2 = Action.objects.create(
            team=self.team,
            name="Test Action",
            steps_json=[
                {
                    "event": None,
                    "properties": [
                        {
                            "key": "prop-2",
                            "operator": "exact",
                            "value": "old-value-2",
                            "type": "event",
                        }
                    ],
                }
            ],
        )

    def test_insights_functions_reload_on_action_saved(self):
        insights_function_1 = InsightsFunction.objects.create(
            name="func 1",
            type="destination",
            team=self.team,
            filters={
                "actions": [
                    {"id": str(self.action.id), "name": "Test Action", "type": "actions", "order": 1},
                    {"id": str(self.action2.id), "name": "Test Action 2", "type": "actions", "order": 2},
                ],
            },
        )
        insights_function_2 = InsightsFunction.objects.create(
            name="func 2",
            type="destination",
            team=self.team,
            filters={
                "actions": [
                    {"id": str(self.action.id), "name": "Test Action", "type": "actions", "order": 1},
                ],
            },
        )

        # Check that the bytecode is correct
        assert (
            json.dumps(get_bytecode(insights_function_1.filters))
            == f'["_H", {INSIGHTSQL_BYTECODE_VERSION}, 32, "test-event", 32, "event", 1, 1, 11, 32, "old-value-1", 32, "prop-1", 32, "properties", 1, 2, 11, 3, 2, 32, "old-value-2", 32, "prop-2", 32, "properties", 1, 2, 11, 4, 2]'
        )

        assert (
            json.dumps(get_bytecode(insights_function_2.filters))
            == f'["_H", {INSIGHTSQL_BYTECODE_VERSION}, 32, "test-event", 32, "event", 1, 1, 11, 32, "old-value-1", 32, "prop-1", 32, "properties", 1, 2, 11, 3, 2]'
        )

        # Modify the action and check that the bytecode is updated
        self.action.steps_json = [
            {
                "event": "test-event",
                "properties": [
                    {
                        "key": "prop-1",
                        "operator": "exact",
                        "value": "change-value",
                        "type": "event",
                    }
                ],
            }
        ]
        # 1 update action, 2 activity logging, 1 load action, 1 load script functions, 1 load script flows, 1 load all related actions, 1 bulk update script functions, 5 filesystem
        with self.assertNumQueries(12):
            self.action.save()
        insights_function_1.refresh_from_db()
        insights_function_2.refresh_from_db()

        assert (
            json.dumps(get_bytecode(insights_function_1.filters))
            == f'["_H", {INSIGHTSQL_BYTECODE_VERSION}, 32, "test-event", 32, "event", 1, 1, 11, 32, "change-value", 32, "prop-1", 32, "properties", 1, 2, 11, 3, 2, 32, "old-value-2", 32, "prop-2", 32, "properties", 1, 2, 11, 4, 2]'
        )

        assert (
            json.dumps(get_bytecode(insights_function_2.filters))
            == f'["_H", {INSIGHTSQL_BYTECODE_VERSION}, 32, "test-event", 32, "event", 1, 1, 11, 32, "change-value", 32, "prop-1", 32, "properties", 1, 2, 11, 3, 2]'
        )

    def test_insights_functions_reload_on_team_saved(self):
        self.team.test_account_filters = []
        self.team.surveys_opt_in = True
        self.team.save()
        insights_function_1 = InsightsFunction.objects.create(
            name="func 1",
            type="destination",
            team=self.team,
            filters={
                "filter_test_accounts": True,
            },
        )
        insights_function_2 = InsightsFunction.objects.create(
            name="func 2",
            type="destination",
            team=self.team,
            filters={
                "filter_test_accounts": True,
                "events": [{"id": "$pageview", "name": "$pageview", "type": "events", "order": 0}],
            },
        )
        insights_function_3 = InsightsFunction.objects.create(
            name="func 3",
            type="destination",
            team=self.team,
            filters={
                "filter_test_accounts": False,
            },
        )

        # Check that the bytecode is correct
        assert json.dumps(get_bytecode(insights_function_1.filters)) == f'["_H", {INSIGHTSQL_BYTECODE_VERSION}, 29]'
        assert (
            json.dumps(get_bytecode(insights_function_2.filters))
            == f'["_H", {INSIGHTSQL_BYTECODE_VERSION}, 32, "$pageview", 32, "event", 1, 1, 11]'
        )

        assert json.dumps(get_bytecode(insights_function_3.filters)) == f'["_H", {INSIGHTSQL_BYTECODE_VERSION}, 29]'

        # Modify the action and check that the bytecode is updated
        self.team.test_account_filters = [
            {"key": "$host", "operator": "regex", "value": "^(localhost|127\\.0\\.0\\.1)($|:)"},
            {"key": "$pageview", "operator": "regex", "value": "test"},
        ]
        # 1 read old secret tokens (pre_save), 1 update team, 1 load script flows, 1 load script functions, 1 update script functions
        # Note: RemoteConfig refresh queries are now deferred via async signals
        with self.assertNumQueries(5):
            self.team.save()
        insights_function_1.refresh_from_db()
        insights_function_2.refresh_from_db()
        insights_function_3.refresh_from_db()

        assert (
            json.dumps(get_bytecode(insights_function_1.filters))
            == f'["_H", {INSIGHTSQL_BYTECODE_VERSION}, 32, "$host", 32, "properties", 1, 2, 2, "toString", 1, 32, "^(localhost|127\\\\.0\\\\.0\\\\.1)($|:)", 2, "match", 2, 47, 3, 35, 33, 0, 32, "$pageview", 32, "properties", 1, 2, 2, "toString", 1, 32, "test", 2, "match", 2, 47, 3, 35, 33, 0, 3, 2]'
        )

        assert (
            json.dumps(get_bytecode(insights_function_2.filters))
            == f'["_H", {INSIGHTSQL_BYTECODE_VERSION}, 32, "$host", 32, "properties", 1, 2, 2, "toString", 1, 32, "^(localhost|127\\\\.0\\\\.0\\\\.1)($|:)", 2, "match", 2, 47, 3, 35, 33, 0, 32, "$pageview", 32, "properties", 1, 2, 2, "toString", 1, 32, "test", 2, "match", 2, 47, 3, 35, 33, 0, 32, "$pageview", 32, "event", 1, 1, 11, 3, 3]'
        )

        assert json.dumps(get_bytecode(insights_function_3.filters)) == f'["_H", {INSIGHTSQL_BYTECODE_VERSION}, 29]'

    def test_cohort_save_signal_triggers_insights_function_refresh(self):
        cohort = Cohort.objects.create(
            team=self.team,
            name="Internal users",
            filters={
                "properties": {
                    "type": "AND",
                    "values": [{"type": "person", "key": "email", "operator": "icontains", "value": "@hanzo.ai"}],
                }
            },
        )
        self.team.test_account_filters = [{"type": "cohort", "key": "id", "value": cohort.id}]
        self.team.save()

        with patch("products.cdp.backend.tasks.insights_functions.refresh_affected_insights_functions.delay") as mock_delay:
            cohort.name = "Updated name"
            cohort.save()
            mock_delay.assert_any_call(cohort_id=cohort.id)

    def test_cohort_save_signal_skips_when_no_cohort_in_test_filters(self):
        cohort = Cohort.objects.create(
            team=self.team,
            name="Internal users",
            filters={
                "properties": {
                    "type": "AND",
                    "values": [{"type": "person", "key": "email", "operator": "icontains", "value": "@hanzo.ai"}],
                }
            },
        )
        # Team uses person property filters, not a cohort
        self.team.test_account_filters = [
            {"type": "person", "key": "email", "operator": "not_icontains", "value": "@hanzo.ai"}
        ]
        self.team.save()

        with patch("products.cdp.backend.tasks.insights_functions.refresh_affected_insights_functions.delay") as mock_delay:
            cohort.name = "Updated name"
            cohort.save()
            mock_delay.assert_not_called()

    def test_cohort_save_signal_skips_when_different_cohort_in_test_filters(self):
        cohort = Cohort.objects.create(
            team=self.team,
            name="Internal users",
            filters={
                "properties": {
                    "type": "AND",
                    "values": [{"type": "person", "key": "email", "operator": "icontains", "value": "@hanzo.ai"}],
                }
            },
        )
        # Team references a different cohort ID
        self.team.test_account_filters = [{"type": "cohort", "key": "id", "value": cohort.id + 9999}]
        self.team.save()

        with patch("products.cdp.backend.tasks.insights_functions.refresh_affected_insights_functions.delay") as mock_delay:
            cohort.name = "Updated name"
            cohort.save()
            mock_delay.assert_not_called()

    def test_cohort_refresh_finds_affected_teams_and_recompiles(self):
        cohort = Cohort.objects.create(
            team=self.team,
            name="Internal users",
            filters={
                "properties": {
                    "type": "AND",
                    "values": [{"type": "person", "key": "email", "operator": "icontains", "value": "@hanzo.ai"}],
                }
            },
        )
        self.team.test_account_filters = [{"type": "cohort", "key": "id", "value": cohort.id}]
        self.team.save()

        insights_function = InsightsFunction.objects.create(
            name="func with test filter",
            type="destination",
            team=self.team,
            filters={"filter_test_accounts": True},
        )

        assert insights_function.filters is not None
        original_bytecode = json.dumps(insights_function.filters["bytecode"])
        assert insights_function.filters.get("bytecode_error") is None
        assert "%@hanzo.ai%" in original_bytecode

        # Update the cohort — the task should recompile with the new filter value
        cohort.filters = {
            "properties": {
                "type": "AND",
                "values": [{"type": "person", "key": "email", "operator": "icontains", "value": "@newdomain.com"}],
            }
        }
        cohort.save()
        result = refresh_affected_insights_functions(cohort_id=cohort.id)

        insights_function.refresh_from_db()
        assert result == 1
        assert insights_function.filters is not None
        new_bytecode = json.dumps(insights_function.filters["bytecode"])
        assert "%@newdomain.com%" in new_bytecode
        assert "%@hanzo.ai%" not in new_bytecode

    def test_cohort_refresh_skips_unrelated_teams(self):
        cohort = Cohort.objects.create(
            team=self.team,
            name="Unrelated cohort",
            filters={
                "properties": {
                    "type": "AND",
                    "values": [{"type": "person", "key": "email", "operator": "icontains", "value": "@hanzo.ai"}],
                }
            },
        )
        # Team does NOT reference this cohort in test_account_filters
        self.team.test_account_filters = [
            {"type": "person", "key": "email", "operator": "not_icontains", "value": "@hanzo.ai"}
        ]
        self.team.save()

        insights_function = InsightsFunction.objects.create(
            name="func with test filter",
            type="destination",
            team=self.team,
            filters={"filter_test_accounts": True},
        )
        assert insights_function.filters is not None
        original_bytecode = json.dumps(insights_function.filters["bytecode"])

        result = refresh_affected_insights_functions(cohort_id=cohort.id)
        assert result == 0

        insights_function.refresh_from_db()
        assert insights_function.filters is not None
        assert json.dumps(insights_function.filters["bytecode"]) == original_bytecode

    def test_cohort_refresh_handles_deleted_cohort(self):
        cohort = Cohort.objects.create(
            team=self.team,
            name="Internal users",
            filters={
                "properties": {
                    "type": "AND",
                    "values": [{"type": "person", "key": "email", "operator": "icontains", "value": "@hanzo.ai"}],
                }
            },
        )
        cohort_id = cohort.id
        cohort.delete()

        # Should not raise — just returns 0
        result = refresh_affected_insights_functions(cohort_id=cohort_id)
        assert result == 0

    @patch("insights.plugins.plugin_server_api.get_insights_function_templates")
    def test_geoip_transformation_created_when_enabled(self, mock_get_templates):
        # Mock the response from plugin server
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {
                "id": "template-geoip",
                "name": "GeoIP",
                "description": "Adds geoip data to the event",
                "type": "transformation",
                "code": "return event",
                "inputs_schema": [],
                "status": "stable",
                "free": True,
                "category": ["Custom"],
                "code_language": "script",
                "icon_url": "/static/transformations/geoip.png",
            }
        ]
        mock_get_templates.return_value = mock_response

        with self.settings(DISABLE_MMDB=False):
            team = Team.objects.create_with_data(organization=self.org, name="Test Team", initiating_user=self.user)

        transformations = InsightsFunction.objects.filter(team=team, type="transformation")
        assert transformations.count() == 1
        geoip = transformations.first()
        assert geoip
        assert geoip.name == "GeoIP"
        assert geoip.description == "Adds geoip data to the event"
        assert geoip.icon_url == "/static/transformations/geoip.png"
        assert geoip.enabled
        assert geoip.execution_order == 1
        assert geoip.template_id == "template-geoip"

    def test_geoip_transformation_not_created_when_disabled(self):
        with self.settings(DISABLE_MMDB=True):
            team = Team.objects.create_with_data(organization=self.org, name="Test Team", initiating_user=self.user)
        transformations = InsightsFunction.objects.filter(team=team, type="transformation")
        assert transformations.count() == 0

    @patch("insights.plugins.plugin_server_api.get_insights_function_templates")
    def test_geoip_transformation_not_created_when_sync_fails(self, mock_get_templates):
        mock_get_templates.side_effect = Exception("Network error")

        with self.settings(DISABLE_MMDB=False):
            team = Team.objects.create_with_data(
                organization=self.org, name="Test Team Sync Fail", initiating_user=self.user
            )

        transformations = InsightsFunction.objects.filter(team=team, type="transformation")
        assert transformations.count() == 0

    @patch("insights.plugins.plugin_server_api.get_insights_function_templates")
    def test_geoip_transformation_not_created_when_template_not_found(self, mock_get_templates):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = []
        mock_get_templates.return_value = mock_response

        with self.settings(DISABLE_MMDB=False):
            team = Team.objects.create_with_data(
                organization=self.org, name="Test Team No Template", initiating_user=self.user
            )

        transformations = InsightsFunction.objects.filter(team=team, type="transformation")
        assert transformations.count() == 0

    @patch("insights.plugins.plugin_server_api.get_insights_function_templates")
    def test_geoip_transformation_not_created_when_hog_code_invalid(self, mock_get_templates):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {
                "id": "template-geoip",
                "name": "GeoIP",
                "description": "Adds geoip data to the event",
                "type": "transformation",
                "code": "invalid {{ script code that will fail",
                "inputs_schema": [],
                "status": "stable",
                "free": True,
                "category": ["Custom"],
                "code_language": "script",
                "icon_url": "/static/transformations/geoip.png",
            }
        ]
        mock_get_templates.return_value = mock_response

        with self.settings(DISABLE_MMDB=False):
            team = Team.objects.create_with_data(
                organization=self.org, name="Test Team Invalid Code", initiating_user=self.user
            )

        transformations = InsightsFunction.objects.filter(team=team, type="transformation")
        assert transformations.count() == 0

    def test_insights_function_file_system(self):
        insights_function_3 = InsightsFunction.objects.create(
            name="func 3",
            type="destination",
            team=self.team,
            filters={
                "filter_test_accounts": False,
            },
        )
        file = FileSystem.objects.filter(
            team=self.team, type="insights_function/destination", ref=str(insights_function_3.id)
        ).first()
        assert file is not None
        assert file.path == "Unfiled/Destinations/func 3"

        insights_function_3.deleted = True
        insights_function_3.save()

        file = FileSystem.objects.filter(
            team=self.team, type="insights_function/destination", ref=str(insights_function_3.id)
        ).first()
        assert file is None
