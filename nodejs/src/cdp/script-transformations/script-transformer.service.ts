import { Counter, Gauge, Histogram } from 'prom-client'

import { PluginEvent } from '@hanzo/plugin-scaffold'

import { RedisV2, createRedisV2PoolFromConfig } from '~/common/redis/redis-v2'
import { instrumentFn } from '~/common/tracing/tracing-utils'

import { CyclotronJobInvocationResult, InsightsFunctionInvocationGlobals, InsightsFunctionType } from '../../cdp/types'
import { isLegacyPluginInsightsFunction } from '../../cdp/utils'
import { Hub } from '../../types'
import { GeoIp } from '../../utils/geoip'
import { logger } from '../../utils/logger'
import { ScriptExecutorService } from '../services/script-executor.service'
import { LegacyPluginExecutorService } from '../services/legacy-plugin-executor.service'
import { InsightsFunctionManagerService } from '../services/managers/insights-function-manager.service'
import { InsightsFunctionMonitoringService } from '../services/monitoring/insights-function-monitoring.service'
import { ScriptWatcherService, ScriptWatcherState } from '../services/monitoring/script-watcher.service'
import { convertToInsightsFunctionFilterGlobal, filterFunctionInstrumented } from '../utils/insights-function-filtering'
import { createInvocation } from '../utils/invocation-utils'
import { getTransformationFunctions } from './transformation-functions'

/**
 * Narrowed Hub type for ScriptTransformerService.
 * This includes all fields needed by ScriptTransformerService and its dependencies:
 * - InsightsFunctionManagerService
 * - ScriptExecutorService
 * - LegacyPluginExecutorService
 * - InsightsFunctionMonitoringService
 * - ScriptWatcherService
 * - createRedisV2Pool
 */
export type ScriptTransformerHub = Pick<
    Hub,
    // Direct usage in ScriptTransformerService
    | 'CDP_SCRIPT_WATCHER_SAMPLE_RATE'
    | 'geoipService'
    | 'SITE_URL'
    // Redis pool config
    | 'REDIS_URL'
    | 'REDIS_POOL_MIN_SIZE'
    | 'REDIS_POOL_MAX_SIZE'
    | 'CDP_REDIS_HOST'
    | 'CDP_REDIS_PORT'
    | 'CDP_REDIS_PASSWORD'
    // InsightsFunctionManagerService
    | 'postgres'
    | 'pubSub'
    | 'encryptedFields'
    // ScriptExecutorService + EmailService
    | 'CDP_WATCHER_COST_TIMING_UPPER_MS'
    | 'CDP_GOOGLE_ADWORDS_DEVELOPER_TOKEN'
    | 'CDP_FETCH_BACKOFF_BASE_MS'
    | 'CDP_FETCH_BACKOFF_MAX_MS'
    | 'CDP_FETCH_RETRIES'
    | 'integrationManager'
    | 'ENCRYPTION_SALT_KEYS'
    | 'SES_ACCESS_KEY_ID'
    | 'SES_SECRET_ACCESS_KEY'
    | 'SES_REGION'
    | 'SES_ENDPOINT'
    // LegacyPluginExecutorService
    | 'postgres'
    // InsightsFunctionMonitoringService
    | 'streamProducer'
    | 'teamManager'
    | 'internalCaptureService'
    | 'INSIGHTS_FUNCTION_MONITORING_APP_METRICS_TOPIC'
    | 'INSIGHTS_FUNCTION_MONITORING_LOG_ENTRIES_TOPIC'
    // ScriptWatcherService
    | 'CDP_WATCHER_COST_TIMING_LOWER_MS'
    | 'CDP_WATCHER_COST_TIMING'
    | 'CDP_WATCHER_ASYNC_COST_TIMING_LOWER_MS'
    | 'CDP_WATCHER_ASYNC_COST_TIMING_UPPER_MS'
    | 'CDP_WATCHER_ASYNC_COST_TIMING'
    | 'CDP_WATCHER_SEND_EVENTS'
    | 'CDP_WATCHER_BUCKET_SIZE'
    | 'CDP_WATCHER_REFILL_RATE'
    | 'CDP_WATCHER_TTL'
    | 'CDP_WATCHER_AUTOMATICALLY_DISABLE_FUNCTIONS'
    | 'CDP_WATCHER_THRESHOLD_DEGRADED'
    | 'CDP_WATCHER_STATE_LOCK_TTL'
    | 'CDP_WATCHER_OBSERVE_RESULTS_BUFFER_TIME_MS'
    | 'CDP_WATCHER_OBSERVE_RESULTS_BUFFER_MAX_RESULTS'
>

export const scriptTransformationDroppedEvents = new Counter({
    name: 'script_transformation_dropped_events',
    help: 'Indicates how many events are dropped by script transformations',
})

export const scriptTransformationInvocations = new Counter({
    name: 'script_transformation_invocations_total',
    help: 'Number of times transformEvent was called directly',
})

export const scriptTransformationAttempts = new Counter({
    name: 'script_transformation_attempts_total',
    help: 'Number of transformation attempts before any processing',
    labelNames: ['type'],
})

export const scriptTransformationCompleted = new Counter({
    name: 'script_transformation_completed_total',
    help: 'Number of successfully completed transformations',
    labelNames: ['type'],
})

export const scriptWatcherLatency = new Histogram({
    name: 'script_watcher_latency_seconds',
    help: 'Time spent in ScriptWatcher operations in seconds during ingestion',
    labelNames: ['operation'],
})

export const scriptTransformationPendingInvocationResults = new Gauge({
    name: 'script_transformation_pending_invocation_results',
    help: 'Number of invocation results accumulated and waiting to be processed. High values indicate memory accumulation.',
})

export interface TransformationResult {
    event: PluginEvent | null
    invocationResults: CyclotronJobInvocationResult[]
}

export class ScriptTransformerService {
    private scriptExecutor: ScriptExecutorService
    private insightsFunctionManager: InsightsFunctionManagerService
    private hub: ScriptTransformerHub
    private pluginExecutor: LegacyPluginExecutorService
    private insightsFunctionMonitoringService: InsightsFunctionMonitoringService
    private scriptWatcher: ScriptWatcherService
    private redis: RedisV2
    private cachedStates: Record<string, ScriptWatcherState> = {}
    private invocationResults: CyclotronJobInvocationResult[] = []
    private cachedGeoIp?: GeoIp
    private cachedTransformationFunctions?: ReturnType<typeof getTransformationFunctions>

    constructor(hub: ScriptTransformerHub) {
        this.hub = hub
        // Script transformer uses CDP Redis instance with fallback to default
        this.redis = createRedisV2PoolFromConfig({
            connection: hub.CDP_REDIS_HOST
                ? {
                      url: hub.CDP_REDIS_HOST,
                      options: { port: hub.CDP_REDIS_PORT, password: hub.CDP_REDIS_PASSWORD },
                      name: 'script-transformer-redis',
                  }
                : { url: hub.REDIS_URL, name: 'script-transformer-redis-fallback' },
            poolMinSize: hub.REDIS_POOL_MIN_SIZE,
            poolMaxSize: hub.REDIS_POOL_MAX_SIZE,
        })
        this.insightsFunctionManager = new InsightsFunctionManagerService(hub)
        this.scriptExecutor = new ScriptExecutorService(hub)
        this.pluginExecutor = new LegacyPluginExecutorService(hub.postgres, hub.geoipService)
        this.insightsFunctionMonitoringService = new InsightsFunctionMonitoringService(hub)
        this.scriptWatcher = new ScriptWatcherService(hub, this.redis)
    }

    public async start(): Promise<void> {}

    public async stop(): Promise<void> {
        await this.processInvocationResults()
        await this.redis.useClient({ name: 'cleanup' }, async (client) => {
            await client.quit()
        })
    }

    public async processInvocationResults(): Promise<void> {
        const results = [...this.invocationResults]
        this.invocationResults = []
        scriptTransformationPendingInvocationResults.set(0)

        const shouldRunScriptWatcher = Math.random() < this.hub.CDP_SCRIPT_WATCHER_SAMPLE_RATE

        await Promise.allSettled([
            this.insightsFunctionMonitoringService
                .queueInvocationResults(results)
                .then(() => this.insightsFunctionMonitoringService.flush()),

            shouldRunScriptWatcher
                ? this.scriptWatcher.observeResults(results).catch((error) => {
                      logger.warn('⚠️', 'ScriptWatcher observeResults failed', { error })
                  })
                : Promise.resolve(),
        ])
    }

    private async getTransformationFunctions() {
        if (!this.cachedTransformationFunctions) {
            this.cachedGeoIp = await this.hub.geoipService.get()
            this.cachedTransformationFunctions = getTransformationFunctions(this.cachedGeoIp)
        }
        return this.cachedTransformationFunctions
    }

    private createInvocationGlobals(event: PluginEvent): InsightsFunctionInvocationGlobals {
        return {
            project: {
                id: event.team_id,
                name: '',
                url: this.hub.SITE_URL,
            },
            event: {
                uuid: event.uuid,
                event: event.event,
                distinct_id: event.distinct_id,
                properties: event.properties || {},
                elements_chain: event.properties?.elements_chain || '',
                timestamp: event.timestamp || '',
                url: event.properties?.$current_url || '',
            },
        }
    }

    private async transformEventAndProduceMessagesImpl(event: PluginEvent): Promise<TransformationResult> {
        scriptTransformationAttempts.inc({ type: 'with_messages' })

        const teamInsightsFunctions = await this.insightsFunctionManager.getInsightsFunctionsForTeam(event.team_id, ['transformation'])

        const transformationResult = await this.transformEvent(event, teamInsightsFunctions)

        for (const result of transformationResult.invocationResults) {
            this.invocationResults.push(result)
        }
        scriptTransformationPendingInvocationResults.set(this.invocationResults.length)

        scriptTransformationCompleted.inc({ type: 'with_messages' })
        return {
            ...transformationResult,
        }
    }

    public transformEventAndProduceMessages(event: PluginEvent): Promise<TransformationResult> {
        return instrumentFn(`scriptTransformer.transformEventAndProduceMessages`, () =>
            this.transformEventAndProduceMessagesImpl(event)
        )
    }

    private async transformEventImpl(
        event: PluginEvent,
        teamInsightsFunctions: InsightsFunctionType[]
    ): Promise<TransformationResult> {
        scriptTransformationInvocations.inc()

        // Early return if no transformations to run
        if (teamInsightsFunctions.length === 0) {
            return {
                event,
                invocationResults: [],
            }
        }

        const results: CyclotronJobInvocationResult[] = []
        const transformationsSucceeded: string[] = []
        const transformationsFailed: string[] = []
        const transformationsSkipped: string[] = []

        const shouldRunScriptWatcher = Math.random() < this.hub.CDP_SCRIPT_WATCHER_SAMPLE_RATE

        // Create globals once and update the event properties after each transformation
        const globals = this.createInvocationGlobals(event)

        for (const insightsFunction of teamInsightsFunctions) {
            // Check if function is in a degraded state, but only if scriptwatcher is enabled
            if (shouldRunScriptWatcher) {
                const functionState = this.cachedStates[insightsFunction.id]

                // If the function is in a degraded state, skip it
                if (functionState && functionState === ScriptWatcherState.disabled) {
                    this.insightsFunctionMonitoringService.queueAppMetric(
                        {
                            team_id: event.team_id,
                            app_source_id: insightsFunction.id,
                            metric_kind: 'failure',
                            metric_name: 'disabled_permanently',
                            count: 1,
                        },
                        'insights_function'
                    )
                    continue
                }
            }

            // Create identifier after the disabled check passes to avoid string allocation for skipped functions
            const transformationIdentifier = `${insightsFunction.name} (${insightsFunction.id})`

            // Create filterGlobals for each iteration - it references globals.event.properties
            // which gets updated after each successful transformation
            const filterGlobals = convertToInsightsFunctionFilterGlobal(globals)

            // Check if function has filters - if not, always apply
            if (insightsFunction.filters?.bytecode) {
                const filterResults = await filterFunctionInstrumented({
                    fn: insightsFunction,
                    filters: insightsFunction.filters,
                    filterGlobals,
                })

                // If filter didn't pass skip the actual transformation and add logs and errors from the filterResult
                this.insightsFunctionMonitoringService.queueAppMetrics(filterResults.metrics, 'insights_function')
                this.insightsFunctionMonitoringService.queueLogs(filterResults.logs, 'insights_function')

                if (!filterResults.match) {
                    transformationsSkipped.push(transformationIdentifier)
                    continue
                }
            }

            const result = await this.executeInsightsFunction(insightsFunction, globals)

            results.push(result)

            if (result.error) {
                transformationsFailed.push(transformationIdentifier)
                continue
            }

            if (!result.execResult) {
                scriptTransformationDroppedEvents.inc()
                this.insightsFunctionMonitoringService.queueAppMetric(
                    {
                        team_id: event.team_id,
                        app_source_id: insightsFunction.id,
                        metric_kind: 'other',
                        metric_name: 'dropped',
                        count: 1,
                    },
                    'insights_function'
                )
                transformationsFailed.push(transformationIdentifier)
                return {
                    event: null,
                    invocationResults: results,
                }
            }

            const transformedEvent: unknown = result.execResult

            if (
                !transformedEvent ||
                typeof transformedEvent !== 'object' ||
                !('properties' in transformedEvent) ||
                !transformedEvent.properties ||
                typeof transformedEvent.properties !== 'object'
            ) {
                logger.error('⚠️', 'Invalid transformation result - missing or invalid properties', {
                    function_id: insightsFunction.id,
                })
                transformationsFailed.push(transformationIdentifier)
                continue
            }

            event.properties = transformedEvent.properties as Record<string, any>
            event.ip = event.properties.$ip ?? null

            if ('event' in transformedEvent) {
                if (typeof transformedEvent.event !== 'string') {
                    logger.error('⚠️', 'Invalid transformation result - event name must be a string', {
                        function_id: insightsFunction.id,
                        event: transformedEvent.event,
                    })
                    transformationsFailed.push(transformationIdentifier)
                    continue
                }
                event.event = transformedEvent.event
            }

            if ('distinct_id' in transformedEvent) {
                if (typeof transformedEvent.distinct_id !== 'string') {
                    logger.error('⚠️', 'Invalid transformation result - distinct_id must be a string', {
                        function_id: insightsFunction.id,
                        distinct_id: transformedEvent.distinct_id,
                    })
                    transformationsFailed.push(transformationIdentifier)
                    continue
                }
                event.distinct_id = transformedEvent.distinct_id
            }

            // Update globals so the next transformation sees the changes
            globals.event.properties = event.properties
            globals.event.event = event.event
            globals.event.distinct_id = event.distinct_id

            transformationsSucceeded.push(transformationIdentifier)
        }

        // Use direct property assignment instead of spreading to avoid copying the entire object
        if (
            transformationsFailed.length > 0 ||
            transformationsSkipped.length > 0 ||
            transformationsSucceeded.length > 0
        ) {
            event.properties = event.properties || {}
            if (transformationsFailed.length > 0) {
                event.properties.$transformations_failed = transformationsFailed
            }
            if (transformationsSkipped.length > 0) {
                event.properties.$transformations_skipped = transformationsSkipped
            }
            if (transformationsSucceeded.length > 0) {
                event.properties.$transformations_succeeded = transformationsSucceeded
            }
        }

        return {
            event,
            invocationResults: results,
        }
    }

    public transformEvent(event: PluginEvent, teamInsightsFunctions: InsightsFunctionType[]): Promise<TransformationResult> {
        // Sanitize transform event properties
        if (event.properties) {
            for (const key of ['$transformations_failed', '$transformations_skipped', '$transformations_succeeded']) {
                if (key in event.properties) {
                    delete event.properties[key]
                }
            }
        }

        return instrumentFn(`scriptTransformer.transformEvent`, () => this.transformEventImpl(event, teamInsightsFunctions))
    }

    private async executeInsightsFunction(
        insightsFunction: InsightsFunctionType,
        globals: InsightsFunctionInvocationGlobals
    ): Promise<CyclotronJobInvocationResult> {
        const transformationFunctions = await this.getTransformationFunctions()
        const globalsWithInputs = await this.scriptExecutor.buildInputsWithGlobals(insightsFunction, globals)

        const invocation = createInvocation(globalsWithInputs, insightsFunction)

        const result = isLegacyPluginInsightsFunction(insightsFunction)
            ? await this.pluginExecutor.execute(invocation)
            : await this.scriptExecutor.execute(invocation, {
                  functions: transformationFunctions,
                  asyncFunctionsNames: [],
              })
        return result
    }

    public async fetchAndCacheInsightsFunctionStates(functionIds: string[]): Promise<void> {
        const timer = scriptWatcherLatency.startTimer({ operation: 'getStates' })
        const states = await this.scriptWatcher.getEffectiveStates(functionIds)
        timer()

        // Save only the state enum value to cache
        Object.entries(states).forEach(([id, state]) => {
            this.cachedStates[id] = state.state
        })
    }

    public clearInsightsFunctionStates(functionIds?: string[]): void {
        if (functionIds) {
            // Clear specific function states
            functionIds.forEach((id) => {
                delete this.cachedStates[id]
            })
        } else {
            // Clear all states if no IDs provided
            this.cachedStates = {}
        }
    }
}
