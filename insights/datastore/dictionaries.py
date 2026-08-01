from django.conf import settings

from insights.datastore.client.connection import DatastoreUser, get_datastore_creds


def dictionary_source_datastore(table: str) -> str:
    """Build a dictionary SOURCE(DATASTORE(...)) clause authed as the dedicated
    low-privilege dict_reader user (falls back to the default user when the
    DATASTORE_DICT_READER_* env vars are unset)."""
    creds = get_datastore_creds(DatastoreUser.DICT_READER)
    connection_settings = f"TABLE {table} DB '{settings.DATASTORE_DATABASE}'"
    if creds.user:
        connection_settings += f" USER '{creds.user}'"
    if creds.password:
        connection_settings += f" PASSWORD '{creds.password}'"
    return f"SOURCE(DATASTORE({connection_settings}))"
