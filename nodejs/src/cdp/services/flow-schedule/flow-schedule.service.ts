import { Counter, Gauge } from 'prom-client'
import { z } from 'zod'

import { InternalFetchService } from '~/common/services/internal-fetch'
import { parseJSON } from '~/common/utils/json-parse'
import { logger } from '~/common/utils/logger'
import {
    HealthCheckResult,
    HealthCheckResultError,
    HealthCheckResultOk,
    PluginServerService,
    PluginsServerConfig,
} from '~/types'

const schedulerPollCounter = new Counter({
    name: 'cdp_flow_scheduler_polls',
    help: 'Number of scheduler poll cycles completed',
    labelNames: ['status'],
})

const schedulerProcessedCounter = new Counter({
    name: 'cdp_flow_scheduler_processed',
    help: 'Number of due schedules processed (batch jobs created by Django)',
})

const schedulerInitializedCounter = new Counter({
    name: 'cdp_flow_scheduler_initialized',
    help: 'Number of schedules initialized with next_run_at',
})

const schedulerFailedCounter = new Counter({
    name: 'cdp_flow_scheduler_failed',
    help: 'Number of schedule processing failures',
    labelNames: ['stage'],
})

const schedulerPollDurationGauge = new Gauge({
    name: 'cdp_flow_scheduler_poll_duration_ms',
    help: 'Duration of the last poll cycle in milliseconds',
})

const ProcessDueSchedulesResponseSchema = z.object({
    processed: z.array(z.string()),
    initialized: z.array(z.string()),
    failed: z.array(z.string()),
})

export class FlowScheduleService {
    private running = false
    private pollPromise: Promise<void> | null = null
    private sleepResolve: (() => void) | null = null
    private consecutiveFailures = 0
    private lastSuccessfulPollAt = Date.now()
    private readonly pollIntervalMs: number
    private readonly maxPollIntervalMs: number
    private readonly healthTimeoutMs: number
    private readonly internalFetchService: InternalFetchService

    constructor(private config: PluginsServerConfig) {
        this.pollIntervalMs = config.FLOW_SCHEDULER_POLL_INTERVAL_MS
        this.maxPollIntervalMs = config.FLOW_SCHEDULER_MAX_POLL_INTERVAL_MS
        this.healthTimeoutMs = config.FLOW_SCHEDULER_HEALTH_TIMEOUT_MS
        this.internalFetchService = new InternalFetchService(config.INTERNAL_API_BASE_URL, config.INTERNAL_API_SECRET)
    }

    start(): void {
        if (this.running) {
            return
        }

        logger.info('FlowScheduleService: starting...')

        this.running = true
        this.pollPromise = this.pollLoop()
        logger.info('FlowScheduleService: started, polling every ' + this.pollIntervalMs + 'ms')
    }

    private nextSleepMs(): number {
        if (this.consecutiveFailures === 0) {
            return this.pollIntervalMs
        }
        return Math.min(this.pollIntervalMs * 2 ** this.consecutiveFailures, this.maxPollIntervalMs)
    }

    private async pollLoop(): Promise<void> {
        while (this.running) {
            const success = await this.pollAndDispatch()
            if (success) {
                this.consecutiveFailures = 0
                this.lastSuccessfulPollAt = Date.now()
            } else {
                this.consecutiveFailures++
            }
            if (this.running) {
                const sleepMs = this.nextSleepMs()
                await new Promise<void>((resolve) => {
                    this.sleepResolve = resolve
                    setTimeout(resolve, sleepMs)
                })
                this.sleepResolve = null
            }
        }
    }

    async pollAndDispatch(): Promise<boolean> {
        const startTime = Date.now()
        try {
            const { fetchResponse, fetchError } = await this.internalFetchService.fetch({
                urlPath: '/v1/internal/hog_flows/process_due_schedules',
                fetchParams: {
                    method: 'POST',
                },
            })

            if (fetchError || !fetchResponse) {
                logger.error('FlowScheduleService: failed to call Django endpoint', {
                    error: String(fetchError),
                })
                schedulerPollCounter.inc({ status: 'error' })
                schedulerFailedCounter.inc({ stage: 'fetch' })
                return false
            }

            if (fetchResponse.status !== 200) {
                const errorText = await fetchResponse.text()
                logger.error('FlowScheduleService: Django endpoint returned error', {
                    status: fetchResponse.status,
                    error: errorText,
                })
                schedulerPollCounter.inc({ status: 'error' })
                schedulerFailedCounter.inc({ stage: 'django' })
                return false
            }

            const data = ProcessDueSchedulesResponseSchema.parse(parseJSON(await fetchResponse.text()))

            if (data.initialized.length > 0) {
                schedulerInitializedCounter.inc(data.initialized.length)
                logger.info('FlowScheduleService: initialized schedules', {
                    count: data.initialized.length,
                    scheduleIds: data.initialized,
                })
            }

            if (data.failed.length > 0) {
                schedulerFailedCounter.inc({ stage: 'process' }, data.failed.length)
                logger.error('FlowScheduleService: schedules failed to process', {
                    count: data.failed.length,
                    scheduleIds: data.failed,
                })
            }

            if (data.processed.length > 0) {
                schedulerProcessedCounter.inc(data.processed.length)
                logger.info('FlowScheduleService: processed due schedules', {
                    count: data.processed.length,
                    scheduleIds: data.processed,
                })
            }

            schedulerPollCounter.inc({ status: 'success' })
            return true
        } catch (err) {
            logger.error('FlowScheduleService: failed to poll', { error: String(err) })
            schedulerPollCounter.inc({ status: 'error' })
            schedulerFailedCounter.inc({ stage: 'poll' })
            return false
        } finally {
            schedulerPollDurationGauge.set(Date.now() - startTime)
        }
    }

    async stop(): Promise<void> {
        this.running = false
        this.sleepResolve?.()
        await this.pollPromise
    }

    isHealthy(): HealthCheckResult {
        if (!this.running) {
            return new HealthCheckResultError('FlowScheduleService is not running', {})
        }
        if (Date.now() - this.lastSuccessfulPollAt > this.healthTimeoutMs) {
            return new HealthCheckResultError('FlowScheduleService has not polled successfully recently', {
                lastSuccessfulPollAt: new Date(this.lastSuccessfulPollAt).toISOString(),
                consecutiveFailures: this.consecutiveFailures,
            })
        }
        return new HealthCheckResultOk()
    }

    get service(): PluginServerService {
        return {
            id: 'cdp-flow-scheduler',
            onShutdown: () => this.stop(),
            healthcheck: () => this.isHealthy(),
        }
    }
}
