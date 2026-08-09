import { instrumentFn, instrumented } from '~/common/tracing/tracing-utils'
import { captureException } from '~/common/utils/insights'
import { logger } from '~/common/utils/logger'

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
import { buildInsightsFunctionInvocations } from '../utils/invocation-utils'
import { mirrorCompare } from '../utils/mirror-call'
import { InsightsFunctionManagerService } from './managers/script-function-manager.service'
import { InsightsFunctionMonitoringService } from './monitoring/script-function-monitoring.service'
import { ScriptMaskerService } from './monitoring/script-masker.service'
import { ScriptWatcherService, ScriptWatcherState } from './monitoring/script-watcher.service'
import { ScriptInputsService } from './script-inputs.service'

export interface InsightsFunctionInvocationPipelineConfig {
    CDP_RATE_LIMITER_BUCKET_SIZE: number
    CDP_RATE_LIMITER_REFILL_RATE: number
    CDP_RATE_LIMITER_TTL: number
    CDP_OVERFLOW_QUEUE_ENABLED: boolean
}

export interface InsightsFunctionInvocationPipelineDeps {
    insightsFunctionManager: InsightsFunctionManagerService
    scriptInputsService: ScriptInputsService
    scriptWatcher: ScriptWatcherService
    scriptWatcherMirror: ScriptWatcherService | null
    scriptMasker: ScriptMaskerService
    insightsFunctionMonitoringService: InsightsFunctionMonitoringService
    quotaLimiting: QuotaLimiting
    redis: RedisV2
    valkeyShadow: CdpValkeyShadowPools | null
}

export interface BuildInsightsFunctionInvocationsOptions {
    scriptTypes: InsightsFunctionTypeType[]
    filterFn: (fn: InsightsFunctionType) => boolean
}

/**
 * Encapsulates the pipeline that turns event globals into script function invocations:
 * load functions → execute filters → watcher state → rate limit → quota → masking → metrics.
 *
 * Consumers compose this service rather than inheriting it.
 */
export class InsightsFunctionInvocationPipeline {
    private scriptRateLimiter: KeyedRateLimiterService
    private scriptRateLimiterMirror: KeyedRateLimiterService | null

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
        this.scriptRateLimiter = new KeyedRateLimiterService(rateLimiterConfig, deps.redis)
        this.scriptRateLimiterMirror = deps.valkeyShadow
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
            opts.scriptTypes,
            opts.filterFn
        )

        const possibleInvocations = (
            await Promise.all(
                invocationGlobals.map(async (globals) => {
                    const teamInsightsFunctions = insightsFunctionsByTeam[globals.project.id]

                    const { invocations, metrics, logs } = await buildInsightsFunctionInvocations(
                        this.deps.scriptInputsService,
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
        const states = await mirrorCompare(
            'script-watcher.getEffectiveStates',
            () =>
                instrumentFn('cdpConsumer.handleEachBatch.scriptWatcher.getEffectiveStates', async () => {
                    return await this.deps.scriptWatcher.getEffectiveStates(insightsFunctionIds)
                }),
            () => this.deps.scriptWatcherMirror?.getEffectiveStates(insightsFunctionIds)
        )

        const rateLimitInputs: KeyedRateLimitRequest[] = possibleInvocations.map((x) => ({
            id: x.insightsFunction.id,
            cost: 1,
        }))
        const rateLimits = await mirrorCompare(
            'script-rate-limiter.rateLimitGrouped',
            () =>
                instrumentFn('cdpConsumer.handleEachBatch.scriptRateLimiter.rateLimitGrouped', async () => {
                    return await this.scriptRateLimiter.rateLimitGrouped(rateLimitInputs)
                }),
            () => this.scriptRateLimiterMirror?.rateLimitGrouped(rateLimitInputs),
            (primary, mirror) =>
                primary.every(([, result], index) => result.isRateLimited === mirror[index]?.[1].isRateLimited)
        )

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
                        state: ScriptWatcherState[state],
                        kind: item.insightsFunction.type,
                    })
                    .inc()

                if (state === ScriptWatcherState.disabled) {
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

                if (state === ScriptWatcherState.degraded) {
                    item.queuePriority = 2
                    if (this.config.CDP_OVERFLOW_QUEUE_ENABLED) {
                        item.queue = 'hogoverflow'
                    }
                }

                validInvocations.push(item)
            })
        )

        const { masked, notMasked: notMaskedInvocations } = await this.deps.scriptMasker.filterByMasking(validInvocations)

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
