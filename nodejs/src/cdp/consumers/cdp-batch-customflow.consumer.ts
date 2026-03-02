import { Message } from 'node-rdkafka'

import { instrumentFn, instrumented } from '~/common/tracing/tracing-utils'
import { KAFKA_CDP_BATCH_CUSTOMFLOW_REQUESTS } from '~/config/kafka-topics'
import { CustomFlow } from '~/schema/customflow'
import { ClickHouseRouter } from '~/utils/db/clickhouse'
import { parseJSON } from '~/utils/json-parse'
import { captureException } from '~/utils/insights'
import { ClickHousePersonRepository } from '~/worker/ingestion/persons/repositories/clickhouse-person-repository'

import { KafkaConsumer } from '../../kafka/consumer'
import { HealthCheckResult, Hub, PersonPropertyFilter, Team } from '../../types'
import { logger } from '../../utils/logger'
import { UUIDT } from '../../utils/utils'
import { CyclotronJobQueue } from '../services/job-queue/job-queue'
import { PersonsManagerService } from '../services/managers/persons-manager.service'
import { ScriptRateLimiterService } from '../services/monitoring/script-rate-limiter.service'
import { CyclotronJobInvocation, CustomFunctionFilters } from '../types'
import { convertBatchCustomFlowRequestToCustomFunctionInvocationGlobals } from '../utils'
import { convertToCustomFunctionFilterGlobal } from '../utils/custom-function-filtering'
import { CdpConsumerBase } from './cdp-base.consumer'
import { counterParseError } from './metrics'

export interface BatchCustomFlowRequest {
    teamId: number
    customFlowId: CustomFlow['id']
    parentRunId: string
    filters: Pick<CustomFunctionFilters, 'properties' | 'filter_test_accounts'>
}

export interface BatchCustomFlowRequestMessage {
    batchCustomFlowRequest: BatchCustomFlowRequest
    team: Team
    customFlow: CustomFlow
}

export class CdpBatchCustomFlowRequestsConsumer extends CdpConsumerBase {
    protected name = 'CdpBatchCustomFlowRequestsConsumer'
    private cyclotronJobQueue: CyclotronJobQueue
    protected kafkaConsumer: KafkaConsumer

    private scriptRateLimiter: ScriptRateLimiterService

    private clickHouseRouter: ClickHouseRouter
    private clickHousePersonsRepository: ClickHousePersonRepository
    private clickHousePersonsManager: PersonsManagerService

    constructor(
        hub: Hub,
        topic: string = KAFKA_CDP_BATCH_CUSTOMFLOW_REQUESTS,
        groupId: string = 'cdp-batch-customflow-requests-consumer'
    ) {
        super(hub)
        this.cyclotronJobQueue = new CyclotronJobQueue(hub, 'customflow')
        this.kafkaConsumer = new KafkaConsumer({ groupId, topic })
        this.scriptRateLimiter = new ScriptRateLimiterService(hub, this.redis)

        this.clickHouseRouter = new ClickHouseRouter(hub)
        this.clickHousePersonsRepository = new ClickHousePersonRepository(this.clickHouseRouter)
        this.clickHousePersonsManager = new PersonsManagerService(this.clickHousePersonsRepository)
    }

    private createCustomFlowInvocation({
        parentRunId,
        customFlow,
        team,
        personId,
        distinctId,
        defaultVariables,
    }: {
        parentRunId: string
        customFlow: CustomFlow
        team: Team
        personId: string
        distinctId: string
        defaultVariables: Record<string, any>
    }): CyclotronJobInvocation {
        const invocationGlobals = convertBatchCustomFlowRequestToCustomFunctionInvocationGlobals({
            team: team,
            personId: personId,
            distinctId: distinctId,
            siteUrl: this.hub.SITE_URL,
        })

        const filterGlobals = convertToCustomFunctionFilterGlobal(invocationGlobals)

        const invocation = {
            id: new UUIDT().toString(),
            state: {
                event: invocationGlobals.event,
                actionStepCount: 0,
                variables: defaultVariables,
            },
            teamId: customFlow.team_id,
            functionId: customFlow.id,
            parentRunId,
            customFlow,
            person: invocationGlobals.person,
            filterGlobals,
            queue: 'customflow' as const,
            queuePriority: 1,
        }
        return invocation
    }

    /**
     * Finds all matching persons for the given globals.
     * Filters them based on the customflow's masking configs
     */
    @instrumented('cdpProducer.generateBatch.queueMatchingPersons')
    protected async createCustomFlowInvocations(
        batchCustomFlowRequestMessage: BatchCustomFlowRequestMessage
    ): Promise<CyclotronJobInvocation[]> {
        const { batchCustomFlowRequest, team, customFlow } = batchCustomFlowRequestMessage
        const { filters } = batchCustomFlowRequest

        if (!filters.properties || !filters.properties.length) {
            logger.error('Batch CustomFlow request missing property filters', { batchCustomFlowRequest })
            return []
        }

        const matchingPersonsCount = await instrumentFn(
            'cdpProducer.generateBatch.queueMatchingPersons.matchingPersonsCount',
            async () => {
                return await this.clickHousePersonsManager.countMany({
                    teamId: team.id,
                    properties: (filters.properties as PersonPropertyFilter[]) || [],
                })
            }
        )

        logger.info(
            '📝',
            `Found ${matchingPersonsCount} matching persons for batch CustomFlow run ${batchCustomFlowRequest.parentRunId}`
        )

        // Build default variables from customFlow
        const defaultVariables =
            customFlow.variables?.reduce(
                (acc, variable) => {
                    acc[variable.key] = variable.default || null
                    return acc
                },
                {} as Record<string, any>
            ) || {}

        const invocations: CyclotronJobInvocation[] = []
        await instrumentFn('cdpProducer.generateBatch.queueMatchingPersons.paginatePersons', async () => {
            await this.clickHousePersonsManager.streamMany({
                filters: {
                    teamId: team.id,
                    properties: (filters.properties as PersonPropertyFilter[]) || [],
                },
                onPersonBatch: async (persons: { personId: string; distinctId: string }[]) => {
                    const batchInvocations = persons.map(({ personId, distinctId }) =>
                        this.createCustomFlowInvocation({
                            parentRunId: batchCustomFlowRequest.parentRunId,
                            customFlow,
                            team,
                            personId,
                            distinctId,
                            defaultVariables,
                        })
                    )

                    invocations.push(...batchInvocations)
                    return Promise.resolve()
                },
            })
        })

        return invocations
    }

    private async processBatchCustomFlowRequest(
        batchCustomFlowRequests: BatchCustomFlowRequestMessage[]
    ): Promise<{ backgroundTask: Promise<any>; invocations: CyclotronJobInvocation[] }> {
        if (batchCustomFlowRequests.length > 1) {
            logger.warn(
                '🔁',
                `Processing multiple ${batchCustomFlowRequests.length} custom flow requests. This is NOT recommended due to potential fanout. Batch size is set by CDP_BATCH_WORKFLOW_PRODUCER_BATCH_SIZE`
            )
        }

        const invocationsToBeQueued = [
            ...(
                await Promise.all(batchCustomFlowRequests.map((request) => this.createCustomFlowInvocations(request)))
            ).flat(),
        ]

        logger.info('📝', `Created ${invocationsToBeQueued.length} custom flow invocations to be queued`)

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

    private async processBatch(
        batchCustomFlowRequests: BatchCustomFlowRequestMessage[]
    ): Promise<{ backgroundTask: Promise<any>; invocations: CyclotronJobInvocation[] }> {
        if (!batchCustomFlowRequests.length) {
            return { backgroundTask: Promise.resolve(), invocations: [] }
        }

        return await instrumentFn('cdpConsumer.processBatchCustomFlowRequest', async () => {
            return await this.processBatchCustomFlowRequest(batchCustomFlowRequests)
        })
    }

    @instrumented('cdpConsumer.handleEachBatch.parseKafkaMessages')
    public async _parseKafkaBatch(messages: Message[]): Promise<BatchCustomFlowRequestMessage[]> {
        const batchCustomFlowRequests: BatchCustomFlowRequestMessage[] = []

        await Promise.all(
            messages.map(async (message) => {
                try {
                    const batchCustomFlowRequest = parseJSON(message.value!.toString()) as BatchCustomFlowRequest

                    const [teamCustomFlow, team] = await Promise.all([
                        this.customFlowManager.getCustomFlow(batchCustomFlowRequest.customFlowId),
                        this.hub.teamManager.getTeam(batchCustomFlowRequest.teamId),
                    ])

                    if (!teamCustomFlow || !team) {
                        logger.error('Batch CustomFlow request references missing team or customflow', {
                            batchCustomFlowRequest,
                        })
                        return
                    }

                    if (teamCustomFlow.status !== 'active') {
                        logger.info('Skipping inactive CustomFlow for batch request', { batchCustomFlowRequest })
                        return
                    }

                    batchCustomFlowRequests.push({
                        batchCustomFlowRequest,
                        team,
                        customFlow: teamCustomFlow,
                    })
                } catch (e) {
                    logger.error('Error parsing message', e)
                    counterParseError.labels({ error: e.message }).inc()
                }
            })
        )

        return batchCustomFlowRequests
    }

    public async start(): Promise<void> {
        await super.start()
        // Make sure we are ready to produce to cyclotron first
        await this.cyclotronJobQueue.startAsProducer()
        // Connect to ClickHouse
        this.clickHouseRouter.initialize()
        // Start consuming messages
        await this.kafkaConsumer.connect(async (messages) => {
            logger.info('🔁', `${this.name} - handling batch`, {
                size: messages.length,
            })

            return await instrumentFn('cdpConsumer.handleEachBatch', async () => {
                const batchCustomFlowRequestMessages = await this._parseKafkaBatch(messages)
                const { backgroundTask } = await this.processBatch(batchCustomFlowRequestMessages)

                return { backgroundTask }
            })
        })
    }

    public async stop(): Promise<void> {
        logger.info('💤', 'Stopping consumer...')
        await this.kafkaConsumer.disconnect()
        logger.info('💤', 'Stopping cyclotron job queue...')
        await this.cyclotronJobQueue.stop()
        logger.info('💤', 'Stopping ClickHouse router...')
        await this.clickHouseRouter.close()
        logger.info('💤', 'Stopping consumer...')
        // IMPORTANT: super always comes last
        await super.stop()
        logger.info('💤', 'Consumer stopped!')
    }

    public isHealthy(): HealthCheckResult {
        return this.kafkaConsumer.isHealthy()
    }
}
