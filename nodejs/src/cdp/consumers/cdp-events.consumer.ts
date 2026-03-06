// @ts-nocheck
import { Message } from 'node-rdkafka'

import { instrumentFn, instrumented } from '~/common/tracing/tracing-utils'

import { convertToInsightsFunctionInvocationGlobals } from '../../cdp/utils'
import { STREAM_EVENTS_JSON } from '../../config/stream-topics'
import { StreamConsumer } from '../../stream/consumer'
import { HealthCheckResult, Hub, PluginsServerConfig, RawDatastoreEvent } from '../../types'
import { parseJSON } from '../../utils/json-parse'
import { logger } from '../../utils/logger'
import { captureException } from '../../utils/insights'
import { shouldBlockInsightsFlowDueToQuota } from '../services/insightsflows/insightsflow-quota-limiting'
import { CyclotronJobQueue } from '../services/job-queue/job-queue'
import { ScriptRateLimiterService, ScriptRateLimiterServiceHub } from '../services/monitoring/script-rate-limiter.service'
import { ScriptWatcherState } from '../services/monitoring/script-watcher.service'
import {
    CyclotronJobInvocation,
    CyclotronJobInvocationInsightsFunction,
    InsightsFunctionInvocationGlobals,
    InsightsFunctionType,
    InsightsFunctionTypeType,
    MinimalAppMetric,
} from '../types'
import { CdpConsumerBase, CdpConsumerBaseHub } from './cdp-base.consumer'
import { counterInsightsFunctionStateOnEvent, counterParseError, counterRateLimited } from './metrics'
import { shouldBlockInvocationDueToQuota } from './quota-limiting-helper'

/**
 * Hub type for CdpEventsConsumer.
 * Extends CdpConsumerBaseHub with event consumer-specific fields.
 */
export type CdpEventsConsumerHub = CdpConsumerBaseHub &
    ScriptRateLimiterServiceHub &
    PluginsServerConfig & // For CyclotronJobQueue (to be narrowed later)
    Pick<Hub, 'teamManager' | 'SITE_URL'>

export class CdpEventsConsumer<THub extends CdpEventsConsumerHub = CdpEventsConsumerHub> extends CdpConsumerBase<THub> {
    protected name = 'CdpEventsConsumer'
    protected scriptTypes: InsightsFunctionTypeType[] = ['destination']
    private cyclotronJobQueue: CyclotronJobQueue
    protected streamConsumer: StreamConsumer

    private scriptRateLimiter: ScriptRateLimiterService

    constructor(hub: THub, topic: string = STREAM_EVENTS_JSON, groupId: string = 'cdp-processed-events-consumer') {
        super(hub)
        this.cyclotronJobQueue = new CyclotronJobQueue(hub, 'fn')
        this.streamConsumer = new StreamConsumer({ groupId, topic })
        this.scriptRateLimiter = new ScriptRateLimiterService(hub, this.redis)
    }

    public async processBatch(
        invocationGlobals: InsightsFunctionInvocationGlobals[]
    ): Promise<{ backgroundTask: Promise<any>; invocations: CyclotronJobInvocation[] }> {
        if (!invocationGlobals.length) {
            return { backgroundTask: Promise.resolve(), invocations: [] }
        }

        const invocationsToBeQueued = [
            ...(await this.createInsightsFunctionInvocations(invocationGlobals)),
            ...(await this.createInsightsFlowInvocations(invocationGlobals)),
        ]

        return {
            // This is all IO so we can set them off in the background and start processing the next batch
            backgroundTask: Promise.all([
                this.cyclotronJobQueue.queueInvocations(invocationsToBeQueued),
                this.insightsFunctionMonitoringService.flush().catch((err) => {
                    captureException(err)
                    logger.error('🔴', 'Error producing queued messages for monitoring', { err })
                }),
            ]),
            invocations: invocationsToBeQueued,
        }
    }

    protected filterInsightsFunction(insightsFunction: InsightsFunctionType): boolean {
        // By default we filter for those with no filters or filters specifically for events
        return (insightsFunction.filters?.source ?? 'events') === 'events'
    }

    /**
     * Finds all matching custom functions for the given globals.
     * Filters them for their disabled state as well as masking configs
     */
    @instrumented('cdpConsumer.handleEachBatch.queueMatchingFunctions')
    protected async createInsightsFunctionInvocations(
        invocationGlobals: InsightsFunctionInvocationGlobals[]
    ): Promise<CyclotronJobInvocation[]> {
        // TODO: Add a helper to custom functions to determine if they require groups or not and then only load those
        await this.groupsManager.enrichGroups(invocationGlobals)

        const teamsToLoad = [...new Set(invocationGlobals.map((x) => x.project.id))]
        const insightsFunctionsByTeam = await this.insightsFunctionManager.getInsightsFunctionsForTeams(
            teamsToLoad,
            this.scriptTypes,
            this.filterInsightsFunction
        )

        const possibleInvocations = (
            await Promise.all(
                invocationGlobals.map(async (globals) => {
                    const teamInsightsFunctions = insightsFunctionsByTeam[globals.project.id]

                    const { invocations, metrics, logs } = await this.scriptExecutor.buildInsightsFunctionInvocations(
                        teamInsightsFunctions,
                        globals
                    )

                    this.insightsFunctionMonitoringService.queueAppMetrics(metrics, 'insights_function')
                    this.insightsFunctionMonitoringService.queueLogs(logs, 'insights_function')
                    this.heartbeat()

                    return invocations
                })
            )
        ).flat()

        const states = await instrumentFn('cdpConsumer.handleEachBatch.scriptWatcher.getEffectiveStates', async () => {
            return await this.scriptWatcher.getEffectiveStates(possibleInvocations.map((x) => x.insightsFunction.id))
        })
        const rateLimits = await instrumentFn('cdpConsumer.handleEachBatch.scriptRateLimiter.rateLimitMany', async () => {
            return await this.scriptRateLimiter.rateLimitMany(possibleInvocations.map((x) => [x.insightsFunction.id, 1]))
        })

        const validInvocations: CyclotronJobInvocationInsightsFunction[] = []

        // Iterate over adding them to the list and updating their priority
        await Promise.all(
            possibleInvocations.map(async (item, index) => {
                try {
                    const rateLimit = rateLimits[index][1]
                    if (rateLimit.isRateLimited) {
                        counterRateLimited.labels({ kind: 'insights_function' }).inc()
                        // NOTE: We don't return here as we are just monitoring this feature currently
                        // this.insightsFunctionMonitoringService.queueAppMetric(
                        //     {
                        //         team_id: item.teamId,
                        //         app_source_id: item.functionId,
                        //         metric_kind: 'failure',
                        //         metric_name: 'rate_limited',
                        //         count: 1,
                        //     },
                        //     'insights_function'
                        // )
                        // return
                    }
                } catch (e) {
                    captureException(e)
                    logger.error('🔴', 'Error checking rate limit for custom function', { err: e })
                }

                const isQuotaLimited = await shouldBlockInvocationDueToQuota(item, {
                    hub: this.hub,
                    insightsFunctionMonitoringService: this.insightsFunctionMonitoringService,
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
                    this.insightsFunctionMonitoringService.queueAppMetric(
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
                    if (this.hub.CDP_OVERFLOW_QUEUE_ENABLED) {
                        item.queue = 'scriptoverflow'
                    }
                }

                validInvocations.push(item)
            })
        )

        // Now we can filter by masking configs
        const { masked, notMasked: notMaskedInvocations } = await this.scriptMasker.filterByMasking(validInvocations)

        this.insightsFunctionMonitoringService.queueAppMetrics(
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

        this.insightsFunctionMonitoringService.queueAppMetrics(triggeredInvocationsMetrics, 'insights_function')

        return notMaskedInvocations
    }

    /**
     * Finds all matching custom flows for the given globals.
     * Filters them for their disabled state as well as masking configs
     */
    @instrumented('cdpConsumer.handleEachBatch.queueMatchingFlows')
    protected async createInsightsFlowInvocations(
        invocationGlobals: InsightsFunctionInvocationGlobals[]
    ): Promise<CyclotronJobInvocation[]> {
        // TODO: Add back in group enrichment if necessary
        // await this.groupsManager.enrichGroups(invocationGlobals)

        const teamsToLoad = [...new Set(invocationGlobals.map((x) => x.project.id))]
        const insightsFlowsByTeam = await this.insightsFlowManager.getInsightsFlowsForTeams(teamsToLoad)

        const possibleInvocations = (
            await Promise.all(
                invocationGlobals.map(async (globals) => {
                    const teamInsightsFlows = insightsFlowsByTeam[globals.project.id]

                    const { invocations, metrics, logs } = await this.insightsFlowExecutor.buildInsightsFlowInvocations(
                        teamInsightsFlows,
                        globals
                    )

                    this.insightsFunctionMonitoringService.queueAppMetrics(metrics, 'insights_flow')
                    this.insightsFunctionMonitoringService.queueLogs(logs, 'insights_flow')
                    this.heartbeat()

                    return invocations
                })
            )
        ).flat()

        const states = await instrumentFn('cdpConsumer.handleEachBatch.scriptWatcher.getEffectiveStates', async () => {
            return await this.scriptWatcher.getEffectiveStates(possibleInvocations.map((x) => x.insightsFlow.id))
        })
        const rateLimits = await instrumentFn('cdpConsumer.handleEachBatch.scriptRateLimiter.rateLimitMany', async () => {
            return await this.scriptRateLimiter.rateLimitMany(possibleInvocations.map((x) => [x.insightsFlow.id, 1]))
        })
        const validInvocations: CyclotronJobInvocation[] = []

        // Iterate over adding them to the list and updating their priority
        await Promise.all(
            possibleInvocations.map(async (item, index) => {
                try {
                    const rateLimit = rateLimits[index][1]
                    if (rateLimit.isRateLimited) {
                        counterRateLimited.labels({ kind: 'insights_flow' }).inc()
                        this.insightsFunctionMonitoringService.queueAppMetric(
                            {
                                team_id: item.teamId,
                                app_source_id: item.functionId,
                                metric_kind: 'failure',
                                metric_name: 'rate_limited',
                                count: 1,
                            },
                            'insights_flow'
                        )
                        return
                    }
                } catch (e) {
                    captureException(e)
                    logger.error('🔴', 'Error checking rate limit for custom flow', { err: e })
                }

                // Check quota limits for workflow actions
                const isQuotaLimited = await shouldBlockInsightsFlowDueToQuota(item, {
                    hub: this.hub,
                    insightsFunctionMonitoringService: this.insightsFunctionMonitoringService,
                })

                if (isQuotaLimited) {
                    return
                }

                const state = states[item.insightsFlow.id].state
                if (state === ScriptWatcherState.disabled) {
                    this.insightsFunctionMonitoringService.queueAppMetric(
                        {
                            team_id: item.teamId,
                            app_source_id: item.functionId,
                            metric_kind: 'failure',
                            metric_name: 'disabled_permanently',
                            count: 1,
                        },
                        'insights_flow'
                    )
                    return
                }

                if (state === ScriptWatcherState.degraded) {
                    item.queuePriority = 2
                }

                validInvocations.push(item)
            })
        )

        // Now we can filter by masking configs
        const { masked, notMasked: notMaskedInvocations } = await this.scriptMasker.filterByMasking(validInvocations)

        this.insightsFunctionMonitoringService.queueAppMetrics(
            masked.map((item) => ({
                team_id: item.teamId,
                app_source_id: item.functionId,
                metric_kind: 'other',
                metric_name: 'masked',
                count: 1,
            })),
            'insights_flow'
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

        this.insightsFunctionMonitoringService.queueAppMetrics(triggeredInvocationsMetrics, 'insights_flow')

        return notMaskedInvocations
    }

    @instrumented('cdpConsumer.handleEachBatch.parseStreamMessages')
    public async _parseStreamBatch(messages: Message[]): Promise<InsightsFunctionInvocationGlobals[]> {
        const events: InsightsFunctionInvocationGlobals[] = []

        await Promise.all(
            messages.map(async (message) => {
                try {
                    const datastoreEvent = parseJSON(message.value!.toString()) as RawDatastoreEvent

                    const [teamInsightsFunctions, teamInsightsFlows, team] = await Promise.all([
                        this.insightsFunctionManager.getInsightsFunctionsForTeam(datastoreEvent.team_id, this.scriptTypes),
                        this.insightsFlowManager.getInsightsFlowsForTeam(datastoreEvent.team_id),
                        this.hub.teamManager.getTeam(datastoreEvent.team_id),
                    ])

                    if ((!teamInsightsFunctions.length && !teamInsightsFlows.length) || !team) {
                        return
                    }

                    events.push(convertToInsightsFunctionInvocationGlobals(datastoreEvent, team, this.hub.SITE_URL))
                } catch (e) {
                    logger.error('Error parsing message', e)
                    counterParseError.labels({ error: e.message }).inc()
                }
            })
        )

        return events
    }

    public async start(): Promise<void> {
        await super.start()
        // Make sure we are ready to produce to cyclotron first
        await this.cyclotronJobQueue.startAsProducer()
        // Start consuming messages
        await this.streamConsumer.connect(async (messages) => {
            logger.info('🔁', `${this.name} - handling batch`, {
                size: messages.length,
            })

            return await instrumentFn('cdpConsumer.handleEachBatch', async () => {
                const invocationGlobals = await this._parseStreamBatch(messages)
                const { backgroundTask } = await this.processBatch(invocationGlobals)

                return { backgroundTask }
            })
        })
    }

    public async stop(): Promise<void> {
        logger.info('💤', 'Stopping consumer...')
        await this.streamConsumer.disconnect()
        logger.info('💤', 'Stopping cyclotron job queue...')
        await this.cyclotronJobQueue.stop()
        logger.info('💤', 'Stopping consumer...')
        // IMPORTANT: super always comes last
        await super.stop()
        logger.info('💤', 'Consumer stopped!')
    }

    public isHealthy(): HealthCheckResult {
        return this.streamConsumer.isHealthy()
    }
}
