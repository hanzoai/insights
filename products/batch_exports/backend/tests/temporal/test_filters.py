"""Tests for composing InsightsQL property filters into Datastore clauses."""

import typing

import pytest

from products.batch_exports.backend.temporal.filters import InvalidFilterError, compose_filters_clause

pytestmark = [pytest.mark.asyncio, pytest.mark.django_db]


@pytest.mark.parametrize(
    "filters,expected_clause,expected_values",
    [
        # Events
        (
            [
                {"key": "$browser", "operator": "exact", "type": "event", "value": ["Firefox"]},
            ],
            """ifNull(equals(replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.properties, %(insightsql_val_0)s), ''), 'null'), '^"|"$', ''), %(insightsql_val_1)s), 0)""",
            {"insightsql_val_0": "$browser", "insightsql_val_1": "Firefox"},
        ),
        (
            [
                {"key": "$current_url", "operator": "icontains", "type": "event", "value": "https://hanzo.ai"},
            ],
            """ifNull(ilike(toString(replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.properties, %(insightsql_val_0)s), ''), 'null'), '^"|"$', '')), %(insightsql_val_1)s), 0)""",
            {"insightsql_val_0": "$current_url", "insightsql_val_1": "%https://hanzo.ai%"},
        ),
        (
            [
                {"key": "$browser", "operator": "exact", "type": "event", "value": ["Firefox"]},
                {"key": "test", "operator": "exact", "type": "event", "value": ["Test"]},
            ],
            """and(ifNull(equals(replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.properties, %(insightsql_val_0)s), ''), 'null'), '^"|"$', ''), %(insightsql_val_1)s), 0), ifNull(equals(replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.properties, %(insightsql_val_2)s), ''), 'null'), '^"|"$', ''), %(insightsql_val_3)s), 0))""",
            {"insightsql_val_0": "$browser", "insightsql_val_1": "Firefox", "insightsql_val_2": "test", "insightsql_val_3": "Test"},
        ),
        # Feature (subset of event)
        (
            [
                {"key": "$feature/some-feature", "type": "event", "operator": "exact", "value": ["true"]},
            ],
            """ifNull(equals(replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.properties, %(insightsql_val_0)s), \'\'), \'null\'), \'^"|"$\', \'\'), %(insightsql_val_1)s), 0)""",
            {"insightsql_val_0": "$feature/some-feature", "insightsql_val_1": "true"},
        ),
        # Person
        (
            [
                {"key": "$initial_current_url", "type": "person", "operator": "exact", "value": ["http://localhost"]},
            ],
            """ifNull(equals(replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.person_properties, %(insightsql_val_0)s), ''), 'null'), '^"|"$', ''), %(insightsql_val_1)s), 0)""",
            {"insightsql_val_0": "$initial_current_url", "insightsql_val_1": "http://localhost"},
        ),
        (
            [
                {"key": "$initial_current_url", "type": "person", "operator": "is_set", "value": None},
            ],
            """isNotNull(replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.person_properties, %(insightsql_val_0)s), \'\'), \'null\'), \'^"|"$\', \'\'))""",
            {"insightsql_val_0": "$initial_current_url"},
        ),
        (
            [
                {"key": "$initial_current_url", "type": "person", "operator": "regex", "value": ["^http://.*$"]},
            ],
            """ifNull(match(toString(replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.person_properties, %(insightsql_val_0)s), \'\'), \'null\'), \'^"|"$\', \'\')), %(insightsql_val_1)s), 0)""",
            {"insightsql_val_0": "$initial_current_url", "insightsql_val_1": "^http://.*$"},
        ),
        (
            [
                {"key": "$created_at", "type": "person", "operator": "between", "value": [0, 1]},
            ],
            """and(ifNull(greaterOrEquals(replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.person_properties, %(insightsql_val_0)s), \'\'), \'null\'), \'^"|"$\', \'\'), 0.0), 0), ifNull(lessOrEquals(replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.person_properties, %(insightsql_val_1)s), \'\'), \'null\'), \'^"|"$\', \'\'), 1.0), 0))""",
            {"insightsql_val_0": "$created_at", "insightsql_val_1": "$created_at"},
        ),
        # InsightsQL
        (
            [
                {"key": "toInt(properties.$browser_version) * 10 = 1", "type": "insightsql", "value": None},
            ],
            """ifNull(equals(multiply(accurateCastOrNull(replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.properties, %(insightsql_val_0)s), \'\'), \'null\'), \'^"|"$\', \'\'), %(insightsql_val_1)s), 10), 1), 0)""",
            {"insightsql_val_0": "$browser_version", "insightsql_val_1": "Int64"},
        ),
    ],
    ids=[
        "events0",
        "events1",
        "events2",
        "feature0",
        "person0",
        "person1",
        "person2",
        "person3",
        "insightsql0",
    ],
)
def test_compose_filters_clause(
    filters: list[dict[str, typing.Any]],
    expected_clause: str,
    expected_values: dict[str, str],
    ateam,
):
    result_clause, result_values = compose_filters_clause(filters, team_id=ateam.id)
    assert result_clause == expected_clause
    assert result_values == expected_values


def test_compose_filters_clause_uses_legacy_events_schema(settings, ateam):
    settings.DATASTORE_INSIGHTSQL_USE_NEW_EVENTS_SCHEMA = True

    result_clause, result_values = compose_filters_clause(
        [{"key": "$browser", "type": "event", "operator": "exact", "value": ["Chrome"]}],
        team_id=ateam.id,
    )

    assert (
        result_clause
        == """ifNull(equals(replaceRegexpAll(nullIf(nullIf(JSONExtractRaw(events.properties, %(insightsql_val_0)s), ''), 'null'), '^"|"$', ''), %(insightsql_val_1)s), 0)"""
    )
    assert result_values == {"insightsql_val_0": "$browser", "insightsql_val_1": "Chrome"}


@pytest.mark.parametrize(
    "filters",
    (
        [
            {"key": "event in (select * from events)", "type": "insightsql", "value": None},
        ],
        [
            {"key": "event =", "type": "insightsql", "value": None},
        ],
    ),
    ids=[
        "insightsql0",
        "insightsql1",
    ],
)
def test_compose_filters_clause_raises(
    filters: list[dict[str, typing.Any]],
    ateam,
):
    with pytest.raises(InvalidFilterError):
        result_clause, result_values = compose_filters_clause(filters, team_id=ateam.id)
