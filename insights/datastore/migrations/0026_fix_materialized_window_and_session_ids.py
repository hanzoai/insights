from datastore_orm import migrations


def materialize_session_and_window_id(database):
    """Materialize $session_id/$window_id and normalize their column names.

    Does nothing: the materializer was part of the enterprise edition this fork does not carry, so
    there is no column to create and none of the rename cleanup it guarded can apply. This matched
    the behavior already, since the body returned early whenever the enterprise import failed.

    Retained as a no-op rather than deleted so the migration sequence and every recorded migration
    state stay exactly as they are.
    """
    return


operations = [migrations.RunPython(materialize_session_and_window_id)]
