import { Message } from 'node-rdkafka'

import { KAFKA_CDP_INTERNAL_EVENTS } from '~/common/config/kafka-topics'
import { KafkaConsumerInterface, createKafkaConsumer } from '~/common/kafka/consumer'
import { instrumentFn, instrumented } from '~/common/tracing/tracing-utils'
import { parseJSON } from '~/common/utils/json-parse'
import { logger } from '~/common/utils/logger'
import { captureException } from '~/common/utils/insights'

import { HealthCheckResult, PluginsServerConfig } from '../../types'
import { CdpInternalEventSchema } from '../schema'
import { InsightsFunctionInvocationPipeline } from '../services/script-function-invocation-pipeline.service'
import { JobQueue } from '../services/job-queue/job-queue.interface'
import { CyclotronJobInvocation, InsightsFunctionInvocationGlobals, InsightsFunctionTypeType } from '../types'
import { convertInternalEventToInsightsFunctionInvocationGlobals } from '../utils'
import { CdpConsumerBase, CdpConsumerBaseDeps } from './cdp-base.consumer'
import { counterParseError } from './metrics'

export class CdpInternalEventsConsumer extends CdpConsumerBase {
    protected name = 'CdpInternalEventsConsumer'
    protected hogTypes: InsightsFunctionTypeType[] = ['internal_destination']

    protected hogQueue: JobQueue
    protected kafkaConsumer: KafkaConsumerInterface
    private insightsFunctionPipeline: InsightsFunctionInvocationPipeline

    constructor(config: PluginsServerConfig, deps: CdpConsumerBaseDeps, hogQueue: JobQueue) {
        super(config, deps)
        this.hogQueue = hogQueue
        this.kafkaConsumer = createKafkaConsumer({
            groupId: 'cdp-internal-events-consumer',
            topic: KAFKA_CDP_INTERNAL_EVENTS,
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
            filterFn: () => true,
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
        const events: InsightsFunctionInvocationGlobals[] = []
        await Promise.all(
            messages.map(async (message) => {
                try {
                    const kafkaEvent = parseJSON(message.value!.toString()) as unknown
                    const event = CdpInternalEventSchema.parse(kafkaEvent)

                    const [teamInsightsFunctions, team] = await Promise.all([
                        this.insightsFunctionManager.getInsightsFunctionsForTeam(event.team_id, this.hogTypes),
                        this.deps.teamManager.getTeam(event.team_id),
                    ])

                    if (!teamInsightsFunctions.length || !team) {
                        return
                    }

                    events.push(convertInternalEventToInsightsFunctionInvocationGlobals(event, team, this.config.SITE_URL))
                } catch (e) {
                    logger.error('Error parsing message', e)
                    counterParseError.labels({ error: e.message }).inc()
                }
            })
        )

        return events
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
