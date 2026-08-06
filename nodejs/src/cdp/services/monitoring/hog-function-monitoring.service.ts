import { Counter, Gauge, Histogram } from 'prom-client'

import { AppMetricsOutput, LOG_ENTRIES_OUTPUT, LogEntriesOutput } from '~/common/outputs'
import { IngestionOutputs } from '~/common/outputs/ingestion-outputs'
import { AppMetricsAggregator } from '~/common/services/app-metrics-aggregator'
import { safeDatastoreString } from '~/common/utils/db/utils'
import { logger } from '~/common/utils/logger'
import { captureException } from '~/common/utils/insights'

import {
    CyclotronJobInvocationInsightsFunction,
    CyclotronJobInvocationResult,
    LogEntry,
    LogEntrySerialized,
    MetricLogSource,
    MinimalAppMetric,
} from '../../types'
import { fixLogDeduplication } from '../../utils'

const counterInsightsFunctionMetric = new Counter({
    name: 'cdp_insights_function_metric',
    help: 'A function invocation was evaluated with an outcome',
    labelNames: ['metric_kind', 'metric_name'],
})

export const insightsFunctionExecutionTimeSummary = new Histogram({
    name: 'cdp_insights_function_duration',
    help: 'Processing time of script function execution by kind',
    labelNames: ['kind'],
})

const insightsFunctionMonitoringPendingMessages = new Gauge({
    name: 'cdp_insights_function_monitoring_pending_messages',
    help: 'Number of log entries queued and waiting to be flushed to Kafka. App-metric backlog is tracked separately by app_metrics_aggregator_queued_total / app_metrics_aggregator_flushed_total. High values indicate accumulation and potential memory leak.',
})

export type MonitoringOutput = AppMetricsOutput | LogEntriesOutput

// Check if the result is of type CyclotronJobInvocationInsightsFunction
export const isInsightsFunctionResult = (
    result: CyclotronJobInvocationResult
): result is CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction> => {
    return 'insightsFunction' in result.invocation
}

export class InsightsFunctionMonitoringService {
    queuedLogMessages: LogEntrySerialized[] = []

    private appMetricsAggregator: AppMetricsAggregator

    constructor(private outputs: IngestionOutputs<MonitoringOutput>) {
        this.appMetricsAggregator = new AppMetricsAggregator(outputs)
    }

    async flush() {
        const messages = [...this.queuedLogMessages]
        this.queuedLogMessages = []
        insightsFunctionMonitoringPendingMessages.set(0)

        await Promise.all([
            this.appMetricsAggregator.flush().catch((error) => {
                // Best-effort — don't disrupt processing just for metrics.
                logger.error('⚠️', `failed to flush app metrics: ${error}`, { error: String(error) })
                captureException(error)
            }),
            ...messages.map((x) => {
                const value = x ? Buffer.from(safeDatastoreString(JSON.stringify(x))) : null
                return this.outputs
                    .produce(LOG_ENTRIES_OUTPUT, {
                        key: null,
                        value,
                    })
                    .catch((error) => {
                        // NOTE: We don't hard fail here - this is because we don't want to disrupt the
                        // entire processing just for metrics.
                        logger.error('⚠️', `failed to produce log entry: ${error}`, {
                            error: String(error),
                            messageLength: value?.length,
                        })

                        captureException(error)
                    })
            }),
        ])
    }

    queueAppMetric(metric: MinimalAppMetric, source: MetricLogSource) {
        counterInsightsFunctionMetric.labels(metric.metric_kind, metric.metric_name).inc(metric.count)

        this.appMetricsAggregator.queue({
            team_id: metric.team_id,
            app_source: source,
            app_source_id: metric.app_source_id,
            instance_id: metric.instance_id,
            metric_kind: metric.metric_kind,
            metric_name: metric.metric_name,
            count: metric.count,
        })
    }

    queueAppMetrics(metrics: MinimalAppMetric[], source: MetricLogSource) {
        metrics.forEach((metric) => this.queueAppMetric(metric, source))
    }

    queueLogs(logEntries: LogEntry[], source: MetricLogSource) {
        const logs = fixLogDeduplication(
            logEntries.map((logEntry) => ({
                ...logEntry,
                log_source: source,
            }))
        )

        logs.forEach((logEntry) => {
            this.queuedLogMessages.push(logEntry)
        })
        insightsFunctionMonitoringPendingMessages.set(this.queuedLogMessages.length)
    }

    queueInvocationResults(results: CyclotronJobInvocationResult[]): void {
        for (const result of results) {
            const source = 'insightsFunction' in result.invocation ? 'insights_function' : 'hog_flow'
            const logSourceId = result.invocation.parentRunId
                ? result.invocation.parentRunId
                : result.invocation.functionId

            this.queueLogs(
                result.logs.map((logEntry) => ({
                    ...logEntry,
                    team_id: result.invocation.teamId,
                    log_source: source,
                    log_source_id: logSourceId,
                    instance_id: result.invocation.id,
                })),
                source
            )

            if (result.metrics) {
                this.queueAppMetrics(result.metrics, source)
            }

            if (result.finished || result.error) {
                // Process each timing entry individually instead of totaling them
                const timings = isInsightsFunctionResult(result) ? (result.invocation.state?.timings ?? []) : []
                for (const timing of timings) {
                    // Record metrics for this timing entry
                    insightsFunctionExecutionTimeSummary.labels({ kind: timing.kind }).observe(timing.duration_ms)
                }

                this.queueAppMetric(
                    {
                        team_id: result.invocation.teamId,
                        app_source_id: result.invocation.parentRunId ?? result.invocation.functionId,
                        metric_kind: result.error ? 'failure' : 'success',
                        metric_name: result.error ? 'failed' : 'succeeded',
                        count: 1,
                    },
                    source
                )
            }
        }
    }
}
