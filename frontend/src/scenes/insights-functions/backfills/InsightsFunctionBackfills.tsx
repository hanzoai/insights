import { BindLogic, useValues } from 'kea'

import { BatchExportBackfills } from 'scenes/data-pipelines/batch-exports/BatchExportBackfills'
import { BatchExportBackfillsLogicProps } from 'scenes/data-pipelines/batch-exports/batchExportBackfillsLogic'
import { batchExportDataLogic } from 'scenes/data-pipelines/batch-exports/batchExportDataLogic'
import { BatchExportLoadingSkeleton } from 'scenes/data-pipelines/batch-exports/BatchExportLoadingSkeleton'

import { insightsFunctionBackfillsLogic } from './insightsFunctionBackfillsLogic'

export function InsightsFunctionBackfills({ id }: BatchExportBackfillsLogicProps): JSX.Element {
    const { configuration, isReady } = useValues(insightsFunctionBackfillsLogic({ id }))

    if (!isReady) {
        return <BatchExportLoadingSkeleton />
    }

    return (
        <BindLogic logic={batchExportDataLogic} props={{ id: configuration.batch_export_id! }}>
            <div className="flex flex-col gap-3">
                <p className="text-secondary mb-0">
                    Backfills re-run this destination against historical events from a time range you choose.
                </p>
                <BatchExportBackfills id={configuration.batch_export_id!} context="insights_function" />
            </div>
        </BindLogic>
    )
}
