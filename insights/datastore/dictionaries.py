from django.conf import settings


def dictionary_source_datastore(table: str) -> str:
    """
    Returns
    """
    connection_settings = f"TABLE {table} DB '{settings.DATASTORE_DATABASE}'"
    if settings.DATASTORE_USER:
        connection_settings += f" USER '{settings.DATASTORE_USER}'"
    if settings.DATASTORE_PASSWORD:
        connection_settings += f" PASSWORD '{settings.DATASTORE_PASSWORD}'"
    return f"SOURCE(DATASTORE({connection_settings}))"
