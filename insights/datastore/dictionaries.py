from django.conf import settings

from insights.datastore.client.connection import DatastoreUser, get_datastore_creds


def dictionary_source_datastore(table: str) -> str:
    """Build a dictionary SOURCE(CLICKHOUSE(...)) clause authed as the dedicated
    low-privilege dict_reader user (falls back to the default user when the
    DATASTORE_DICT_READER_* env vars are unset).

    CLICKHOUSE is a word in the server's DDL grammar, resolved against a fixed
    registry of source types — not a product name in our surface — so it is the
    one word here that does not get renamed with the rest. Spelling it
    `DATASTORE` makes the server reject the statement outright:

        unknown dictionary source type: datastore

    and the dictionary simply never exists, which surfaces far away as a read
    failing on dictGet."""
    creds = get_datastore_creds(DatastoreUser.DICT_READER)
    connection_settings = f"TABLE {table} DB '{settings.DATASTORE_DATABASE}'"
    if creds.user:
        connection_settings += f" USER '{creds.user}'"
    if creds.password:
        connection_settings += f" PASSWORD '{creds.password}'"
    return f"SOURCE(CLICKHOUSE({connection_settings}))"
