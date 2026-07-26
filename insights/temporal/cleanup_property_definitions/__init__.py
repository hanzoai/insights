from insights.temporal.cleanup_property_definitions.activities import (
    delete_property_definitions_from_datastore,
    delete_property_definitions_from_postgres,
    preview_property_definitions,
)
from insights.temporal.cleanup_property_definitions.workflows import CleanupPropertyDefinitionsWorkflow

WORKFLOWS = [
    CleanupPropertyDefinitionsWorkflow,
]

ACTIVITIES = [
    delete_property_definitions_from_datastore,
    delete_property_definitions_from_postgres,
    preview_property_definitions,
]
