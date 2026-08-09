"""Functional tests for CreateTableIfNotExists / AddColumnIfNotExists.

Each test works on a one-off table in the standard test database so both
branches — build it, or find it already there — run against live Postgres.
"""

import uuid

import pytest

from django.db import connection, models
from django.db.migrations.state import ModelState, ProjectState

from insights.migration_helpers import AddColumnIfNotExists, CreateTableIfNotExists

MODEL_NAME = "TmpAbsentModel"

BASE_FIELDS = [
    ("id", models.AutoField(primary_key=True)),
    ("name", models.CharField(max_length=50)),
]
WIDER_FIELDS = [*BASE_FIELDS, ("note", models.TextField(null=True))]


def _state(table, fields):
    state = ProjectState()
    state.add_model(ModelState(app_label="insights", name=MODEL_NAME, fields=fields, options={"db_table": table}))
    return state


@pytest.fixture
def table_name():
    table = f"test_absent_{uuid.uuid4().hex[:8]}"
    try:
        yield table
    finally:
        with connection.cursor() as cursor:
            cursor.execute(f'DROP TABLE IF EXISTS "{table}"')


def _apply_forwards(op, state):
    schema_editor = connection.schema_editor(atomic=False)
    schema_editor.__enter__()
    try:
        op.database_forwards("insights", schema_editor, from_state=state, to_state=state)
    finally:
        schema_editor.__exit__(None, None, None)


def _apply_backwards(op, state):
    schema_editor = connection.schema_editor(atomic=False)
    schema_editor.__enter__()
    try:
        op.database_backwards("insights", schema_editor, from_state=state, to_state=state)
    finally:
        schema_editor.__exit__(None, None, None)


def _exists(table):
    with connection.cursor() as cursor:
        return table in set(connection.introspection.table_names(cursor))


def _columns(table):
    with connection.cursor() as cursor:
        return {c.name for c in connection.introspection.get_table_description(cursor, table)}


@pytest.mark.django_db(transaction=True)
def test_create_table_builds_it_when_the_database_does_not_have_it(table_name):
    state = _state(table_name, BASE_FIELDS)
    assert not _exists(table_name)

    _apply_forwards(CreateTableIfNotExists(model_name=MODEL_NAME), state)

    assert _columns(table_name) == {"id", "name"}


@pytest.mark.django_db(transaction=True)
def test_create_table_is_a_noop_when_the_table_is_already_there(table_name):
    state = _state(table_name, BASE_FIELDS)
    _apply_forwards(CreateTableIfNotExists(model_name=MODEL_NAME), state)

    # What bin/migrate's retry does, and what a fresh database gets where the
    # original CreateModel already built the table.
    _apply_forwards(CreateTableIfNotExists(model_name=MODEL_NAME), state)

    assert _columns(table_name) == {"id", "name"}


def test_create_table_leaves_migration_state_alone():
    state = _state("irrelevant", BASE_FIELDS)
    before = set(state.models)

    CreateTableIfNotExists(model_name=MODEL_NAME).state_forwards("insights", state)

    assert set(state.models) == before


@pytest.mark.django_db(transaction=True)
def test_add_column_adds_it_when_the_table_predates_it(table_name):
    _apply_forwards(CreateTableIfNotExists(model_name=MODEL_NAME), _state(table_name, BASE_FIELDS))
    assert _columns(table_name) == {"id", "name"}

    wider = _state(table_name, WIDER_FIELDS)
    _apply_forwards(AddColumnIfNotExists(model_name=MODEL_NAME, name="note"), wider)

    assert _columns(table_name) == {"id", "name", "note"}


@pytest.mark.django_db(transaction=True)
def test_add_column_adopts_one_that_is_already_there(table_name):
    wider = _state(table_name, WIDER_FIELDS)
    _apply_forwards(CreateTableIfNotExists(model_name=MODEL_NAME), wider)

    # A column added by hand outside Django is the case this exists for.
    _apply_forwards(AddColumnIfNotExists(model_name=MODEL_NAME, name="note"), wider)

    assert _columns(table_name) == {"id", "name", "note"}


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize(
    "operation",
    [
        CreateTableIfNotExists(model_name=MODEL_NAME),
        AddColumnIfNotExists(model_name=MODEL_NAME, name="note"),
    ],
    ids=["create_table", "add_column"],
)
def test_reversing_refuses_rather_than_dropping(table_name, operation):
    state = _state(table_name, WIDER_FIELDS)
    _apply_forwards(CreateTableIfNotExists(model_name=MODEL_NAME), state)

    with pytest.raises(NotImplementedError):
        _apply_backwards(operation, state)

    assert _exists(table_name)
