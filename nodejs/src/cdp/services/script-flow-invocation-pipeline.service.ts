import { DateTime } from 'luxon'

import { Flow } from '~/cdp/schema/flow'
import { instrumentFn, instrumented } from '~/common/tracing/tracing-utils'
import { captureException } from '~/common/utils/insights'
import { logger } from '~/common/utils/logger'

import { RedisV2 } from '../../common/redis/redis-v2'
import { KeyedRateLimitRequest, KeyedRateLimiterService } from '../../common/services/keyed-rate-limiter.service'
import { QuotaLimiting } from '../../common/services/quota-limiting.service'
import { CdpValkeyShadowPools } from '../cdp-services'
import { counterRateLimited } from '../consumers/metrics'
import {
    CyclotronJobInvocation,
    CyclotronJobInvocationFlow,
    InsightsFunctionInvocationGlobals,
    LogEntry,
    MinimalAppMetric,
} from '../types'
import { mirrorCompare } from '../utils/mirror-call'
import { FlowExecutorService } from './flows/flow-executor.service'
import { FlowManagerService } from './flows/flow-manager.service'
import { shouldBlockFlowDueToQuota } from './flows/flow-quota-limiting'
import { InsightsFunctionMonitoringService } from './monitoring/script-function-monitoring.service'
import { ScriptMaskerService } from './monitoring/script-masker.service'
import { ScriptWatcherService, ScriptWatcherState } from './monitoring/script-watcher.service'

export interface FlowInvocationPipelineConfig {
    CDP_RATE_LIMITER_BUCKET_SIZE: number
    CDP_RATE_LIMITER_REFILL_RATE: number
    CDP_RATE_LIMITER_TTL: number
}

export interface FlowInvocationPipelineDeps {
    flowManager: FlowManagerService
    flowExecutor: FlowExecutorService
    scriptWatcher: ScriptWatcherService
    scriptWatcherMirror: ScriptWatcherService | null
    scriptMasker: ScriptMaskerService
    insightsFunctionMonitoringService: InsightsFunctionMonitoringService
    quotaLimiting: QuotaLimiting
    redis: RedisV2
    valkeyShadow: CdpValkeyShadowPools | null
}

/**
 * Encapsulates the pipeline that turns event globals into script flow invocations:
 * load flows → execute filters → watcher state → rate limit → quota → masking → metrics.
 *
 * Consumers compose this service rather than inheriting it.
 */
export class FlowInvocationPipeline {
    private scriptRateLimiter: KeyedRateLimiterService
    private scriptRateLimiterMirror: KeyedRateLimiterService | null

    constructor(
        private config: FlowInvocationPipelineConfig,
        private deps: FlowInvocationPipelineDeps
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

    @instrumented('cdpConsumer.handleEachBatch.queueMatchingFlows')
    public async buildInvocations(
        invocationGlobals: InsightsFunctionInvocationGlobals[],
        options?: {
            // Predicate evaluated per (flow, globals) before the executor runs filter bytecode.
            // The consumer is the natural layer to decide trigger-source compatibility because it
            // knows its own source (events consumer → event triggers; DWH consumer → matching
            // warehouse-table triggers). Flows that fail the predicate are skipped without
            // touching the executor.
            eligibilityFn?: (flow: Flow, globals: InsightsFunctionInvocationGlobals) => boolean
        }
    ): Promise<CyclotronJobInvocation[]> {
        const teamsToLoad = [...new Set(invocationGlobals.map((x) => x.project.id))]
        const flowsByTeam = await this.deps.flowManager.getFlowsForTeams(teamsToLoad)
        const eligibilityFn = options?.eligibilityFn

        const possibleInvocations = (
            await Promise.all(
                invocationGlobals.map(async (globals) => {
                    const teamFlows = flowsByTeam[globals.project.id]
                    const eligibleFlows = eligibilityFn
                        ? teamFlows.filter((flow) => eligibilityFn(flow, globals))
                        : teamFlows

                    const { invocations, metrics, logs } = await this.deps.flowExecutor.buildFlowInvocations(
                        eligibleFlows,
                        globals
                    )

                    this.deps.insightsFunctionMonitoringService.queueAppMetrics(metrics, 'hog_flow')
                    this.deps.insightsFunctionMonitoringService.queueLogs(logs, 'hog_flow')

                    return invocations
                })
            )
        ).flat()

        const flowIds = possibleInvocations.map((x) => x.flow.id)
        const states = await mirrorCompare(
            'script-watcher.getEffectiveStates',
            () =>
                instrumentFn('cdpConsumer.handleEachBatch.scriptWatcher.getEffectiveStates', async () => {
                    return await this.deps.scriptWatcher.getEffectiveStates(flowIds)
                }),
            () => this.deps.scriptWatcherMirror?.getEffectiveStates(flowIds)
        )

        const rateLimitInputs: KeyedRateLimitRequest[] = possibleInvocations.map((x) => ({
            id: x.flow.id,
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
        const validInvocations: CyclotronJobInvocationFlow[] = []

        await Promise.all(
            possibleInvocations.map(async (item, index) => {
                try {
                    const rateLimit = rateLimits[index][1]
                    if (rateLimit.isRateLimited) {
                        counterRateLimited.labels({ kind: 'hog_flow', function_id: item.functionId }).inc()
                        this.deps.insightsFunctionMonitoringService.queueAppMetric(
                            {
                                team_id: item.teamId,
                                app_source_id: item.functionId,
                                metric_kind: 'failure',
                                metric_name: 'rate_limited',
                                count: 1,
                                app_source_version: { id: item.flow.id, version: item.flow.version },
                            },
                            'hog_flow'
                        )

                        const eventUuid = item.state?.event?.uuid
                        const personId = item.person?.id

                        const logEntry: LogEntry = {
                            timestamp: DateTime.now(),
                            level: 'warn',
                            message: `Workflow invocation dropped due to rate limiting for [Person:${personId ?? 'unknown'}] on [Event:${eventUuid ?? 'unknown'}]`,
                            team_id: item.teamId,
                            log_source: 'hog_flow',
                            log_source_id: item.functionId,
                            instance_id: item.id,
                        }
                        this.deps.insightsFunctionMonitoringService.queueLogs([logEntry], 'hog_flow')

                        logger.warn('⚠️', 'Scriptflow invocation rate limited', {
                            teamId: item.teamId,
                            flowId: item.functionId,
                            flowName: item.flow.name,
                            eventUuid,
                            personId,
                        })

                        return
                    }
                } catch (e) {
                    captureException(e)
                    logger.error('🔴', 'Error checking rate limit for script flow', { err: e })
                }

                // Check quota limits for workflow actions
                const isQuotaLimited = await shouldBlockFlowDueToQuota(item, {
                    quotaLimiting: this.deps.quotaLimiting,
                    insightsFunctionMonitoringService: this.deps.insightsFunctionMonitoringService,
                })

                if (isQuotaLimited) {
                    return
                }

                const state = states[item.flow.id].state
                if (state === ScriptWatcherState.disabled) {
                    this.deps.insightsFunctionMonitoringService.queueAppMetric(
                        {
                            team_id: item.teamId,
                            app_source_id: item.functionId,
                            metric_kind: 'failure',
                            metric_name: 'disabled_permanently',
                            count: 1,
                            app_source_version: { id: item.flow.id, version: item.flow.version },
                        },
                        'hog_flow'
                    )
                    return
                }

                if (state === ScriptWatcherState.degraded) {
                    item.queuePriority = 2
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
                app_source_version: { id: item.flow.id, version: item.flow.version },
            })),
            'hog_flow'
        )

        const triggeredInvocationsMetrics: MinimalAppMetric[] = []

        notMaskedInvocations.forEach((item) => {
            triggeredInvocationsMetrics.push({
                team_id: item.teamId,
                app_source_id: item.functionId,
                metric_kind: 'other',
                metric_name: 'triggered',
                count: 1,
                app_source_version: { id: item.flow.id, version: item.flow.version },
            })
        })

        this.deps.insightsFunctionMonitoringService.queueAppMetrics(triggeredInvocationsMetrics, 'hog_flow')

        return notMaskedInvocations
    }
}
