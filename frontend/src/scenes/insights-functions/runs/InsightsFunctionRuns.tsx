import { BindLogic, useValues } from 'kea'

import { batchExportDataLogic } from 'scenes/data-pipelines/batch-exports/batchExportDataLogic'
import { BatchExportLoadingSkeleton } from 'scenes/data-pipelines/batch-exports/BatchExportLoadingSkeleton'
import { BatchExportRuns } from 'scenes/data-pipelines/batch-exports/BatchExportRuns'

import { insightsFunctionBackfillsLogic, InsightsFunctionBackfillsLogicProps } from '../backfills/insightsFunctionBackfillsLogic'

export function InsightsFunctionRuns({ id }: InsightsFunctionBackfillsLogicProps): JSX.Element {
    const { configuration, isReady } = useValues(insightsFunctionBackfillsLogic({ id }))

    if (!isReady) {
        return <BatchExportLoadingSkeleton />
    }

    return (
        <BindLogic logic={batchExportDataLogic} props={{ id: configuration.batch_export_id! }}>
            <BatchExportRuns id={configuration.batch_export_id!} context="insights_function" />
        </BindLogic>
    )
}
