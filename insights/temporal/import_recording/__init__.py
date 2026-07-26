from insights.temporal.import_recording.activities import (
    build_import_context,
    cleanup_import_data,
    import_event_datastore_rows,
    import_recording_data,
    import_replay_datastore_rows,
)
from insights.temporal.import_recording.workflows import ImportRecordingWorkflow

WORKFLOWS = [ImportRecordingWorkflow]

ACTIVITIES = [
    build_import_context,
    cleanup_import_data,
    import_event_datastore_rows,
    import_recording_data,
    import_replay_datastore_rows,
]
