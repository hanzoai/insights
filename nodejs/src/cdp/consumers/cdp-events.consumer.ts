import { Message } from 'node-rdkafka'

import { instrumentFn, instrumented } from '~/common/tracing/tracing-utils'

import { convertToCustomFunctionInvocationGlobals } from '../../cdp/utils'
import { KAFKA_EVENTS_JSON } from '../../config/kafka-topics'
import { KafkaConsumer } from '../../kafka/consumer'
import { HealthCheckResult, Hub, PluginsServerConfig, RawClickHouseEvent } from '../../types'
import { parseJSON } from '../../utils/json-parse'
import { logger } from '../../utils/logger'
import { captureException } from '../../utils/insights'
import { shouldBlockCustomFlowDueToQuota } from '../services/customflows/customflow-quota-limiting'
import { CyclotronJobQueue } from '../services/job-queue/job-queue'
import { ScriptRateLimiterService, ScriptRateLimiterServiceHub } from '../services/monitoring/script-rate-limiter.service'
import { ScriptWatcherState } from '../services/monitoring/script-watcher.service'
import {
    CyclotronJobInvocation,
    CyclotronJobInvocationCustomFunction,
    CustomFunctionInvocationGlobals,
    CustomFunctionType,
    CustomFunctionTypeType,
    MinimalAppMetric,
} from '../types'
import { CdpConsumerBase, CdpConsumerBaseHub } from './cdp-base.consumer'
import { counterCustomFunctionStateOnEvent, counterParseError, counterRateLimited } from './metrics'
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
    protected scriptTypes: CustomFunctionTypeType[] = ['destination']
    private cyclotronJobQueue: CyclotronJobQueue
    protected kafkaConsumer: KafkaConsumer

    private scriptRateLimiter: ScriptRateLimiterService

    constructor(hub: THub, topic: string = KAFKA_EVENTS_JSON, groupId: string = 'cdp-processed-events-consumer') {
        super(hub)
        this.cyclotronJobQueue = new CyclotronJobQueue(hub, 'custom_script')
        this.kafkaConsumer = new KafkaConsumer({ groupId, topic })
        this.scriptRateLimiter = new ScriptRateLimiterService(hub, this.redis)
    }

    public async processBatch(
        invocationGlobals: CustomFunctionInvocationGlobals[]
    ): Promise<{ backgroundTask: Promise<any>; invocations: CyclotronJobInvocation[] }> {
        if (!invocationGlobals.length) {
            return { backgroundTask: Promise.resolve(), invocations: [] }
        }

        const invocationsToBeQueued = [
            ...(await this.createCustomFunctionInvocations(invocationGlobals)),
            ...(await this.createCustomFlowInvocations(invocationGlobals)),
        ]

        return {
            // This is all IO so we can set them off in the background and start processing the next batch
            backgroundTask: Promise.all([
                this.cyclotronJobQueue.queueInvocations(invocationsToBeQueued),
                this.customFunctionMonitoringService.flush().catch((err) => {
                    captureException(err)
                    logger.error('🔴', 'Error producing queued messages for monitoring', { err })
                }),
            ]),
            invocations: invocationsToBeQueued,
        }
    }

    protected filterCustomFunction(customFunction: CustomFunctionType): boolean {
        // By default we filter for those with no filters or filters specifically for events
        return (customFunction.filters?.source ?? 'events') === 'events'
    }

    /**
     * Finds all matching custom functions for the given globals.
     * Filters them for their disabled state as well as masking configs
     */
    @instrumented('cdpConsumer.handleEachBatch.queueMatchingFunctions')
    protected async createCustomFunctionInvocations(
        invocationGlobals: CustomFunctionInvocationGlobals[]
    ): Promise<CyclotronJobInvocation[]> {
        // TODO: Add a helper to custom functions to determine if they require groups or not and then only load those
        await this.groupsManager.enrichGroups(invocationGlobals)

        const teamsToLoad = [...new Set(invocationGlobals.map((x) => x.project.id))]
        const customFunctionsByTeam = await this.customFunctionManager.getCustomFunctionsForTeams(
            teamsToLoad,
            this.scriptTypes,
            this.filterCustomFunction
        )

        const possibleInvocations = (
            await Promise.all(
                invocationGlobals.map(async (globals) => {
                    const teamCustomFunctions = customFunctionsByTeam[globals.project.id]

                    const { invocations, metrics, logs } = await this.scriptExecutor.buildCustomFunctionInvocations(
                        teamCustomFunctions,
                        globals
                    )

                    this.customFunctionMonitoringService.queueAppMetrics(metrics, 'custom_function')
                    this.customFunctionMonitoringService.queueLogs(logs, 'custom_function')
                    this.heartbeat()

                    return invocations
                })
            )
        ).flat()

        const states = await instrumentFn('cdpConsumer.handleEachBatch.scriptWatcher.getEffectiveStates', async () => {
            return await this.scriptWatcher.getEffectiveStates(possibleInvocations.map((x) => x.customFunction.id))
        })
        const rateLimits = await instrumentFn('cdpConsumer.handleEachBatch.scriptRateLimiter.rateLimitMany', async () => {
            return await this.scriptRateLimiter.rateLimitMany(possibleInvocations.map((x) => [x.customFunction.id, 1]))
        })

        const validInvocations: CyclotronJobInvocationCustomFunction[] = []

        // Iterate over adding them to the list and updating their priority
        await Promise.all(
            possibleInvocations.map(async (item, index) => {
                try {
                    const rateLimit = rateLimits[index][1]
                    if (rateLimit.isRateLimited) {
                        counterRateLimited.labels({ kind: 'custom_function' }).inc()
                        // NOTE: We don't return here as we are just monitoring this feature currently
                        // this.customFunctionMonitoringService.queueAppMetric(
                        //     {
                        //         team_id: item.teamId,
                        //         app_source_id: item.functionId,
                        //         metric_kind: 'failure',
                        //         metric_name: 'rate_limited',
                        //         count: 1,
                        //     },
                        //     'custom_function'
                        // )
                        // return
                    }
                } catch (e) {
                    captureException(e)
                    logger.error('🔴', 'Error checking rate limit for custom function', { err: e })
                }

                const isQuotaLimited = await shouldBlockInvocationDueToQuota(item, {
                    hub: this.hub,
                    customFunctionMonitoringService: this.customFunctionMonitoringService,
                })

                if (isQuotaLimited) {
                    return
                }

                const state = states[item.customFunction.id].state

                counterCustomFunctionStateOnEvent
                    .labels({
                        state: ScriptWatcherState[state],
                        kind: item.customFunction.type,
                    })
                    .inc()

                if (state === ScriptWatcherState.disabled) {
                    this.customFunctionMonitoringService.queueAppMetric(
                        {
                            team_id: item.teamId,
                            app_source_id: item.functionId,
                            metric_kind: 'failure',
                            metric_name: 'disabled_permanently',
                            count: 1,
                        },
                        'custom_function'
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

        this.customFunctionMonitoringService.queueAppMetrics(
            masked.map((item) => ({
                team_id: item.teamId,
                app_source_id: item.functionId,
                metric_kind: 'other',
                metric_name: 'masked',
                count: 1,
            })),
            'custom_function'
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
            if (item.customFunction.type === 'destination') {
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

        this.customFunctionMonitoringService.queueAppMetrics(triggeredInvocationsMetrics, 'custom_function')

        return notMaskedInvocations
    }

    /**
     * Finds all matching custom flows for the given globals.
     * Filters them for their disabled state as well as masking configs
     */
    @instrumented('cdpConsumer.handleEachBatch.queueMatchingFlows')
    protected async createCustomFlowInvocations(
        invocationGlobals: CustomFunctionInvocationGlobals[]
    ): Promise<CyclotronJobInvocation[]> {
        // TODO: Add back in group enrichment if necessary
        // await this.groupsManager.enrichGroups(invocationGlobals)

        const teamsToLoad = [...new Set(invocationGlobals.map((x) => x.project.id))]
        const customFlowsByTeam = await this.customFlowManager.getCustomFlowsForTeams(teamsToLoad)

        const possibleInvocations = (
            await Promise.all(
                invocationGlobals.map(async (globals) => {
                    const teamCustomFlows = customFlowsByTeam[globals.project.id]

                    const { invocations, metrics, logs } = await this.customFlowExecutor.buildCustomFlowInvocations(
                        teamCustomFlows,
                        globals
                    )

                    this.customFunctionMonitoringService.queueAppMetrics(metrics, 'custom_flow')
                    this.customFunctionMonitoringService.queueLogs(logs, 'custom_flow')
                    this.heartbeat()

                    return invocations
                })
            )
        ).flat()

        const states = await instrumentFn('cdpConsumer.handleEachBatch.scriptWatcher.getEffectiveStates', async () => {
            return await this.scriptWatcher.getEffectiveStates(possibleInvocations.map((x) => x.customFlow.id))
        })
        const rateLimits = await instrumentFn('cdpConsumer.handleEachBatch.scriptRateLimiter.rateLimitMany', async () => {
            return await this.scriptRateLimiter.rateLimitMany(possibleInvocations.map((x) => [x.customFlow.id, 1]))
        })
        const validInvocations: CyclotronJobInvocation[] = []

        // Iterate over adding them to the list and updating their priority
        await Promise.all(
            possibleInvocations.map(async (item, index) => {
                try {
                    const rateLimit = rateLimits[index][1]
                    if (rateLimit.isRateLimited) {
                        counterRateLimited.labels({ kind: 'custom_flow' }).inc()
                        this.customFunctionMonitoringService.queueAppMetric(
                            {
                                team_id: item.teamId,
                                app_source_id: item.functionId,
                                metric_kind: 'failure',
                                metric_name: 'rate_limited',
                                count: 1,
                            },
                            'custom_flow'
                        )
                        return
                    }
                } catch (e) {
                    captureException(e)
                    logger.error('🔴', 'Error checking rate limit for custom flow', { err: e })
                }

                // Check quota limits for workflow actions
                const isQuotaLimited = await shouldBlockCustomFlowDueToQuota(item, {
                    hub: this.hub,
                    customFunctionMonitoringService: this.customFunctionMonitoringService,
                })

                if (isQuotaLimited) {
                    return
                }

                const state = states[item.customFlow.id].state
                if (state === ScriptWatcherState.disabled) {
                    this.customFunctionMonitoringService.queueAppMetric(
                        {
                            team_id: item.teamId,
                            app_source_id: item.functionId,
                            metric_kind: 'failure',
                            metric_name: 'disabled_permanently',
                            count: 1,
                        },
                        'custom_flow'
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

        this.customFunctionMonitoringService.queueAppMetrics(
            masked.map((item) => ({
                team_id: item.teamId,
                app_source_id: item.functionId,
                metric_kind: 'other',
                metric_name: 'masked',
                count: 1,
            })),
            'custom_flow'
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

        this.customFunctionMonitoringService.queueAppMetrics(triggeredInvocationsMetrics, 'custom_flow')

        return notMaskedInvocations
    }

    @instrumented('cdpConsumer.handleEachBatch.parseKafkaMessages')
    public async _parseKafkaBatch(messages: Message[]): Promise<CustomFunctionInvocationGlobals[]> {
        const events: CustomFunctionInvocationGlobals[] = []

        await Promise.all(
            messages.map(async (message) => {
                try {
                    const clickHouseEvent = parseJSON(message.value!.toString()) as RawClickHouseEvent

                    const [teamCustomFunctions, teamCustomFlows, team] = await Promise.all([
                        this.customFunctionManager.getCustomFunctionsForTeam(clickHouseEvent.team_id, this.scriptTypes),
                        this.customFlowManager.getCustomFlowsForTeam(clickHouseEvent.team_id),
                        this.hub.teamManager.getTeam(clickHouseEvent.team_id),
                    ])

                    if ((!teamCustomFunctions.length && !teamCustomFlows.length) || !team) {
                        return
                    }

                    events.push(convertToCustomFunctionInvocationGlobals(clickHouseEvent, team, this.hub.SITE_URL))
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
        await this.kafkaConsumer.connect(async (messages) => {
            logger.info('🔁', `${this.name} - handling batch`, {
                size: messages.length,
            })

            return await instrumentFn('cdpConsumer.handleEachBatch', async () => {
                const invocationGlobals = await this._parseKafkaBatch(messages)
                const { backgroundTask } = await this.processBatch(invocationGlobals)

                return { backgroundTask }
            })
        })
    }

    public async stop(): Promise<void> {
        logger.info('💤', 'Stopping consumer...')
        await this.kafkaConsumer.disconnect()
        logger.info('💤', 'Stopping cyclotron job queue...')
        await this.cyclotronJobQueue.stop()
        logger.info('💤', 'Stopping consumer...')
        // IMPORTANT: super always comes last
        await super.stop()
        logger.info('💤', 'Consumer stopped!')
    }

    public isHealthy(): HealthCheckResult {
        return this.kafkaConsumer.isHealthy()
    }
}
