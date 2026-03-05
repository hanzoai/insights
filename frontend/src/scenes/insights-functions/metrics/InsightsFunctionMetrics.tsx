import { useValues } from 'kea'

import { getColorVar } from 'lib/colors'
import { AppMetricSummary } from 'lib/components/AppMetrics/AppMetricSummary'
import { AppMetricsFilters } from 'lib/components/AppMetrics/AppMetricsFilters'
import { AppMetricsTrends } from 'lib/components/AppMetrics/AppMetricsTrends'
import { appMetricsLogic } from 'lib/components/AppMetrics/appMetricsLogic'

const CUSTOMFUNCTION_METRIC_KEYS = ['succeeded', 'failed', 'filtered', 'disabled_permanently', 'quota_limited'] as const

export const CUSTOMFUNCTION_METRICS_INFO: Record<string, { name: string; description: string; color: string }> = {
    succeeded: {
        name: 'Success',
        description: 'Total number of events processed successfully',
        color: getColorVar('success'),
    },
    failed: {
        name: 'Failure',
        description: 'Total number of events that had errors during processing',
        color: getColorVar('danger'),
    },
    filtered: {
        name: 'Filtered',
        description: 'Total number of events that were filtered out',
        color: getColorVar('muted'),
    },
    disabled_permanently: {
        name: 'Disabled',
        description:
            'Total number of events that were skipped due to the destination being permanently disabled (due to prolonged issues with the destination)',
        color: getColorVar('danger'),
    },
    quota_limited: {
        name: 'Quota Limited',
        description: 'Total number of invocations blocked due to quota limits',
        color: getColorVar('danger'),
    },
}

export function InsightsFunctionMetrics({ id }: { id: string }): JSX.Element {
    const logic = appMetricsLogic({
        logicKey: `insights-function-metrics-${id}`,
        loadOnMount: true,
        loadOnChanges: true,
        forceParams: {
            appSource: 'insights_function',
            appSourceId: id,
            metricName: [...CUSTOMFUNCTION_METRIC_KEYS],
            breakdownBy: 'metric_name',
        },
    })

    const { appMetricsTrends, appMetricsTrendsLoading, getSingleTrendSeries } = useValues(logic)

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2 flex-wrap justify-end">
                <AppMetricsFilters logicKey={`insights-function-metrics-${id}`} />
            </div>

            <div className="flex flex-row gap-2 flex-wrap justify-center">
                {CUSTOMFUNCTION_METRIC_KEYS.map((key) => (
                    <AppMetricSummary
                        key={key}
                        name={CUSTOMFUNCTION_METRICS_INFO[key].name}
                        description={CUSTOMFUNCTION_METRICS_INFO[key].description}
                        loading={appMetricsTrendsLoading}
                        timeSeries={getSingleTrendSeries(key)}
                        previousPeriodTimeSeries={getSingleTrendSeries(key, true)}
                        color={CUSTOMFUNCTION_METRICS_INFO[key].color}
                        colorIfZero={getColorVar('muted')}
                        hideIfZero={!['succeeded', 'failed', 'filtered'].includes(key)}
                    />
                ))}
            </div>
            <AppMetricsTrends appMetricsTrends={appMetricsTrends} loading={appMetricsTrendsLoading} />
        </div>
    )
}
