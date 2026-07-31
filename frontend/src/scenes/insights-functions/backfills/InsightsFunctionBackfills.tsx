import { BindLogic, useValues } from 'kea'

import { Skeleton } from '@hanzo/elements'

import { BatchExportBackfills } from 'scenes/data-pipelines/batch-exports/BatchExportBackfills'
import {
    BatchExportBackfillsLogicProps,
    batchExportBackfillsLogic,
} from 'scenes/data-pipelines/batch-exports/batchExportBackfillsLogic'

import { insightsFunctionBackfillsLogic } from './insightsFunctionBackfillsLogic'

export function InsightsFunctionBackfills({ id }: BatchExportBackfillsLogicProps): JSX.Element {
    const { configuration, isReady } = useValues(insightsFunctionBackfillsLogic({ id }))

    if (!isReady) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="w-20 h-8" fade />
                    <Skeleton className="w-32 h-10" fade />
                </div>
                <Skeleton className="w-full h-96" fade />
            </div>
        )
    }

    return (
        <BindLogic logic={batchExportBackfillsLogic} props={{ id: configuration.batch_export_id! }}>
            <BackfillsWithLoadingCheck batchExportId={configuration.batch_export_id!} />
        </BindLogic>
    )
}

function BackfillsWithLoadingCheck({ batchExportId }: { batchExportId: string }): JSX.Element {
    const { batchExportConfig } = useValues(batchExportBackfillsLogic({ id: batchExportId }))

    if (!batchExportConfig) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="w-20 h-8" fade />
                    <Skeleton className="w-32 h-10" fade />
                </div>
                <Skeleton className="w-full h-96" fade />
            </div>
        )
    }

    return <BatchExportBackfills id={batchExportId} />
}
