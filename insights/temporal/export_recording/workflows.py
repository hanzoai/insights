import json
import asyncio
from datetime import timedelta

from temporalio import common, workflow

from insights.temporal.common.base import InsightsWorkflow
from insights.temporal.export_recording.activities import (
    build_recording_export_context,
    cleanup_export_data,
    export_event_datastore_rows,
    export_recording_data,
    export_recording_data_prefix,
    export_replay_datastore_rows,
    store_export_data,
)
from insights.temporal.export_recording.types import ExportRecordingInput


@workflow.defn(name="export-recording")
class ExportRecordingWorkflow(InsightsWorkflow):
    @staticmethod
    def parse_inputs(input: list[str]) -> ExportRecordingInput:
        return ExportRecordingInput(**json.loads(input[0]))

    @workflow.run
    async def run(self, input: ExportRecordingInput) -> None:
        export_context = await workflow.execute_activity(
            build_recording_export_context,
            input,
            start_to_close_timeout=timedelta(minutes=5),
            schedule_to_close_timeout=timedelta(hours=3),
            retry_policy=common.RetryPolicy(
                maximum_attempts=2,
                initial_interval=timedelta(minutes=1),
            ),
        )

        async with asyncio.TaskGroup() as export_tasks:
            export_tasks.create_task(
                workflow.execute_activity(
                    export_replay_datastore_rows,
                    export_context,
                    start_to_close_timeout=timedelta(minutes=30),
                    schedule_to_close_timeout=timedelta(hours=3),
                    retry_policy=common.RetryPolicy(
                        maximum_attempts=2,
                        initial_interval=timedelta(minutes=1),
                    ),
                )
            )
            export_tasks.create_task(
                workflow.execute_activity(
                    export_event_datastore_rows,
                    export_context,
                    start_to_close_timeout=timedelta(minutes=30),
                    schedule_to_close_timeout=timedelta(hours=3),
                    retry_policy=common.RetryPolicy(
                        maximum_attempts=2,
                        initial_interval=timedelta(minutes=1),
                    ),
                )
            )
            export_tasks.create_task(
                workflow.execute_activity(
                    export_recording_data,
                    export_context,
                    start_to_close_timeout=timedelta(hours=3),
                    schedule_to_close_timeout=timedelta(hours=6),
                    retry_policy=common.RetryPolicy(
                        maximum_attempts=2,
                        initial_interval=timedelta(minutes=1),
                    ),
                )
            )
            export_tasks.create_task(
                workflow.execute_activity(
                    export_recording_data_prefix,
                    export_context,
                    start_to_close_timeout=timedelta(minutes=5),
                    schedule_to_close_timeout=timedelta(hours=3),
                    retry_policy=common.RetryPolicy(
                        maximum_attempts=2,
                        initial_interval=timedelta(minutes=1),
                    ),
                )
            )

        await workflow.execute_activity(
            store_export_data,
            export_context,
            start_to_close_timeout=timedelta(hours=3),
            schedule_to_close_timeout=timedelta(hours=6),
            retry_policy=common.RetryPolicy(
                maximum_attempts=2,
                initial_interval=timedelta(minutes=1),
            ),
        )

        await workflow.execute_activity(
            cleanup_export_data,
            export_context,
            start_to_close_timeout=timedelta(minutes=5),
            schedule_to_close_timeout=timedelta(hours=3),
            retry_policy=common.RetryPolicy(
                maximum_attempts=2,
                initial_interval=timedelta(minutes=1),
            ),
        )
