"""Let the channel definition dictionary read its own table.

Two defects kept `channel_definition_dict` from serving, both introduced when
the warehouse was renamed to our own vocabulary:

The source type was renamed with it. That word is a keyword of the warehouse's
DDL grammar, resolved against a fixed registry, so the server rejected the
statement outright — `unknown dictionary source type: datastore` — and the
dictionary could not be created at all on a fresh warehouse.

The source also named a password but no user, so it authenticated as the
built-in `default` account. This deployment removes that account in favour of a
named one, so where the dictionary did already exist it loaded as FAILED:

    Code: 516. Authentication failed: password is incorrect, or there is no
    user with such name. (AUTHENTICATION_FAILED)

`lookupDomainType` and the four `lookupPaid*`/`lookupOrganic*` functions print
to `dictGetOrNull` against that dictionary, so every read of channel type
raised: the Web Analytics channels breakdown answered 500 while every sibling
breakdown, which touches no dictionary, answered 200.

The source clause is now built by the one helper that writes source clauses, so
the source type and the credentials cannot go missing from it again.

This recreates the dictionary rather than creating it only when absent. The
definition is precisely what changed, and a dictionary that already exists with
the old source is the case that needs repairing — `IF NOT EXISTS` returns
success without reading the body, so it would report a fix it did not make.
Only the dictionary's definition changes; `channel_definition` and its 1,519
rows are read by it, not owned by it.
"""

from insights.datastore.client.connection import NodeRole
from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.models.channel_type.sql import CHANNEL_DEFINITION_DICTIONARY_SQL

operations = [
    run_sql_with_exceptions(
        CHANNEL_DEFINITION_DICTIONARY_SQL(on_cluster=False),
        node_roles=[NodeRole.DATA, NodeRole.COORDINATOR],
    ),
]
