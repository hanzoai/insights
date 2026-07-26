from datastore_orm import migrations


def create_materialized_columns(database):
    try:
        materialize("events", "$group_0", "$group_0")
        materialize("events", "$group_1", "$group_1")
        materialize("events", "$group_2", "$group_2")
        materialize("events", "$group_3", "$group_3")
        materialize("events", "$group_4", "$group_4")
    except (ValueError, Exception):
        # Group is already materialized, or table doesn't exist yet
        # (sharded_events is created by async migration 0004_replicated_schema)
        pass


operations = [migrations.RunPython(create_materialized_columns)]
