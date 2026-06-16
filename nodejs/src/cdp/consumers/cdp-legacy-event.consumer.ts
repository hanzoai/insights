import { Message } from 'node-rdkafka'
import { Counter } from 'prom-client'

import { LegacyPluginAppMetrics } from '~/cdp/legacy-plugins/app-metrics'
import { instrumentFn, instrumented } from '~/common/tracing/tracing-utils'

import { StreamConsumer } from '../../stream/consumer'
import { HealthCheckResult, Hub, ISOTimestamp, PostIngestionEvent, ProjectId, RawDatastoreEvent } from '../../types'
import { PostgresUse } from '../../utils/db/postgres'
import { parseJSON } from '../../utils/json-parse'
import { LazyLoader } from '../../utils/lazy-loader'
import { logger } from '../../utils/logger'
import { PromiseScheduler } from '../../utils/promise-scheduler'
import { LegacyWebhookService } from '../legacy-webhooks/legacy-webhook-service'
import { LegacyPluginExecutorService } from '../services/legacy-plugin-executor.service'
import {
    CyclotronJobInvocation,
    CyclotronJobInvocationInsightsFunction,
    InsightsFunctionInvocationGlobals,
    InsightsFunctionType,
} from '../types'
import { convertToInsightsFunctionInvocationGlobals } from '../utils'
import { createInvocation } from '../utils/invocation-utils'
import { CdpConsumerBase, CdpConsumerBaseHub } from './cdp-base.consumer'
import { counterParseError } from './metrics'

export type LightweightPluginConfig = {
    id: number
    team_id: number
    plugin_id: number
    enabled: boolean
    config: Record<string, unknown>
    created_at: string
    updated_at?: string
    plugin?: {
        id: number
        url: string
    }
}

type PluginConfigInsightsFunction = {
    pluginConfigId: number
    insightsFunction: InsightsFunctionType
}

const legacyPluginExecutionResultCounter = new Counter({
    name: 'cdp_legacy_event_consumer_execution_result_total',
    help: 'The number of times we have executed a legacy plugin',
    labelNames: ['result', 'template_id'],
})

/**
 * Hub type for CdpLegacyEventsConsumer.
 * Extends CdpConsumerBaseHub with legacy plugin-specific fields.
 */
export type CdpLegacyEventsConsumerHub = CdpConsumerBaseHub &
    Pick<
        Hub,
        | 'CDP_LEGACY_EVENT_CONSUMER_TOPIC'
        | 'CDP_LEGACY_EVENT_CONSUMER_GROUP_ID'
        | 'streamProducer'
        | 'APP_METRICS_FLUSH_FREQUENCY_MS'
        | 'APP_METRICS_FLUSH_MAX_QUEUE_SIZE'
        | 'teamManager'
        | 'SITE_URL'
        // LegacyWebhookService
        | 'groupTypeManager'
        | 'groupRepository'
    >

/**
 * This is a temporary consumer that hooks into the existing onevent consumer group
 * It currently just runs the same logic as the old one but with node-rdkafka as the consumer tech which should improve things
 * We can then use this to gradually move over to the new custom functions
 */
export class CdpLegacyEventsConsumer extends CdpConsumerBase<CdpLegacyEventsConsumerHub> {
    protected name = 'CdpLegacyEventsConsumer'
    protected promiseScheduler = new PromiseScheduler()
    protected streamConsumer: StreamConsumer

    private pluginConfigsLoader: LazyLoader<PluginConfigInsightsFunction[]>
    private legacyPluginExecutor: LegacyPluginExecutorService
    private legacyWebhookService: LegacyWebhookService

    private appMetrics: LegacyPluginAppMetrics

    constructor(hub: CdpLegacyEventsConsumerHub) {
        super(hub)

        this.streamConsumer = new StreamConsumer({
            groupId: hub.CDP_LEGACY_EVENT_CONSUMER_GROUP_ID,
            topic: hub.CDP_LEGACY_EVENT_CONSUMER_TOPIC,
        })

        this.legacyPluginExecutor = new LegacyPluginExecutorService(hub.postgres, hub.geoipService)
        this.legacyWebhookService = new LegacyWebhookService(hub)

        this.pluginConfigsLoader = new LazyLoader({
            name: 'plugin_config_insights_functions',
            loader: async (teamIds: string[]) => this.loadAndBuildInsightsFunctions(teamIds),
            refreshAgeMs: 600000, // 10 minutes
            refreshBackgroundAgeMs: 300000, // 5 minutes
            bufferMs: 10, // 10ms buffer for batching
        })

        this.appMetrics = new LegacyPluginAppMetrics(
            hub.streamProducer,
            hub.APP_METRICS_FLUSH_FREQUENCY_MS,
            hub.APP_METRICS_FLUSH_MAX_QUEUE_SIZE
        )
    }

    private async loadAndBuildInsightsFunctions(teamIds: string[]): Promise<Record<string, PluginConfigInsightsFunction[]>> {
        const { rows } = await this.hub.postgres.query(
            PostgresUse.COMMON_READ,
            `SELECT
                insights_pluginconfig.id,
                insights_pluginconfig.team_id,
                insights_pluginconfig.plugin_id,
                insights_pluginconfig.enabled,
                insights_pluginconfig.config,
                insights_pluginconfig.created_at,
                insights_pluginconfig.updated_at,
                insights_plugin.id as plugin__id,
                insights_plugin.url as plugin__url
            FROM insights_pluginconfig
            LEFT JOIN insights_plugin ON insights_plugin.id = insights_pluginconfig.plugin_id
            WHERE insights_pluginconfig.team_id = ANY($1)
                AND insights_pluginconfig.enabled = 't'
                AND (insights_pluginconfig.deleted IS NULL OR insights_pluginconfig.deleted != 't')
                AND insights_plugin.capabilities->'methods' @> '["onEvent"]'::jsonb`,
            [teamIds.map((id) => parseInt(id))],
            'loadPluginConfigInsightsFunctions'
        )

        // Load attachments for all plugin configs with non-empty config
        const pluginConfigIds = rows.filter((row) => Object.keys(row.config || {}).length > 0).map((row) => row.id)
        const attachmentsMap: Record<number, Record<string, any>> = {}

        if (pluginConfigIds.length > 0) {
            const { rows: attachmentRows } = await this.hub.postgres.query(
                PostgresUse.COMMON_READ,
                `SELECT plugin_config_id, key, contents
                FROM insights_pluginattachment
                WHERE plugin_config_id = ANY($1)`,
                [pluginConfigIds],
                'loadPluginConfigAttachments'
            )

            for (const attachmentRow of attachmentRows) {
                if (!attachmentsMap[attachmentRow.plugin_config_id]) {
                    attachmentsMap[attachmentRow.plugin_config_id] = {}
                }

                try {
                    // Convert Buffer to string if needed, then parse as JSON
                    let contentsString: string
                    if (Buffer.isBuffer(attachmentRow.contents)) {
                        contentsString = attachmentRow.contents.toString('utf-8')
                    } else if (typeof attachmentRow.contents === 'string') {
                        contentsString = attachmentRow.contents
                    } else {
                        // If it's already an object, use it directly
                        attachmentsMap[attachmentRow.plugin_config_id][attachmentRow.key] = attachmentRow.contents
                        continue
                    }

                    const contents = parseJSON(contentsString)
                    attachmentsMap[attachmentRow.plugin_config_id][attachmentRow.key] = contents
                } catch (error: any) {
                    logger.warn('Failed to parse attachment contents', {
                        pluginConfigId: attachmentRow.plugin_config_id,
                        key: attachmentRow.key,
                        error: error?.message,
                    })
                }
            }
        }

        // Group by team_id and build custom functions directly
        const results: Record<string, PluginConfigInsightsFunction[]> = {}

        for (const row of rows) {
            const teamId = row.team_id.toString()
            if (!results[teamId]) {
                results[teamId] = []
            }

            try {
                const insightsFunction = this.convertPluginConfigToInsightsFunction(
                    {
                        id: row.id,
                        team_id: row.team_id,
                        plugin_id: row.plugin_id,
                        enabled: row.enabled === 't',
                        config: row.config,
                        created_at: row.created_at,
                        updated_at: row.updated_at,
                        plugin: row.plugin__url
                            ? {
                                  id: row.plugin__id,
                                  url: row.plugin__url,
                              }
                            : undefined,
                    },
                    attachmentsMap[row.id]
                )

                if (insightsFunction) {
                    results[teamId].push({
                        pluginConfigId: row.id,
                        insightsFunction,
                    })
                }
            } catch (error: any) {
                logger.warn('Failed to convert plugin config to custom function', {
                    pluginConfigId: row.id,
                    error: error?.message,
                })
            }
        }

        // Ensure all requested team IDs are in the results
        for (const teamId of teamIds) {
            if (!results[teamId]) {
                results[teamId] = []
            }
        }

        return results
    }

    private convertPluginConfigToInsightsFunction(
        pluginConfig: LightweightPluginConfig,
        attachments?: Record<string, any>
    ): InsightsFunctionType | null {
        if (!pluginConfig.plugin?.url) {
            return null
        }

        // Extract plugin ID from URL (following the migration.py pattern)
        const pluginId = pluginConfig.plugin.url.replace('inline://', '').replace('https://github.com/hanzoai/', '')

        const templateId = `plugin-${pluginId}`

        // Build inputs from plugin config
        const inputs: InsightsFunctionType['inputs'] = {}

        for (const [key, value] of Object.entries(pluginConfig.config)) {
            inputs[key] = { value: value?.toString() ?? '' }
        }

        // Add attachments to inputs (matching migration.py logic)
        if (attachments && Object.keys(pluginConfig.config).length > 0) {
            for (const [key, value] of Object.entries(attachments)) {
                if (value) {
                    inputs[key] = { value }
                }
            }
        }

        // Add legacy_plugin_config_id for plugins that use legacy storage
        if (pluginId === 'customerio-plugin') {
            inputs.legacy_plugin_config_id = { value: pluginConfig.id }
        }

        // Create a InsightsFunctionType
        return {
            id: `legacy-${pluginConfig.id}`,
            type: 'destination' as const,
            team_id: pluginConfig.team_id,
            name: `Legacy Plugin ${pluginConfig.id}`,
            enabled: pluginConfig.enabled,
            deleted: false,
            script: '',
            bytecode: [],
            template_id: templateId,
            inputs,
            filters: null,
            created_at: pluginConfig.created_at,
            updated_at: pluginConfig.updated_at ?? pluginConfig.created_at,
        }
    }

    @instrumented('cdpLegacyEventsConsumer.processEvent')
    public async processEvent(invocation: InsightsFunctionInvocationGlobals) {
        const event: PostIngestionEvent = {
            eventUuid: invocation.event.uuid,
            event: invocation.event.event,
            teamId: invocation.project.id,
            distinctId: invocation.event.distinct_id,
            properties: invocation.event.properties,
            timestamp: invocation.event.timestamp as ISOTimestamp,
            // None of these are actually used by the runOnEvent as it converts it to a PostIngestionEvent
            projectId: invocation.project.id as ProjectId,
            person_created_at: null,
            person_properties: {},
            person_id: undefined,
        }

        const invocations = await this.getLegacyPluginInsightsFunctionInvocations(invocation)

        const results = await Promise.all(
            invocations.map(async (invocation) => this.legacyPluginExecutor.execute(invocation))
        )

        for (const result of results) {
            const pluginConfigId = parseInt(result.invocation.insightsFunction.id.replace('legacy-', ''))
            const error = result.error

            legacyPluginExecutionResultCounter
                .labels({
                    result: error ? 'error' : 'success',
                    template_id: result.invocation.insightsFunction.template_id,
                })
                .inc()

            void this.promiseScheduler.schedule(
                this.appMetrics.queueMetric({
                    teamId: event.teamId,
                    pluginConfigId,
                    category: 'onEvent',
                    failures: error ? 1 : 0,
                    successes: error ? 0 : 1,
                })
            )
        }
    }

    @instrumented('cdpLegacyEventsConsumer.processBatch')
    public async processBatch(
        invocationGlobals: InsightsFunctionInvocationGlobals[]
    ): Promise<{ backgroundTask: Promise<any>; invocations: CyclotronJobInvocation[] }> {
        if (invocationGlobals.length) {
            await Promise.all(invocationGlobals.map((x) => this.processEvent(x)))
        }

        return {
            // This is all IO so we can set them off in the background and start processing the next batch
            backgroundTask: this.promiseScheduler.waitForAll(),
            invocations: [],
        }
    }

    // This consumer always parses from stream
    @instrumented('cdpConsumer.handleEachBatch.parseStreamMessages')
    public async _parseStreamBatch(messages: Message[]): Promise<InsightsFunctionInvocationGlobals[]> {
        const events: InsightsFunctionInvocationGlobals[] = []

        await Promise.all(
            messages.map(async (message) => {
                try {
                    const datastoreEvent = parseJSON(message.value!.toString()) as RawDatastoreEvent

                    const team = await this.hub.teamManager.getTeam(datastoreEvent.team_id)

                    if (!team) {
                        return
                    }

                    const pluginConfigInsightsFunctions = await this.pluginConfigsLoader.get(team.id.toString())

                    if (!pluginConfigInsightsFunctions?.length) {
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

    private async getLegacyPluginInsightsFunctionInvocations(
        invocation: InsightsFunctionInvocationGlobals
    ): Promise<CyclotronJobInvocationInsightsFunction[]> {
        const pluginConfigInsightsFunctions = await this.pluginConfigsLoader.get(invocation.project.id.toString())

        if (!pluginConfigInsightsFunctions) {
            return []
        }

        return pluginConfigInsightsFunctions.map(({ insightsFunction }) => {
            // Plugin configs are always static { value: any } so we can just convert to a record of strings
            const inputs = Object.entries(insightsFunction.inputs || {}).reduce(
                (acc, [key, value]) => {
                    acc[key] = value?.value
                    return acc
                },
                {} as Record<string, string>
            )

            return createInvocation(
                {
                    ...invocation,
                    inputs,
                },
                insightsFunction
            )
        })
    }

    public async start(): Promise<void> {
        await super.start()
        await this.legacyWebhookService.start()
        // Start consuming messages
        await this.streamConsumer.connect(async (messages) => {
            logger.info('🔁', `${this.name} - handling batch`, {
                size: messages.length,
            })

            return await instrumentFn('cdpLegacyConsumer.handleEachBatch', async () => {
                const [webhookBatch, pluginBatch] = await Promise.all([
                    this.legacyWebhookService.processBatch(messages),
                    this._parseStreamBatch(messages).then((invocations) => this.processBatch(invocations)),
                ])
                return { backgroundTask: Promise.all([webhookBatch.backgroundTask, pluginBatch.backgroundTask]) }
            })
        })
    }

    public async stop(): Promise<void> {
        logger.info('💤', 'Stopping consumer...')
        await this.streamConsumer.disconnect()
        logger.info('💤', 'Stopping legacy webhook service...')
        await this.legacyWebhookService.stop()
        logger.info('💤', 'Flushing app metrics before stopping...')
        await this.appMetrics.flush()
        // IMPORTANT: super always comes last
        await super.stop()
        logger.info('💤', 'Consumer stopped!')
    }

    public isHealthy(): HealthCheckResult {
        return this.streamConsumer.isHealthy()
    }
}
