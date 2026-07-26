from insights.datastore.client.migration_tools import run_sql_with_exceptions
from insights.datastore.property_groups import property_groups

operations = [
    run_sql_with_exceptions(statement)
    for statement in [
        *property_groups.get_alter_create_statements("events", "properties", "custom"),
        *property_groups.get_alter_create_statements("events", "properties", "feature_flags"),
    ]
]
