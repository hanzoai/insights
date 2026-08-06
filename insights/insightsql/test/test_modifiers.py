from typing import NamedTuple

from insights.test.base import BaseTest
from unittest.mock import patch

from django.conf import settings
from django.test import override_settings

from insights.schema import InsightsQLQueryModifiers, MaterializationMode, PersonsArgMaxVersion, PersonsOnEventsMode

from insights.insightsql.modifiers import create_default_modifiers_for_team
from insights.insightsql.query import execute_insightsql_query

from products.cohorts.backend.models.cohort import Cohort


class TestModifiers(BaseTest):
    def _expected_browser_select(self, materialization_mode: MaterializationMode) -> str:
        if settings.DATASTORE_INSIGHTSQL_USE_NEW_EVENTS_SCHEMA:
            column = "events.properties.`$browser`"
            source = "events_json AS events"
            return f"SELECT {column} AS `$browser` FROM {source}"
        elif materialization_mode == MaterializationMode.DISABLED:
            return (
                "SELECT replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.properties, %(insightsql_val_0)s), ''), "
                "'null'), '^\"|\"$', '') AS `$browser` FROM events"
            )
        else:
            column = "events.`mat_$browser`"
            source = "events"

        if materialization_mode == MaterializationMode.LEGACY_NULL_AS_STRING:
            expression = f"nullIf({column}, '')"
        else:
            expression = f"nullIf(nullIf({column}, ''), 'null')"

        return f"SELECT {expression} AS `$browser` FROM {source}"

    def _expected_events_person_properties_column(self) -> str:
        if settings.DATASTORE_INSIGHTSQL_USE_NEW_EVENTS_SCHEMA:
            # Whole-blob person_properties reads are reconstructed from the JSON column; assert the
            # reconstruction reads the on-events column rather than pinning the full expression.
            return "JSONExtractKeysAndValuesRaw(toJSONString(events.person_properties))"
        return "events.person_properties AS properties"

    @override_settings(PERSON_ON_EVENTS_OVERRIDE=False, PERSON_ON_EVENTS_V2_OVERRIDE=False)
    def test_create_default_modifiers_for_team_init(self):
        assert self.team.person_on_events_mode == PersonsOnEventsMode.PERSON_ID_OVERRIDE_PROPERTIES_JOINED
        modifiers = create_default_modifiers_for_team(self.team)
        # The default is not None! It's explicitly `PERSON_ID_OVERRIDE_PROPERTIES_JOINED`
        assert modifiers.personsOnEventsMode == PersonsOnEventsMode.PERSON_ID_OVERRIDE_PROPERTIES_JOINED
        modifiers = create_default_modifiers_for_team(
            self.team,
            InsightsQLQueryModifiers(personsOnEventsMode=PersonsOnEventsMode.PERSON_ID_NO_OVERRIDE_PROPERTIES_ON_EVENTS),
        )
        assert modifiers.personsOnEventsMode == PersonsOnEventsMode.PERSON_ID_NO_OVERRIDE_PROPERTIES_ON_EVENTS
        modifiers = create_default_modifiers_for_team(
            self.team,
            InsightsQLQueryModifiers(personsOnEventsMode=PersonsOnEventsMode.PERSON_ID_OVERRIDE_PROPERTIES_ON_EVENTS),
        )
        assert modifiers.personsOnEventsMode == PersonsOnEventsMode.PERSON_ID_OVERRIDE_PROPERTIES_ON_EVENTS

    def test_team_modifiers_override(self):
        assert self.team.modifiers is None
        modifiers = create_default_modifiers_for_team(self.team)
        assert modifiers.personsOnEventsMode == self.team.default_modifiers["personsOnEventsMode"]
        assert (
            modifiers.personsOnEventsMode
            == PersonsOnEventsMode.PERSON_ID_OVERRIDE_PROPERTIES_JOINED  # the default mode
        )

        self.team.modifiers = {"personsOnEventsMode": PersonsOnEventsMode.PERSON_ID_OVERRIDE_PROPERTIES_ON_EVENTS}
        self.team.save()
        modifiers = create_default_modifiers_for_team(self.team)
        assert modifiers.personsOnEventsMode == PersonsOnEventsMode.PERSON_ID_OVERRIDE_PROPERTIES_ON_EVENTS
        assert (
            self.team.default_modifiers["personsOnEventsMode"]
            == PersonsOnEventsMode.PERSON_ID_OVERRIDE_PROPERTIES_JOINED  # no change here
        )

        self.team.modifiers = {"personsOnEventsMode": PersonsOnEventsMode.PERSON_ID_NO_OVERRIDE_PROPERTIES_ON_EVENTS}
        self.team.save()
        modifiers = create_default_modifiers_for_team(self.team)
        assert modifiers.personsOnEventsMode == PersonsOnEventsMode.PERSON_ID_NO_OVERRIDE_PROPERTIES_ON_EVENTS

    @patch(
        # _person_on_events_person_id_override_properties_on_events is normally determined by feature flag
        "insights.models.team.Team._person_on_events_person_id_override_properties_on_events",
        True,
    )
    def test_modifiers_persons_on_events_default_is_based_on_team_property(self):
        assert self.team.modifiers is None
        modifiers = create_default_modifiers_for_team(self.team)
        assert self.team.person_on_events_mode == PersonsOnEventsMode.PERSON_ID_OVERRIDE_PROPERTIES_ON_EVENTS
        assert modifiers.personsOnEventsMode == self.team.default_modifiers["personsOnEventsMode"]
        assert modifiers.personsOnEventsMode == PersonsOnEventsMode.PERSON_ID_OVERRIDE_PROPERTIES_ON_EVENTS

    def test_modifiers_persons_on_events_mode_person_id_override_properties_on_events(self):
        query = "SELECT event, person_id FROM events"

        # Control
        response = execute_insightsql_query(
            query,
            team=self.team,
            modifiers=InsightsQLQueryModifiers(personsOnEventsMode=PersonsOnEventsMode.DISABLED),
        )
        assert response.datastore is not None
        assert " JOIN " in response.datastore

        # Test
        response = execute_insightsql_query(
            query,
            team=self.team,
            modifiers=InsightsQLQueryModifiers(
                personsOnEventsMode=PersonsOnEventsMode.PERSON_ID_NO_OVERRIDE_PROPERTIES_ON_EVENTS
            ),
        )
        assert response.datastore is not None
        assert " JOIN " not in response.datastore

    def test_modifiers_persons_on_events_mode_mapping(self):
        query = "SELECT event, person.id, person.properties, person.created_at FROM events"

        class TestCase(NamedTuple):
            mode: PersonsOnEventsMode
            expected_columns: list[str]
            other_expected_values: list[str] = []

        test_cases: list[TestCase] = [
            TestCase(
                PersonsOnEventsMode.DISABLED,
                [
                    "events.event AS event",
                    "events__pdi__person.id AS id",
                    "events__pdi__person.properties AS properties",
                    "events__pdi__person.created_at AS created_at",
                ],
            ),
            TestCase(
                PersonsOnEventsMode.PERSON_ID_NO_OVERRIDE_PROPERTIES_ON_EVENTS,
                [
                    "events.event AS event",
                    "events.person_id AS id",
                    self._expected_events_person_properties_column(),
                    "toTimeZone(events.person_created_at, %(insightsql_val_0)s) AS created_at",
                ],
            ),
            TestCase(
                PersonsOnEventsMode.PERSON_ID_OVERRIDE_PROPERTIES_ON_EVENTS,
                [
                    "events.event AS event",
                    "if(not(empty(events__override.distinct_id)), events__override.person_id, events.person_id) AS id",
                    self._expected_events_person_properties_column(),
                    "toTimeZone(events.person_created_at, %(insightsql_val_0)s) AS created_at",
                ],
                [
                    "events__override ON equals(events.distinct_id, events__override.distinct_id)",
                ],
            ),
            TestCase(
                PersonsOnEventsMode.PERSON_ID_OVERRIDE_PROPERTIES_JOINED,
                [
                    "events.event AS event",
                    "events__person.id AS id",
                    "events__person.properties AS properties",
                    "events__person.created_at AS created_at",
                ],
                [
                    "events__person ON equals(if(not(empty(events__override.distinct_id)), events__override.person_id, events.person_id), events__person.id)",
                    "events__override ON equals(events.distinct_id, events__override.distinct_id)",
                ],
            ),
        ]

        for test_case in test_cases:
            datastore_query = execute_insightsql_query(
                query,
                team=self.team,
                modifiers=InsightsQLQueryModifiers(personsOnEventsMode=test_case.mode),
                pretty=False,
            ).datastore
            assert datastore_query is not None
            # Columns are asserted individually: under the native-JSON schema the person_properties
            # column prints as the whole-blob reconstruction, too large to pin as one SELECT string.
            for expected_column in test_case.expected_columns:
                assert expected_column in datastore_query, f"PoE mode: {test_case.mode}: {expected_column}"
            for value in test_case.other_expected_values:
                assert value in datastore_query

    def test_modifiers_persons_argmax_version_v2(self):
        query = "SELECT * FROM persons"

        # Control (v1)
        response = execute_insightsql_query(
            query,
            team=self.team,
            modifiers=InsightsQLQueryModifiers(personsArgMaxVersion=PersonsArgMaxVersion.V1),
        )
        assert response.datastore is not None
        assert "in(tuple(person.id, person.version)" not in response.datastore

        # Test (v2)
        response = execute_insightsql_query(
            query,
            team=self.team,
            modifiers=InsightsQLQueryModifiers(personsArgMaxVersion=PersonsArgMaxVersion.V2),
        )
        assert response.datastore is not None
        assert "in(tuple(person.id, person.version)" in response.datastore

    def test_modifiers_persons_argmax_version_auto(self):
        # Use the v2 query when selecting properties.x
        response = execute_insightsql_query(
            "SELECT id, properties.$browser, is_identified FROM persons",
            team=self.team,
            modifiers=InsightsQLQueryModifiers(personsArgMaxVersion=PersonsArgMaxVersion.AUTO),
        )
        assert response.datastore is not None
        assert "in(tuple(person.id, person.version)" in response.datastore

        # Use the v2 query when selecting properties
        response = execute_insightsql_query(
            "SELECT id, properties FROM persons",
            team=self.team,
            modifiers=InsightsQLQueryModifiers(personsArgMaxVersion=PersonsArgMaxVersion.AUTO),
        )
        assert response.datastore is not None
        assert "in(tuple(person.id, person.version)" in response.datastore

        # Use the v1 query when not selecting any properties
        response = execute_insightsql_query(
            "SELECT id, is_identified FROM persons",
            team=self.team,
            modifiers=InsightsQLQueryModifiers(personsArgMaxVersion=PersonsArgMaxVersion.AUTO),
        )
        assert response.datastore is not None
        assert "in(tuple(person.id, person.version)" not in response.datastore

    def test_modifiers_in_cohort_join(self):
        cohort = Cohort.objects.create(team=self.team, name="test")
        response = execute_insightsql_query(
            f"select * from persons where id in cohort {cohort.pk}",
            team=self.team,
            modifiers=InsightsQLQueryModifiers(inCohortVia="subquery"),
        )
        assert response.datastore is not None
        assert "LEFT JOIN" not in response.datastore

        # Use the v1 query when not selecting any properties
        response = execute_insightsql_query(
            f"select * from persons where id in cohort {cohort.pk}",
            team=self.team,
            modifiers=InsightsQLQueryModifiers(inCohortVia="leftjoin"),
        )
        assert response.datastore is not None
        assert "LEFT JOIN" in response.datastore

    def test_modifiers_materialization_mode(self):
        try:
            from ee.datastore.materialized_columns.analyze import materialize
        except ModuleNotFoundError:
            self.skipTest("EE materialized-column helpers are not available")
        materialize("events", "$browser")

        response = execute_insightsql_query(
            "SELECT properties.$browser FROM events",
            team=self.team,
            modifiers=InsightsQLQueryModifiers(materializationMode=MaterializationMode.AUTO),
            pretty=False,
        )
        assert response.datastore is not None
        assert self._expected_browser_select(MaterializationMode.AUTO) in response.datastore

        response = execute_insightsql_query(
            "SELECT properties.$browser FROM events",
            team=self.team,
            modifiers=InsightsQLQueryModifiers(materializationMode=MaterializationMode.LEGACY_NULL_AS_NULL),
            pretty=False,
        )
        assert response.datastore is not None
        assert self._expected_browser_select(MaterializationMode.LEGACY_NULL_AS_NULL) in response.datastore

        response = execute_insightsql_query(
            "SELECT properties.$browser FROM events",
            team=self.team,
            modifiers=InsightsQLQueryModifiers(materializationMode=MaterializationMode.LEGACY_NULL_AS_STRING),
            pretty=False,
        )
        assert response.datastore is not None
        assert self._expected_browser_select(MaterializationMode.LEGACY_NULL_AS_STRING) in response.datastore

        response = execute_insightsql_query(
            "SELECT properties.$browser FROM events",
            team=self.team,
            modifiers=InsightsQLQueryModifiers(materializationMode=MaterializationMode.DISABLED),
            pretty=False,
        )
        assert response.datastore is not None
        assert self._expected_browser_select(MaterializationMode.DISABLED) in response.datastore

    def test_optimize_joined_filters(self):
        # no optimizations
        response = execute_insightsql_query(
            f"select event from events where person.properties.$browser ilike '%Chrome%'",
            team=self.team,
            modifiers=InsightsQLQueryModifiers(optimizeJoinedFilters=False),
        )
        # "ilike" shows up once in the response
        assert response is not None
        assert response.datastore is not None
        assert response.datastore.count("ilike") == 1

        # with optimizations
        response = execute_insightsql_query(
            f"select event from events where person.properties.$browser ilike '%Chrome%'",
            team=self.team,
            modifiers=InsightsQLQueryModifiers(optimizeJoinedFilters=True),
        )
        # "ilike" shows up twice in the response
        assert response is not None
        assert response.datastore is not None
        assert response.datastore.count("ilike") == 2

    def test_no_convert_timezone(self):
        # default to convert to timezone
        response = execute_insightsql_query(
            f"select timestamp from events limit 1",
            team=self.team,
            modifiers=InsightsQLQueryModifiers(),
        )
        assert response is not None
        assert response.datastore is not None
        assert response.datastore.count("toTimeZone") == 1

        response = execute_insightsql_query(
            f"select timestamp from events limit 1",
            team=self.team,
            modifiers=InsightsQLQueryModifiers(convertToProjectTimezone=False),
        )
        assert response is not None
        assert response.datastore is not None
        assert response.datastore.count("toTimeZone") == 0
