import { Counter, Gauge, Histogram } from 'prom-client'

import { InternalCaptureEvent } from '~/common/services/internal-capture'
import { instrumentFn } from '~/common/tracing/tracing-utils'

import { Hub, TimestampFormat } from '../../../types'
import { safeClickhouseString } from '../../../utils/db/utils'
import { logger } from '../../../utils/logger'
import { captureException } from '../../../utils/insights'
import { castTimestampOrNow } from '../../../utils/utils'
import {
    AppMetricType,
    CyclotronJobInvocationInsightsFunction,
    CyclotronJobInvocationResult,
    LogEntry,
    LogEntrySerialized,
    MetricLogSource,
    MinimalAppMetric,
} from '../../types'
import { fixLogDeduplication } from '../../utils'

export type InsightsFunctionMonitoringServiceHub = Pick<
    Hub,
    | 'kafkaProducer'
    | 'internalCaptureService'
    | 'teamManager'
    | 'INSIGHTS_FUNCTION_MONITORING_APP_METRICS_TOPIC'
    | 'INSIGHTS_FUNCTION_MONITORING_LOG_ENTRIES_TOPIC'
>

const counterInsightsFunctionMetric = new Counter({
    name: 'cdp_insights_function_metric',
    help: 'A function invocation was evaluated with an outcome',
    labelNames: ['metric_kind', 'metric_name'],
})

export const insightsFunctionExecutionTimeSummary = new Histogram({
    name: 'cdp_insights_function_duration',
    help: 'Processing time of custom function execution by kind',
    labelNames: ['kind'],
})

const insightsFunctionMonitoringPendingMessages = new Gauge({
    name: 'cdp_insights_function_monitoring_pending_messages',
    help: 'Number of monitoring messages queued and waiting to be flushed to Kafka. High values indicate accumulation and potential memory leak.',
})

const insightsFunctionMonitoringPendingEvents = new Gauge({
    name: 'cdp_insights_function_monitoring_pending_events',
    help: 'Number of internal capture events queued and waiting to be flushed. High values indicate accumulation and potential memory leak.',
})

export type InsightsFunctionMonitoringMessage = {
    topic: string
    value: LogEntrySerialized | AppMetricType
    headers?: Record<string, string>
    key: string
}

// Check if the result is of type CyclotronJobInvocationInsightsFunction
export const isInsightsFunctionResult = (
    result: CyclotronJobInvocationResult
): result is CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction> => {
    return 'insightsFunction' in result.invocation
}

export class InsightsFunctionMonitoringService {
    messagesToProduce: InsightsFunctionMonitoringMessage[] = []
    eventsToCapture: InternalCaptureEvent[] = []

    constructor(private hub: InsightsFunctionMonitoringServiceHub) {}

    async flush() {
        const messages = [...this.messagesToProduce]
        this.messagesToProduce = []
        insightsFunctionMonitoringPendingMessages.set(0)

        const eventsToCapture = [...this.eventsToCapture]
        this.eventsToCapture = []
        insightsFunctionMonitoringPendingEvents.set(0)

        await Promise.all([
            ...messages.map((x) => {
                const value = x.value ? Buffer.from(safeClickhouseString(JSON.stringify(x.value))) : null
                return this.hub.kafkaProducer
                    .produce({
                        topic: x.topic,
                        key: x.key ? Buffer.from(x.key) : null,
                        value,
                        headers: x.headers,
                    })
                    .catch((error) => {
                        // NOTE: We don't hard fail here - this is because we don't want to disrupt the
                        // entire processing just for metrics.
                        logger.error('⚠️', `failed to produce message: ${error}`, {
                            error: String(error),
                            messageLength: value?.length,
                            topic: x.topic,
                            key: x.key,
                            headers: x.headers,
                        })

                        captureException(error)
                    })
            }),
            eventsToCapture.map((event) =>
                this.hub.internalCaptureService.capture(event).catch((error) => {
                    logger.error('Error capturing internal event', { error })
                    captureException(error)
                })
            ),
        ])
    }

    queueAppMetric(metric: MinimalAppMetric, source: MetricLogSource) {
        const appMetric: AppMetricType = {
            app_source: source,
            ...metric,
            timestamp: castTimestampOrNow(null, TimestampFormat.ClickHouse),
        }

        counterInsightsFunctionMetric.labels(metric.metric_kind, metric.metric_name).inc(appMetric.count)

        this.messagesToProduce.push({
            topic: this.hub.INSIGHTS_FUNCTION_MONITORING_APP_METRICS_TOPIC,
            value: appMetric,
            key: appMetric.app_source_id,
        })
        insightsFunctionMonitoringPendingMessages.set(this.messagesToProduce.length)
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
            this.messagesToProduce.push({
                topic: this.hub.INSIGHTS_FUNCTION_MONITORING_LOG_ENTRIES_TOPIC,
                value: logEntry,
                key: logEntry.instance_id,
            })
        })
        insightsFunctionMonitoringPendingMessages.set(this.messagesToProduce.length)
    }

    async queueInvocationResults(results: CyclotronJobInvocationResult[]): Promise<void> {
        return await instrumentFn(`cdpConsumer.handleEachBatch.produceResults`, async () => {
            await Promise.all(
                results.map(async (result) => {
                    const source = 'insightsFunction' in result.invocation ? 'insights_function' : 'insights_flow'
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
                                app_source_id: result.invocation.functionId,
                                metric_kind: result.error ? 'failure' : 'success',
                                metric_name: result.error ? 'failed' : 'succeeded',
                                count: 1,
                            },
                            source
                        )
                    }

                    // Insights capture events
                    const capturedEvents = result.capturedInsightsEvents

                    for (const event of capturedEvents ?? []) {
                        const team = await this.hub.teamManager.getTeam(event.team_id)
                        if (!team) {
                            continue
                        }

                        this.eventsToCapture.push({
                            team_token: team.api_token,
                            event: event.event,
                            distinct_id: event.distinct_id,
                            timestamp: event.timestamp,
                            properties: event.properties,
                        })
                        insightsFunctionMonitoringPendingEvents.set(this.eventsToCapture.length)
                    }
                })
            )
        })
    }
}
