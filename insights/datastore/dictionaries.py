from django.conf import settings

# The source type of a dictionary is a keyword of the warehouse's DDL grammar.
# It is the engine's word, not ours, so it is not ours to rename: the server
# resolves it against a fixed registry of source types and answers
#
#     Code: 137. unknown dictionary source type: datastore
#
# for anything else. Renaming it along with our own vocabulary left every
# dictionary uncreatable, and `channel_definition_dict` — the one the channel
# lookups read — unloadable, so the Web Analytics channels breakdown answered
# 500 while every sibling breakdown, which touches no dictionary, answered 200.
#
# It is spelled once, here. Our name for the warehouse is Datastore everywhere
# else, including in the helper below and in every caller.
DICTIONARY_SOURCE_TYPE = "CLICKHOUSE"


def dictionary_source(*, table: str | None = None, query: str | None = None) -> str:
    """A dictionary SOURCE clause reading this deployment's own warehouse.

    Exactly one of `table` or `query` names what to read.

    The credentials are always written. A source that names no user
    authenticates as the warehouse's built-in `default` account, which this
    deployment removes in favour of a named one, so an under-specified source
    loads as FAILED with AUTHENTICATION_FAILED rather than falling back.
    """
    if (table is None) == (query is None):
        raise ValueError("dictionary_source takes exactly one of `table` or `query`")

    if table is not None:
        settings_clause = f"TABLE '{table}' DB '{settings.DATASTORE_DATABASE}'"
    else:
        settings_clause = f"QUERY '{query}'"

    if settings.DATASTORE_USER:
        settings_clause += f" USER '{settings.DATASTORE_USER}'"
    if settings.DATASTORE_PASSWORD:
        settings_clause += f" PASSWORD '{settings.DATASTORE_PASSWORD}'"

    return f"SOURCE({DICTIONARY_SOURCE_TYPE}({settings_clause}))"
