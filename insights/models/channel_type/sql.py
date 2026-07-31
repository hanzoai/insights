import os
import json

from insights.datastore.client import sync_execute
from insights.datastore.cluster import ON_CLUSTER_CLAUSE
from insights.datastore.dictionaries import dictionary_source
from insights.datastore.table_engines import MergeTreeEngine, ReplicationScheme
from insights.settings import DATASTORE_CLUSTER

CHANNEL_DEFINITION_TABLE_NAME = "channel_definition"
CHANNEL_DEFINITION_DICTIONARY_NAME = "channel_definition_dict"

CHANNEL_DEFINITION_TABLE_SQL = (
    lambda on_cluster=True: """
CREATE TABLE IF NOT EXISTS {table_name} {on_cluster_clause} (
    domain String NOT NULL,
    kind String NOT NULL,
    domain_type String NULL,
    type_if_paid String NULL,
    type_if_organic String NULL
) ENGINE = {engine}
ORDER BY (domain, kind);
""".format(
        table_name=CHANNEL_DEFINITION_TABLE_NAME,
        engine=MergeTreeEngine("channel_definition", replication_scheme=ReplicationScheme.REPLICATED),
        on_cluster_clause=ON_CLUSTER_CLAUSE(on_cluster),
    )
)


DROP_CHANNEL_DEFINITION_TABLE_SQL = (
    f"DROP TABLE IF EXISTS {CHANNEL_DEFINITION_TABLE_NAME} ON CLUSTER '{DATASTORE_CLUSTER}'"
)


TRUNCATE_CHANNEL_DEFINITION_TABLE_SQL = (
    f"TRUNCATE TABLE IF EXISTS {CHANNEL_DEFINITION_TABLE_NAME} ON CLUSTER '{DATASTORE_CLUSTER}'"
)

with open(os.path.join(os.path.dirname(__file__), "channel_definitions.json")) as f:
    CHANNEL_DEFINITIONS = json.loads(f.read())


def format_value(value):
    if value is None:
        return "NULL"
    elif isinstance(value, str):
        return f"'{value}'"
    else:
        raise ValueError(f"Unknown value type {type(value)}")


CHANNEL_DEFINITION_DATA_SQL = (
    lambda channel_definitions=CHANNEL_DEFINITIONS: f"""
INSERT INTO channel_definition (domain, kind, domain_type, type_if_paid, type_if_organic) VALUES
{
        ''',
'''.join(f"({' ,'.join(map(format_value, x[:5]))})" for x in channel_definitions)
    },
;
"""
)

# Use COMPLEX_KEY_HASHED, as we have a composite key.
#
# OR REPLACE, not IF NOT EXISTS: the definition is the thing that changes. A
# dictionary that already exists with a stale source — one that authenticates
# as an account this deployment does not have, say — is exactly the case a
# re-run has to repair, and IF NOT EXISTS returns success without reading the
# body, so the repair silently does nothing. OR REPLACE is idempotent for the
# fresh case and corrective for the live one, which keeps this one statement
# the only way the dictionary is ever defined.
CHANNEL_DEFINITION_DICTIONARY_SQL = (
    lambda on_cluster=True: f"""
CREATE OR REPLACE DICTIONARY {CHANNEL_DEFINITION_DICTIONARY_NAME} {ON_CLUSTER_CLAUSE(on_cluster)} (
    domain String,
    kind String,
    domain_type Nullable(String),
    type_if_paid Nullable(String),
    type_if_organic Nullable(String)
)
PRIMARY KEY domain, kind
{dictionary_source(table=CHANNEL_DEFINITION_TABLE_NAME)}
LIFETIME(MIN 3000 MAX 3600)
LAYOUT(COMPLEX_KEY_HASHED())
"""
)

DROP_CHANNEL_DEFINITION_DICTIONARY_SQL = (
    f"DROP DICTIONARY IF EXISTS {CHANNEL_DEFINITION_DICTIONARY_NAME} ON CLUSTER '{DATASTORE_CLUSTER}'"
)

SELECT_CHANNEL_DEFINITION_SQL = f"SELECT domain, kind, domain_type, type_if_paid, type_if_organic FROM {CHANNEL_DEFINITION_TABLE_NAME} ORDER BY domain, kind"


# intended to by run in a migration with RunPython
def add_missing_channel_types(_):
    existing_rows = sync_execute(SELECT_CHANNEL_DEFINITION_SQL)
    existing_domain_plus_sources = {(x[0], x[1]) for x in existing_rows}
    new_channel_definitions = [x for x in CHANNEL_DEFINITIONS if (x[0], x[1]) not in existing_domain_plus_sources]
    if new_channel_definitions:
        sync_execute(CHANNEL_DEFINITION_DATA_SQL(channel_definitions=new_channel_definitions))
