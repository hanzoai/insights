import { DateTime } from 'luxon'

import { InsightsFlow } from '~/cdp/schema/hogflow'
import { instrumentFn, instrumented } from '~/common/tracing/tracing-utils'
import { logger } from '~/common/utils/logger'
import { captureException } from '~/common/utils/insights'

import { RedisV2 } from '../../common/redis/redis-v2'
import { KeyedRateLimitRequest, KeyedRateLimiterService } from '../../common/services/keyed-rate-limiter.service'
import { QuotaLimiting } from '../../common/services/quota-limiting.service'
import { CdpValkeyShadowPools } from '../cdp-services'
import { counterRateLimited } from '../consumers/metrics'
import { CyclotronJobInvocation, InsightsFunctionInvocationGlobals, LogEntry, MinimalAppMetric } from '../types'
import { mirrorCall } from '../utils/mirror-call'
import { InsightsFlowExecutorService } from './insightsflows/hogflow-executor.service'
import { InsightsFlowManagerService } from './insightsflows/hogflow-manager.service'
import { shouldBlockInsightsFlowDueToQuota } from './insightsflows/hogflow-quota-limiting'
import { InsightsFunctionMonitoringService } from './monitoring/script-function-monitoring.service'
import { HogMaskerService } from './monitoring/script-masker.service'
import { HogWatcherService, HogWatcherState } from './monitoring/script-watcher.service'

export interface InsightsFlowInvocationPipelineConfig {
    CDP_RATE_LIMITER_BUCKET_SIZE: number
    CDP_RATE_LIMITER_REFILL_RATE: number
    CDP_RATE_LIMITER_TTL: number
}

export interface InsightsFlowInvocationPipelineDeps {
    hogFlowManager: InsightsFlowManagerService
    hogFlowExecutor: InsightsFlowExecutorService
    hogWatcher: HogWatcherService
    hogWatcherMirror: HogWatcherService | null
    hogMasker: HogMaskerService
    insightsFunctionMonitoringService: InsightsFunctionMonitoringService
    quotaLimiting: QuotaLimiting
    redis: RedisV2
    valkeyShadow: CdpValkeyShadowPools | null
}

/**
 * Encapsulates the pipeline that turns event globals into script flow invocations:
 * load insightsflows → execute filters → watcher state → rate limit → quota → masking → metrics.
 *
 * Consumers compose this service rather than inheriting it.
 */
export class InsightsFlowInvocationPipeline {
    private hogRateLimiter: KeyedRateLimiterService
    private hogRateLimiterMirror: KeyedRateLimiterService | null

    constructor(
        private config: InsightsFlowInvocationPipelineConfig,
        private deps: InsightsFlowInvocationPipelineDeps
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

    @instrumented('cdpConsumer.handleEachBatch.queueMatchingFlows')
    public async buildInvocations(
        invocationGlobals: InsightsFunctionInvocationGlobals[],
        options?: {
            // Predicate evaluated per (flow, globals) before the executor runs filter bytecode.
            // The consumer is the natural layer to decide trigger-source compatibility because it
            // knows its own source (events consumer → event triggers; DWH consumer → matching
            // warehouse-table triggers). Flows that fail the predicate are skipped without
            // touching the executor.
            eligibilityFn?: (hogFlow: InsightsFlow, globals: InsightsFunctionInvocationGlobals) => boolean
        }
    ): Promise<CyclotronJobInvocation[]> {
        const teamsToLoad = [...new Set(invocationGlobals.map((x) => x.project.id))]
        const hogFlowsByTeam = await this.deps.hogFlowManager.getInsightsFlowsForTeams(teamsToLoad)
        const eligibilityFn = options?.eligibilityFn

        const possibleInvocations = (
            await Promise.all(
                invocationGlobals.map(async (globals) => {
                    const teamInsightsFlows = hogFlowsByTeam[globals.project.id]
                    const eligibleFlows = eligibilityFn
                        ? teamInsightsFlows.filter((flow) => eligibilityFn(flow, globals))
                        : teamInsightsFlows

                    const { invocations, metrics, logs } = await this.deps.hogFlowExecutor.buildInsightsFlowInvocations(
                        eligibleFlows,
                        globals
                    )

                    this.deps.insightsFunctionMonitoringService.queueAppMetrics(metrics, 'hog_flow')
                    this.deps.insightsFunctionMonitoringService.queueLogs(logs, 'hog_flow')

                    return invocations
                })
            )
        ).flat()

        const hogFlowIds = possibleInvocations.map((x) => x.hogFlow.id)
        const [states] = await Promise.all([
            instrumentFn('cdpConsumer.handleEachBatch.hogWatcher.getEffectiveStates', async () => {
                return await this.deps.hogWatcher.getEffectiveStates(hogFlowIds)
            }),
            mirrorCall('script-watcher.getEffectiveStates', () =>
                this.deps.hogWatcherMirror?.getEffectiveStates(hogFlowIds)
            ),
        ])

        const rateLimitInputs: KeyedRateLimitRequest[] = possibleInvocations.map((x) => ({
            id: x.hogFlow.id,
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
        const validInvocations: CyclotronJobInvocation[] = []

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

                        logger.warn('⚠️', 'Hogflow invocation rate limited', {
                            teamId: item.teamId,
                            hogFlowId: item.functionId,
                            hogFlowName: item.hogFlow.name,
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
                const isQuotaLimited = await shouldBlockInsightsFlowDueToQuota(item, {
                    quotaLimiting: this.deps.quotaLimiting,
                    insightsFunctionMonitoringService: this.deps.insightsFunctionMonitoringService,
                })

                if (isQuotaLimited) {
                    return
                }

                const state = states[item.hogFlow.id].state
                if (state === HogWatcherState.disabled) {
                    this.deps.insightsFunctionMonitoringService.queueAppMetric(
                        {
                            team_id: item.teamId,
                            app_source_id: item.functionId,
                            metric_kind: 'failure',
                            metric_name: 'disabled_permanently',
                            count: 1,
                        },
                        'hog_flow'
                    )
                    return
                }

                if (state === HogWatcherState.degraded) {
                    item.queuePriority = 2
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
            })
        })

        this.deps.insightsFunctionMonitoringService.queueAppMetrics(triggeredInvocationsMetrics, 'hog_flow')

        return notMaskedInvocations
    }
}
