from datastore_orm import migrations


def create_materialized_columns(database):
    """Materialize the $group_N properties into physical columns.

    Does nothing: the materializer was part of the enterprise edition this fork does not carry.
    Deployments that already ran this migration keep the columns they created; the query layer
    reads $group_N out of the JSON blob either way.

    Retained as a no-op rather than deleted so the migration sequence and every recorded
    migration state stay exactly as they are.
    """
    return


operations = [migrations.RunPython(create_materialized_columns)]
