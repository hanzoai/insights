import { instrumentFn, instrumented } from '~/common/tracing/tracing-utils'
import { logger } from '~/common/utils/logger'
import { captureException } from '~/common/utils/insights'

import { RedisV2 } from '../../common/redis/redis-v2'
import { KeyedRateLimitRequest, KeyedRateLimiterService } from '../../common/services/keyed-rate-limiter.service'
import { QuotaLimiting } from '../../common/services/quota-limiting.service'
import { CdpValkeyShadowPools } from '../cdp-services'
import { counterInsightsFunctionStateOnEvent, counterRateLimited } from '../consumers/metrics'
import { shouldBlockInvocationDueToQuota } from '../consumers/quota-limiting-helper'
import {
    CyclotronJobInvocationInsightsFunction,
    InsightsFunctionInvocationGlobals,
    InsightsFunctionType,
    InsightsFunctionTypeType,
    MinimalAppMetric,
} from '../types'
import { mirrorCall } from '../utils/mirror-call'
import { HogExecutorService } from './script-executor.service'
import { InsightsFunctionManagerService } from './managers/script-function-manager.service'
import { InsightsFunctionMonitoringService } from './monitoring/script-function-monitoring.service'
import { HogMaskerService } from './monitoring/script-masker.service'
import { HogWatcherService, HogWatcherState } from './monitoring/script-watcher.service'

export interface InsightsFunctionInvocationPipelineConfig {
    CDP_RATE_LIMITER_BUCKET_SIZE: number
    CDP_RATE_LIMITER_REFILL_RATE: number
    CDP_RATE_LIMITER_TTL: number
    CDP_OVERFLOW_QUEUE_ENABLED: boolean
}

export interface InsightsFunctionInvocationPipelineDeps {
    insightsFunctionManager: InsightsFunctionManagerService
    hogExecutor: HogExecutorService
    hogWatcher: HogWatcherService
    hogWatcherMirror: HogWatcherService | null
    hogMasker: HogMaskerService
    insightsFunctionMonitoringService: InsightsFunctionMonitoringService
    quotaLimiting: QuotaLimiting
    redis: RedisV2
    valkeyShadow: CdpValkeyShadowPools | null
}

export interface BuildInsightsFunctionInvocationsOptions {
    hogTypes: InsightsFunctionTypeType[]
    filterFn: (fn: InsightsFunctionType) => boolean
}

/**
 * Encapsulates the pipeline that turns event globals into script function invocations:
 * load functions → execute filters → watcher state → rate limit → quota → masking → metrics.
 *
 * Consumers compose this service rather than inheriting it.
 */
export class InsightsFunctionInvocationPipeline {
    private hogRateLimiter: KeyedRateLimiterService
    private hogRateLimiterMirror: KeyedRateLimiterService | null

    constructor(
        private config: InsightsFunctionInvocationPipelineConfig,
        private deps: InsightsFunctionInvocationPipelineDeps
    ) {
        const rateLimiterConfig = {
            name: 'script-rate-limiter',
            bucketSize: config.CDP_RATE_LIMITER_BUCKET_SIZE,
            refillRate: config.CDP_RATE_LIMITER_REFILL_RATE,
            ttlSeconds: config.CDP_RATE_LIMITER_TTL,
        }
        this.hogRateLimiter = new KeyedRateLimiterService(rateLimiterConfig, deps.redis)
        this.hogRateLimiterMirror = deps.valkeyShadow
            ? new KeyedRateLimiterService(rateLimiterConfig, deps.valkeyShadow.writer)
            : null
    }

    @instrumented('cdpConsumer.handleEachBatch.queueMatchingFunctions')
    public async buildInvocations(
        invocationGlobals: InsightsFunctionInvocationGlobals[],
        opts: BuildInsightsFunctionInvocationsOptions
    ): Promise<CyclotronJobInvocationInsightsFunction[]> {
        const teamsToLoad = [...new Set(invocationGlobals.map((x) => x.project.id))]
        const insightsFunctionsByTeam = await this.deps.insightsFunctionManager.getInsightsFunctionsForTeams(
            teamsToLoad,
            opts.hogTypes,
            opts.filterFn
        )

        const possibleInvocations = (
            await Promise.all(
                invocationGlobals.map(async (globals) => {
                    const teamInsightsFunctions = insightsFunctionsByTeam[globals.project.id]

                    const { invocations, metrics, logs } = await this.deps.hogExecutor.buildInsightsFunctionInvocations(
                        teamInsightsFunctions,
                        globals
                    )

                    this.deps.insightsFunctionMonitoringService.queueAppMetrics(metrics, 'insights_function')
                    this.deps.insightsFunctionMonitoringService.queueLogs(logs, 'insights_function')

                    return invocations
                })
            )
        ).flat()

        const insightsFunctionIds = possibleInvocations.map((x) => x.insightsFunction.id)
        const [states] = await Promise.all([
            instrumentFn('cdpConsumer.handleEachBatch.hogWatcher.getEffectiveStates', async () => {
                return await this.deps.hogWatcher.getEffectiveStates(insightsFunctionIds)
            }),
            mirrorCall('script-watcher.getEffectiveStates', () =>
                this.deps.hogWatcherMirror?.getEffectiveStates(insightsFunctionIds)
            ),
        ])

        const rateLimitInputs: KeyedRateLimitRequest[] = possibleInvocations.map((x) => ({
            id: x.insightsFunction.id,
            cost: 1,
        }))
        const [rateLimits] = await Promise.all([
            instrumentFn('cdpConsumer.handleEachBatch.hogRateLimiter.rateLimitGrouped', async () => {
                return await this.hogRateLimiter.rateLimitGrouped(rateLimitInputs)
            }),
            mirrorCall('script-rate-limiter.rateLimitGrouped', () =>
                this.hogRateLimiterMirror?.rateLimitGrouped(rateLimitInputs)
            ),
        ])

        const validInvocations: CyclotronJobInvocationInsightsFunction[] = []

        await Promise.all(
            possibleInvocations.map(async (item, index) => {
                try {
                    const rateLimit = rateLimits[index][1]
                    if (rateLimit.isRateLimited) {
                        counterRateLimited.labels({ kind: 'insights_function', function_id: item.functionId }).inc()
                        // NOTE: We don't return here as we are just monitoring this feature currently
                    }
                } catch (e) {
                    captureException(e)
                    logger.error('🔴', 'Error checking rate limit for script function', { err: e })
                }

                const isQuotaLimited = await shouldBlockInvocationDueToQuota(item, {
                    quotaLimiting: this.deps.quotaLimiting,
                    insightsFunctionMonitoringService: this.deps.insightsFunctionMonitoringService,
                })

                if (isQuotaLimited) {
                    return
                }

                const state = states[item.insightsFunction.id].state

                counterInsightsFunctionStateOnEvent
                    .labels({
                        state: HogWatcherState[state],
                        kind: item.insightsFunction.type,
                    })
                    .inc()

                if (state === HogWatcherState.disabled) {
                    this.deps.insightsFunctionMonitoringService.queueAppMetric(
                        {
                            team_id: item.teamId,
                            app_source_id: item.functionId,
                            metric_kind: 'failure',
                            metric_name: 'disabled_permanently',
                            count: 1,
                        },
                        'insights_function'
                    )
                    return
                }

                if (state === HogWatcherState.degraded) {
                    item.queuePriority = 2
                    if (this.config.CDP_OVERFLOW_QUEUE_ENABLED) {
                        item.queue = 'hogoverflow'
                    }
                }

                validInvocations.push(item)
            })
        )

        const { masked, notMasked: notMaskedInvocations } = await this.deps.hogMasker.filterByMasking(validInvocations)

        this.deps.insightsFunctionMonitoringService.queueAppMetrics(
            masked.map((item) => ({
                team_id: item.teamId,
                app_source_id: item.functionId,
                metric_kind: 'other',
                metric_name: 'masked',
                count: 1,
            })),
            'insights_function'
        )

        const triggeredInvocationsMetrics: MinimalAppMetric[] = []

        // Track unique events that have been billed (billing is per-event, not per-destination)
        const billedEventUuids = new Set<string>()

        notMaskedInvocations.forEach((item) => {
            triggeredInvocationsMetrics.push({
                team_id: item.teamId,
                app_source_id: item.functionId,
                metric_kind: 'other',
                metric_name: 'triggered',
                count: 1,
            })

            // Bill once per triggering event, not per destination
            if (item.insightsFunction.type === 'destination') {
                const eventUuid = item.state?.globals?.event?.uuid
                if (eventUuid && !billedEventUuids.has(eventUuid)) {
                    billedEventUuids.add(eventUuid)
                    triggeredInvocationsMetrics.push({
                        team_id: item.teamId,
                        app_source_id: '_event_trigger',
                        instance_id: eventUuid,
                        metric_kind: 'billing',
                        metric_name: 'billable_invocation',
                        count: 1,
                    })
                }
            }
        })

        this.deps.insightsFunctionMonitoringService.queueAppMetrics(triggeredInvocationsMetrics, 'insights_function')

        return notMaskedInvocations
    }
}
