import { Message } from 'node-rdkafka'

import { KAFKA_PERSON } from '~/common/config/kafka-topics'
import { KafkaConsumerInterface, createKafkaConsumer } from '~/common/kafka/consumer'
import { instrumentFn, instrumented } from '~/common/tracing/tracing-utils'
import { parseJSON } from '~/common/utils/json-parse'
import { logger } from '~/common/utils/logger'
import { captureException } from '~/common/utils/insights'
import { UUIDT } from '~/common/utils/utils'

import { DatastorePerson, HealthCheckResult, PluginsServerConfig, Team } from '../../types'
import { InsightsFunctionInvocationPipeline } from '../services/script-function-invocation-pipeline.service'
import { JobQueue } from '../services/job-queue/job-queue.interface'
import { CyclotronJobInvocation, CyclotronPerson, InsightsFunctionInvocationGlobals, InsightsFunctionTypeType } from '../types'
import { getPersonDisplayName } from '../utils'
import { CdpConsumerBase, CdpConsumerBaseDeps } from './cdp-base.consumer'
import { counterParseError } from './metrics'

export class CdpPersonUpdatesConsumer extends CdpConsumerBase {
    protected name = 'CdpPersonUpdatesConsumer'
    protected hogTypes: InsightsFunctionTypeType[] = ['destination']

    protected hogQueue: JobQueue
    protected kafkaConsumer: KafkaConsumerInterface
    private insightsFunctionPipeline: InsightsFunctionInvocationPipeline

    constructor(config: PluginsServerConfig, deps: CdpConsumerBaseDeps, hogQueue: JobQueue) {
        super(config, deps)
        this.hogQueue = hogQueue
        this.kafkaConsumer = createKafkaConsumer({
            groupId: 'cdp-person-updates-consumer',
            topic: KAFKA_PERSON,
        })
        this.insightsFunctionPipeline = new InsightsFunctionInvocationPipeline(config, {
            insightsFunctionManager: this.insightsFunctionManager,
            hogExecutor: this.hogExecutor,
            hogWatcher: this.hogWatcher,
            hogWatcherMirror: this.hogWatcherMirror,
            hogMasker: this.hogMasker,
            insightsFunctionMonitoringService: this.insightsFunctionMonitoringService,
            quotaLimiting: deps.quotaLimiting,
            redis: this.redis,
            valkeyShadow: this.valkeyShadow,
        })
    }

    public async processBatch(
        invocationGlobals: InsightsFunctionInvocationGlobals[]
    ): Promise<{ backgroundTask: Promise<any>; invocations: CyclotronJobInvocation[] }> {
        if (!invocationGlobals.length) {
            return { backgroundTask: Promise.resolve(), invocations: [] }
        }

        await this.groupsManager.addGroupsToGlobalsList(invocationGlobals)

        const invocationsToBeQueued = await this.insightsFunctionPipeline.buildInvocations(invocationGlobals, {
            hogTypes: this.hogTypes,
            filterFn: (fn) => fn.filters?.source === 'person-updates',
        })

        return {
            backgroundTask: Promise.all([
                instrumentFn({ key: 'cdp.background_task.queue_invocations', sendException: false }, () =>
                    this.hogQueue.queueInvocations(invocationsToBeQueued)
                ),
                instrumentFn({ key: 'cdp.background_task.monitoring_flush', sendException: false }, async () => {
                    try {
                        await this.insightsFunctionMonitoringService.flush()
                    } catch (err) {
                        captureException(err)
                        logger.error('🔴', 'Error producing queued messages for monitoring', { err })
                    }
                }),
            ]),
            invocations: invocationsToBeQueued,
        }
    }

    @instrumented('cdpConsumer.handleEachBatch.parseKafkaMessages')
    public async _parseKafkaBatch(messages: Message[]): Promise<InsightsFunctionInvocationGlobals[]> {
        const globals: InsightsFunctionInvocationGlobals[] = []
        await Promise.all(
            messages.map(async (message) => {
                try {
                    const data = parseJSON(message.value!.toString()) as DatastorePerson

                    const [teamInsightsFunctions, team] = await Promise.all([
                        this.insightsFunctionManager.getInsightsFunctionsForTeam(data.team_id, this.hogTypes),
                        this.deps.teamManager.getTeam(data.team_id),
                    ])

                    const filteredInsightsFunctions = teamInsightsFunctions.filter(
                        (fn) => fn.filters?.source === 'person-updates'
                    )

                    if (!filteredInsightsFunctions.length || !team) {
                        return
                    }

                    globals.push(convertDatastorePersonToInvocationGlobals(data, team, this.config.SITE_URL))
                } catch (e) {
                    logger.error('Error parsing message', e)
                    counterParseError.labels({ error: e.message }).inc()
                }
            })
        )

        return globals
    }

    public override async start(): Promise<void> {
        await super.start()
        await this.hogQueue.startAsProducer()
        await this.kafkaConsumer.connect(async (messages) => {
            logger.info('🔁', `${this.name} - handling batch`, { size: messages.length })
            return await instrumentFn('cdpConsumer.handleEachBatch', async () => {
                const invocationGlobals = await this._parseKafkaBatch(messages)
                const { backgroundTask } = await this.processBatch(invocationGlobals)
                return { backgroundTask }
            })
        })
    }

    public override async stop(): Promise<void> {
        logger.info('💤', 'Stopping consumer...')
        await this.kafkaConsumer.disconnect()
        await this.hogQueue.stopProducer()
        await super.stop()
    }

    public isHealthy(): HealthCheckResult {
        return this.kafkaConsumer.isHealthy()
    }
}

function convertDatastorePersonToInvocationGlobals(
    data: DatastorePerson,
    team: Team,
    siteUrl: string
): InsightsFunctionInvocationGlobals {
    const projectUrl = `${siteUrl}/project/${team.id}`

    const person: CyclotronPerson = {
        id: data.id,
        properties: parseJSON(data.properties),
        name: '',
        url: '',
    }

    person.name = getPersonDisplayName(team, person.id, person.properties)
    person.url = `${projectUrl}/person/${person.id}`

    const context: InsightsFunctionInvocationGlobals = {
        project: {
            id: team.id,
            name: team.name,
            url: projectUrl,
        },
        event: {
            uuid: new UUIDT().toString(),
            event: '$person_updated',
            distinct_id: person.id,
            properties: {},
            timestamp: data.timestamp,
            url: person.url,
            elements_chain: '',
        },
        person,
    }

    return context
}
