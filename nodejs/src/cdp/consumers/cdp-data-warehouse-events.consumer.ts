import { DateTime } from 'luxon'
import { Message } from 'node-rdkafka'

import { KafkaConsumerInterface, createKafkaConsumer } from '~/common/kafka/consumer'
import { instrumentFn, instrumented } from '~/common/tracing/tracing-utils'
import { parseJSON } from '~/common/utils/json-parse'
import { logger } from '~/common/utils/logger'
import { captureException } from '~/common/utils/insights'

import { HealthCheckResult, PluginsServerConfig, Team } from '../../types'
import { CdpDataWarehouseEvent, CdpDataWarehouseEventSchema } from '../schema'
import { InsightsFlowInvocationPipeline } from '../services/script-flow-invocation-pipeline.service'
import { InsightsFunctionInvocationPipeline } from '../services/script-function-invocation-pipeline.service'
import { JobQueue } from '../services/job-queue/job-queue.interface'
import { CyclotronJobInvocation, InsightsFunctionInvocationGlobals, InsightsFunctionTypeType } from '../types'
import { CdpConsumerBase, CdpConsumerBaseDeps } from './cdp-base.consumer'
import { counterParseError } from './metrics'

// Synthetic event name stamped on the synthetic event built for a warehouse-row trigger.
// Acts as the "this globals object originated from a synced warehouse row" discriminator.
export const WAREHOUSE_SOURCE_ROW_EVENT = '$warehouse_source_row'

// Special property on the synthetic event holding the dot-notated source table name.
// Used by the pipeline's eligibility predicate to match warehouse-table InsightsFlow triggers
// against the row's source table without adding a top-level field to globals.
export const DWH_SOURCE_TABLE_PROPERTY = '$source_table'

export class CdpDatawarehouseEventsConsumer extends CdpConsumerBase {
    protected name = 'CdpDatawarehouseEventsConsumer'
    protected hogTypes: InsightsFunctionTypeType[] = ['destination']

    protected hogQueue: JobQueue
    protected hogflowQueue: JobQueue
    protected kafkaConsumer: KafkaConsumerInterface
    private insightsFunctionPipeline: InsightsFunctionInvocationPipeline
    private hogFlowPipeline: InsightsFlowInvocationPipeline

    constructor(
        config: PluginsServerConfig,
        deps: CdpConsumerBaseDeps,
        jobQueues: { hogQueue: JobQueue; hogflowQueue: JobQueue }
    ) {
        super(config, deps)
        this.hogQueue = jobQueues.hogQueue
        this.hogflowQueue = jobQueues.hogflowQueue
        this.kafkaConsumer = createKafkaConsumer({
            groupId: 'cdp-data-warehouse-events-consumer',
            topic: 'cdp_data_warehouse_source_table',
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
        this.hogFlowPipeline = new InsightsFlowInvocationPipeline(config, {
            hogFlowManager: this.hogFlowManager,
            hogFlowExecutor: this.hogFlowExecutor,
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

        // Warehouse rows carry no `$groups` property — group enrichment is a no-op here, so we skip the
        // call entirely to avoid the per-batch group-types lookup.

        const [hogInvocations, hogflowInvocations] = await Promise.all([
            this.insightsFunctionPipeline.buildInvocations(invocationGlobals, {
                hogTypes: this.hogTypes,
                filterFn: (fn) => (fn.filters?.source ?? 'events') === 'data-warehouse-table',
            }),
            // Source-compatibility matching lives in the consumer rather than the executor — the
            // consumer knows it's serving warehouse rows, so it filters flows to only those whose
            // trigger.table_name matches the row's $source_table property. The executor then just
            // evaluates filter bytecode on the matched flows.
            this.hogFlowPipeline.buildInvocations(invocationGlobals, {
                eligibilityFn: (flow, globals) =>
                    flow.trigger.type === 'data-warehouse-table' &&
                    flow.trigger.table_name === globals.event?.properties?.[DWH_SOURCE_TABLE_PROPERTY],
            }),
        ])

        const invocationsToBeQueued = [...hogInvocations, ...hogflowInvocations]

        // Emit a `running` lifecycle row for each freshly-created invocation so the runs UI shows
        // warehouse-triggered flows as in-flight (matching the event consumer). The terminal row is
        // queued later by the cyclotron worker; both collapse under the same `invocation_id` via
        // ReplacingMergeTree, with the terminal row's later `version` superseding the running row.
        for (const invocation of invocationsToBeQueued) {
            this.invocationResultsService.invocationResultsRowsService.queueLifecycleRow(invocation, 'running')
        }

        return {
            backgroundTask: Promise.all([
                instrumentFn({ key: 'cdp.background_task.queue_hog_invocations', sendException: false }, () =>
                    this.hogQueue.queueInvocations(hogInvocations)
                ),
                instrumentFn({ key: 'cdp.background_task.queue_hogflow_invocations', sendException: false }, () =>
                    this.hogflowQueue.queueInvocations(hogflowInvocations)
                ),
                instrumentFn({ key: 'cdp.background_task.monitoring_flush', sendException: false }, async () => {
                    try {
                        await this.insightsFunctionMonitoringService.flush()
                    } catch (err) {
                        captureException(err)
                        logger.error('🔴', 'Error producing queued messages for monitoring', { err })
                    }
                }),
                instrumentFn({ key: 'cdp.background_task.lifecycle_running_flush', sendException: false }, () =>
                    this.invocationResultsService.invocationResultsRowsService.flush()
                ),
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
                    const event = CdpDataWarehouseEventSchema.parse(kafkaEvent)

                    const [teamInsightsFunctions, teamInsightsFlows, team] = await Promise.all([
                        this.insightsFunctionManager.getInsightsFunctionsForTeam(event.team_id, this.hogTypes),
                        this.hogFlowManager.getInsightsFlowsForTeam(event.team_id),
                        this.deps.teamManager.getTeam(event.team_id),
                    ])

                    if ((!teamInsightsFunctions.length && !teamInsightsFlows.length) || !team) {
                        return
                    }

                    events.push(
                        convertDataWarehouseEventToInsightsFunctionInvocationGlobals(event, team, this.config.SITE_URL)
                    )
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
        await Promise.all([this.hogQueue.startAsProducer(), this.hogflowQueue.startAsProducer()])
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
        await Promise.all([this.hogQueue.stopProducer(), this.hogflowQueue.stopProducer()])
        await super.stop()
    }

    public isHealthy(): HealthCheckResult {
        return this.kafkaConsumer.isHealthy()
    }
}

function convertDataWarehouseEventToInsightsFunctionInvocationGlobals(
    event: CdpDataWarehouseEvent,
    team: Team,
    siteUrl: string
): InsightsFunctionInvocationGlobals {
    const data = event.properties
    const projectUrl = `${siteUrl}/project/${team.id}`

    // The synthetic event carries:
    //   - the producer's deterministic per-row id (CDPProducer._build_event_id) as the uuid, so
    //     billing dedup (keyed on event.uuid) counts each row distinctly and stably across re-runs
    //   - `$warehouse_source_row` as the event name so downstream code can identify warehouse-row globals
    //   - the dot-notated source table name on `properties.$source_table` so consumers can match
    //     warehouse-table InsightsFlow triggers without a new top-level field on globals
    return {
        project: {
            id: team.id,
            name: team.name,
            url: projectUrl,
        },
        event: {
            uuid: event.event_id,
            event: WAREHOUSE_SOURCE_ROW_EVENT,
            elements_chain: '', // Not applicable but left here for compatibility
            distinct_id: 'data-warehouse-table-distinct-id-do-not-use',
            properties: {
                ...data,
                [DWH_SOURCE_TABLE_PROPERTY]: event.table_name ?? '',
            },
            timestamp: DateTime.now().toISO(),
            url: '',
        },
    }
}
