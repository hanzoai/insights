import { useValues } from 'kea'

import { IconCheck, IconFilter, IconX } from '@hanzo/icons'
import { Skeleton, Tooltip } from '@hanzo/elements'

import { humanFriendlyLargeNumber } from 'lib/utils'

import { InsightsFlowEditorActionMetrics, insightsFlowEditorLogic } from '../../insightsFlowEditorLogic'
import { InsightsFlowAction } from '../../types'

export function StepViewMetrics({ action }: { action: InsightsFlowAction }): JSX.Element {
    const { actionMetricsById, actionMetricsByIdLoading } = useValues(insightsFlowEditorLogic)

    const metrics: InsightsFlowEditorActionMetrics = actionMetricsById?.[action.id] ?? {
        actionId: action.id,
        succeeded: 0,
        failed: 0,
        filtered: 0,
    }

    if (actionMetricsByIdLoading) {
        return (
            <div className="flex items-center gap-1 h-2 px-1">
                <Skeleton className="w-full h-[6px]" />
                <Skeleton className="w-full h-[6px]" />
                <Skeleton className="w-full h-[6px]" />
            </div>
        )
    }

    return (
        <div
            className="flex flex-row items-center font-mono"
            style={{
                fontSize: 6,
            }}
        >
            <Tooltip title="Successful runs of this action">
                <div className="flex-1 px-1 text-success">
                    <IconCheck /> {humanFriendlyLargeNumber(metrics.succeeded)}
                </div>
            </Tooltip>

            <Tooltip title="Failed runs of this action">
                <div className="flex-1 px-1 text-error">
                    <IconX /> {humanFriendlyLargeNumber(metrics.failed)}
                </div>
            </Tooltip>
            <Tooltip title="Filtered runs of this action">
                <div className="flex-1 px-1 text-muted">
                    <IconFilter /> {humanFriendlyLargeNumber(metrics.filtered)}
                </div>
            </Tooltip>
        </div>
    )
}
