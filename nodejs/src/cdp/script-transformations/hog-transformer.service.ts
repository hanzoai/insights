import { Counter, Gauge, Histogram } from 'prom-client'

import { HogTransformationResult, HogTransformer } from '~/common/script-transformations/script-transformer.interface'
import { IngestionOutputs } from '~/common/outputs/ingestion-outputs'
import { RedisV2, createRedisV2PoolFromConfig } from '~/common/redis/redis-v2'
import { instrumentFn } from '~/common/tracing/tracing-utils'
import { PostgresRouter } from '~/common/utils/db/postgres'
import { GeoIPService, GeoIp } from '~/common/utils/geoip'
import { logger } from '~/common/utils/logger'
import { PubSub } from '~/common/utils/pubsub'
import { TeamManager } from '~/common/utils/team-manager'
import { PluginEvent } from '~/plugin-scaffold'

import { CyclotronJobInvocationResult, InsightsFunctionInvocationGlobals, InsightsFunctionType } from '../../cdp/types'
import { isLegacyPluginInsightsFunction } from '../../cdp/utils'
import type { CommonConfig } from '../../common/config'
import { CdpCoreServicesConfig, createCdpReaderRedisPool, createCdpValkeyShadowPools } from '../cdp-services'
import { HogExecutorService, MAX_FETCH_TIMEOUT_MS, cdpTrackedFetch } from '../services/script-executor.service'
import { HogInputsService } from '../services/script-inputs.service'
import { LegacyPluginExecutorService } from '../services/legacy-plugin-executor.service'
import { InsightsFunctionManagerService } from '../services/managers/script-function-manager.service'
import { IntegrationManagerService } from '../services/managers/integration-manager.service'
import { RecipientsManagerService } from '../services/managers/recipients-manager.service'
import { TeamWorkflowsConfigService } from '../services/managers/team-workflows-config.service'
import { EmailSuppressionService } from '../services/messaging/email-suppression.service'
import { EmailService } from '../services/messaging/email.service'
import { EmailTrackingCodeSigner } from '../services/messaging/helpers/tracking-code'
import { PushNotificationService } from '../services/messaging/push-notification.service'
import { RecipientTokensService } from '../services/messaging/recipient-tokens.service'
import { InsightsFunctionMonitoringService, MonitoringOutput } from '../services/monitoring/script-function-monitoring.service'
import { HogWatcherService, HogWatcherState } from '../services/monitoring/script-watcher.service'
import { EncryptedFields } from '../utils/encryption-utils'
import { convertToInsightsFunctionFilterGlobal, filterFunctionInstrumented } from '../utils/script-function-filtering'
import { createInvocation } from '../utils/invocation-utils'
import { mirrorCall } from '../utils/mirror-call'
import { RustVmExecutor } from './rust-vm-executor'
import { getTransformationFunctions } from './transformation-functions'

export interface HogTransformerConfig {
    siteUrl: string
    hogWatcherSampleRate: number
    hogRustVmExecutionEnabled: boolean
    mmdbFileLocation: string
}

export const hogTransformationDroppedEvents = new Counter({
    name: 'hog_transformation_dropped_events',
    help: 'Indicates how many events are dropped by script transformations',
})

export const hogTransformationInvocations = new Counter({
    name: 'hog_transformation_invocations_total',
    help: 'Number of times transformEvent was called directly',
})

export const hogTransformationAttempts = new Counter({
    name: 'hog_transformation_attempts_total',
    help: 'Number of transformation attempts before any processing',
    labelNames: ['type'],
})

export const hogTransformationCompleted = new Counter({
    name: 'hog_transformation_completed_total',
    help: 'Number of successfully completed transformations',
    labelNames: ['type'],
})

export const hogWatcherLatency = new Histogram({
    name: 'hog_watcher_latency_seconds',
    help: 'Time spent in HogWatcher operations in seconds during ingestion',
    labelNames: ['operation'],
})

export const hogTransformationPendingInvocationResults = new Gauge({
    name: 'hog_transformation_pending_invocation_results',
    help: 'Number of invocation results accumulated and waiting to be processed. High values indicate memory accumulation.',
})

export const hogTransformationUnexpectedErrors = new Counter({
    name: 'hog_transformation_unexpected_errors_total',
    help: 'Number of unexpected errors during transformation execution. Any occurrence should trigger an alert as the transformation is skipped.',
})

export interface TransformationResult extends HogTransformationResult {
    event: PluginEvent | null
    invocationResults: CyclotronJobInvocationResult[]
}

export class HogTransformerService implements HogTransformer {
    private cachedStates: Record<string, HogWatcherState> = {}
    private invocationResults: CyclotronJobInvocationResult[] = []
    private cachedGeoIp?: GeoIp
    private cachedTransformationFunctions?: ReturnType<typeof getTransformationFunctions>
    private rustVmExecutor: RustVmExecutor | null

    constructor(
        private insightsFunctionManager: InsightsFunctionManagerService,
        private hogExecutor: HogExecutorService,
        private hogWatcher: HogWatcherService,
        private hogWatcherMirror: HogWatcherService | null,
        private insightsFunctionMonitoringService: InsightsFunctionMonitoringService,
        private pluginExecutor: LegacyPluginExecutorService,
        private geoipService: GeoIPService,
        private redis: RedisV2,
        private config: HogTransformerConfig
    ) {
        this.rustVmExecutor = config.hogRustVmExecutionEnabled
            ? new RustVmExecutor({ mmdbPath: config.mmdbFileLocation })
            : null
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
        hogTransformationPendingInvocationResults.set(0)

        const shouldRunHogWatcher = Math.random() < this.config.hogWatcherSampleRate

        this.insightsFunctionMonitoringService.queueInvocationResults(results)

        await Promise.allSettled([
            this.insightsFunctionMonitoringService.flush(),

            shouldRunHogWatcher
                ? this.hogWatcher.observeResults(results).catch((error) => {
                      logger.warn('⚠️', 'HogWatcher observeResults failed', { error })
                  })
                : Promise.resolve(),

            shouldRunHogWatcher
                ? mirrorCall('script-watcher.observeResults', () => this.hogWatcherMirror?.observeResults(results))
                : Promise.resolve(),
        ])
    }

    private async getTransformationFunctions() {
        if (!this.cachedTransformationFunctions) {
            this.cachedGeoIp = await this.geoipService.get()
            this.cachedTransformationFunctions = getTransformationFunctions(this.cachedGeoIp)
        }
        return this.cachedTransformationFunctions
    }

    private createInvocationGlobals(event: PluginEvent): InsightsFunctionInvocationGlobals {
        return {
            project: {
                id: event.team_id,
                name: '',
                url: this.config.siteUrl,
            },
            event: {
                uuid: event.uuid,
                event: event.event,
                distinct_id: event.distinct_id,
                properties: event.properties || {},
                elements_chain: event.properties?.$elements_chain || '',
                timestamp: event.timestamp || '',
                url: event.properties?.$current_url || '',
            },
        }
    }

    private async transformEventAndProduceMessagesImpl(event: PluginEvent): Promise<TransformationResult> {
        hogTransformationAttempts.inc({ type: 'with_messages' })

        const teamInsightsFunctions = await this.insightsFunctionManager.getInsightsFunctionsForTeam(event.team_id, ['transformation'])

        const transformationResult = await this.transformEvent(event, teamInsightsFunctions)

        for (const result of transformationResult.invocationResults) {
            this.invocationResults.push(result)
        }
        hogTransformationPendingInvocationResults.set(this.invocationResults.length)

        hogTransformationCompleted.inc({ type: 'with_messages' })
        return {
            ...transformationResult,
        }
    }

    public transformEventAndProduceMessages(event: PluginEvent): Promise<TransformationResult> {
        return instrumentFn(`hogTransformer.transformEventAndProduceMessages`, () =>
            this.transformEventAndProduceMessagesImpl(event)
        )
    }

    private async transformEventImpl(
        event: PluginEvent,
        teamInsightsFunctions: InsightsFunctionType[]
    ): Promise<TransformationResult> {
        hogTransformationInvocations.inc()

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

        const shouldRunHogWatcher = Math.random() < this.config.hogWatcherSampleRate

        // Create globals once and update the event properties after each transformation
        const globals = this.createInvocationGlobals(event)

        for (const insightsFunction of teamInsightsFunctions) {
            // Check if function is in a degraded state, but only if hogwatcher is enabled
            if (shouldRunHogWatcher) {
                const functionState = this.cachedStates[insightsFunction.id]

                // If the function is in a degraded state, skip it
                if (functionState && functionState === HogWatcherState.disabled) {
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

            let result: CyclotronJobInvocationResult
            try {
                result = await this.executeInsightsFunction(insightsFunction, globals)
            } catch (err) {
                hogTransformationUnexpectedErrors.inc()
                logger.error('⚠️', 'Unexpected error executing transformation', {
                    function_id: insightsFunction.id,
                    team_id: event.team_id,
                    error: String(err),
                })
                this.insightsFunctionMonitoringService.queueAppMetric(
                    {
                        team_id: event.team_id,
                        app_source_id: insightsFunction.id,
                        metric_kind: 'failure',
                        metric_name: 'failed',
                        count: 1,
                    },
                    'insights_function'
                )
                transformationsFailed.push(transformationIdentifier)
                continue
            }

            results.push(result)

            if (result.error) {
                transformationsFailed.push(transformationIdentifier)
                continue
            }

            if (!result.execResult) {
                hogTransformationDroppedEvents.inc()
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
                    droppedBy: { id: insightsFunction.id, name: insightsFunction.name },
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

        return instrumentFn(`hogTransformer.transformEvent`, () => this.transformEventImpl(event, teamInsightsFunctions))
    }

    private async executeInsightsFunction(
        insightsFunction: InsightsFunctionType,
        globals: InsightsFunctionInvocationGlobals
    ): Promise<CyclotronJobInvocationResult> {
        const transformationFunctions = await this.getTransformationFunctions()
        const globalsWithInputs = await this.hogExecutor.buildInputsWithGlobals(insightsFunction, globals)

        const invocation = createInvocation(globalsWithInputs, insightsFunction)

        if (isLegacyPluginInsightsFunction(insightsFunction)) {
            return await this.pluginExecutor.execute(invocation)
        }

        if (this.rustVmExecutor) {
            const sensitiveValues = this.hogExecutor.getSensitiveValues(insightsFunction, globalsWithInputs.inputs)
            const rustResult = this.rustVmExecutor.execute(invocation, sensitiveValues)
            // Null means the Rust VM can't run this program (addon not built, unsupported host
            // function): fall through to the Node VM.
            if (rustResult) {
                return rustResult
            }
        }

        return await this.hogExecutor.execute(invocation, {
            functions: transformationFunctions,
            asyncFunctionsNames: [],
        })
    }

    public async fetchAndCacheInsightsFunctionStates(functionIds: string[]): Promise<void> {
        const timer = hogWatcherLatency.startTimer({ operation: 'getStates' })
        const [states] = await Promise.all([
            this.hogWatcher.getEffectiveStates(functionIds),
            mirrorCall('script-watcher.getEffectiveStates', () => this.hogWatcherMirror?.getEffectiveStates(functionIds)),
        ])
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

    public async prefetchTransformationStatesForTeams(teamIds: number[]): Promise<void> {
        this.clearInsightsFunctionStates()
        if (teamIds.length === 0) {
            return
        }
        const teamInsightsFunctionIds = await this.insightsFunctionManager.getInsightsFunctionIdsForTeams(teamIds, ['transformation'])
        const allInsightsFunctionIds = Object.values(teamInsightsFunctionIds).flat()
        if (allInsightsFunctionIds.length > 0) {
            await this.fetchAndCacheInsightsFunctionStates(allInsightsFunctionIds)
        }
    }
}

/**
 * Config needed by the HogTransformer when running inside ingestion.
 * This is CdpCoreServicesConfig (CDP redis, watcher, monitoring, encryption, etc.)
 * plus the ingestion-specific sample rates from CommonConfig.
 */
export type HogTransformerServiceConfig = CdpCoreServicesConfig &
    Pick<CommonConfig, 'CDP_FN_WATCHER_SAMPLE_RATE' | 'CDP_FN_RUST_VM_EXECUTION_ENABLED' | 'MMDB_FILE_LOCATION'>

export interface HogTransformerServiceDeps {
    geoipService: GeoIPService
    postgres: PostgresRouter
    pubSub: PubSub
    encryptedFields: EncryptedFields
    integrationManager: IntegrationManagerService
    monitoringOutputs: IngestionOutputs<MonitoringOutput>
    teamManager: TeamManager
}

export function createHogTransformerService(
    config: HogTransformerServiceConfig,
    deps: HogTransformerServiceDeps
): HogTransformerService {
    const redis = createRedisV2PoolFromConfig({
        connection: config.CDP_REDIS_HOST
            ? {
                  url: config.CDP_REDIS_HOST,
                  options: { port: config.CDP_REDIS_PORT, password: config.CDP_REDIS_PASSWORD },
                  name: 'script-transformer-redis',
              }
            : { url: config.REDIS_URL, name: 'script-transformer-redis-fallback' },
        poolMinSize: config.REDIS_POOL_MIN_SIZE,
        poolMaxSize: config.REDIS_POOL_MAX_SIZE,
    })
    const redisReader = createCdpReaderRedisPool(config, redis, 'script-transformer-redis')
    const valkeyShadow = createCdpValkeyShadowPools(config, 'script-transformer-redis')

    const insightsFunctionManager = new InsightsFunctionManagerService(deps.postgres, deps.pubSub, deps.encryptedFields)
    const recipientTokensService = new RecipientTokensService(config.ENCRYPTION_SALT_KEYS, config.SITE_URL)
    const hogInputsService = new HogInputsService(deps.integrationManager, recipientTokensService, deps.encryptedFields)
    const trackingCodeSigner = new EmailTrackingCodeSigner(config.ENCRYPTION_SALT_KEYS, config.CDP_EMAIL_TRACKING_URL)
    const teamWorkflowsConfigService = new TeamWorkflowsConfigService(deps.postgres)
    const emailSuppressionService = new EmailSuppressionService(deps.postgres, {
        transientBounceThreshold: config.EMAIL_SUPPRESSION_TRANSIENT_BOUNCE_THRESHOLD,
    })
    const emailService = new EmailService(
        {
            sesAccessKeyId: config.SES_ACCESS_KEY_ID,
            sesSecretAccessKey: config.SES_SECRET_ACCESS_KEY,
            sesRegion: config.SES_REGION,
            sesEndpoint: config.SES_ENDPOINT,
            sesTrackedConfigurationSet: config.SES_TRACKED_CONFIGURATION_SET,
            sesUntrackedConfigurationSet: config.SES_UNTRACKED_CONFIGURATION_SET,
            sesTenantAttributionEnabled: config.EMAIL_SES_TENANT_ATTRIBUTION_ENABLED,
        },
        deps.integrationManager,
        teamWorkflowsConfigService,
        config.ENCRYPTION_SALT_KEYS,
        config.SITE_URL,
        trackingCodeSigner,
        emailSuppressionService,
        new RecipientsManagerService(deps.postgres)
    )
    const pushNotificationService = new PushNotificationService(
        deps.integrationManager,
        deps.encryptedFields,
        {
            trackedFetch: cdpTrackedFetch,
            maxFetchTimeoutMs: MAX_FETCH_TIMEOUT_MS,
            maxRetries: config.CDP_FETCH_RETRIES,
            backoffBaseMs: config.CDP_FETCH_BACKOFF_BASE_MS,
            backoffMaxMs: config.CDP_FETCH_BACKOFF_MAX_MS,
        },
        redis
    )
    const hogExecutor = new HogExecutorService(
        {
            hogCostTimingUpperMs: config.CDP_WATCHER_FN_COST_TIMING_UPPER_MS,
            googleAdwordsDeveloperToken: config.CDP_GOOGLE_ADWORDS_DEVELOPER_TOKEN,
            fetchRetries: config.CDP_FETCH_RETRIES,
            fetchBackoffBaseMs: config.CDP_FETCH_BACKOFF_BASE_MS,
            fetchBackoffMaxMs: config.CDP_FETCH_BACKOFF_MAX_MS,
        },
        { teamManager: deps.teamManager, siteUrl: config.SITE_URL },
        hogInputsService,
        emailService,
        recipientTokensService,
        pushNotificationService
    )
    const pluginExecutor = new LegacyPluginExecutorService(deps.postgres, deps.geoipService)
    const insightsFunctionMonitoringService = new InsightsFunctionMonitoringService(deps.monitoringOutputs)
    const hogWatcherConfig = {
        hogCostTimingLowerMs: config.CDP_WATCHER_FN_COST_TIMING_LOWER_MS,
        hogCostTimingUpperMs: config.CDP_WATCHER_FN_COST_TIMING_UPPER_MS,
        hogCostTiming: config.CDP_WATCHER_FN_COST_TIMING,
        asyncCostTimingLowerMs: config.CDP_WATCHER_ASYNC_COST_TIMING_LOWER_MS,
        asyncCostTimingUpperMs: config.CDP_WATCHER_ASYNC_COST_TIMING_UPPER_MS,
        asyncCostTiming: config.CDP_WATCHER_ASYNC_COST_TIMING,
        sendEvents: config.CDP_WATCHER_SEND_EVENTS,
        bucketSize: config.CDP_WATCHER_BUCKET_SIZE,
        refillRate: config.CDP_WATCHER_REFILL_RATE,
        ttl: config.CDP_WATCHER_TTL,
        automaticallyDisableFunctions: config.CDP_WATCHER_AUTOMATICALLY_DISABLE_FUNCTIONS,
        thresholdDegraded: config.CDP_WATCHER_THRESHOLD_DEGRADED,
        stateLockTtl: config.CDP_WATCHER_STATE_LOCK_TTL,
        observeResultsBufferTimeMs: config.CDP_WATCHER_OBSERVE_RESULTS_BUFFER_TIME_MS,
        observeResultsBufferMaxResults: config.CDP_WATCHER_OBSERVE_RESULTS_BUFFER_MAX_RESULTS,
    }
    const hogWatcher = new HogWatcherService(deps.teamManager, hogWatcherConfig, redis, redisReader)
    // sendEvents:false on the mirror so we don't double-emit billable team events.
    const hogWatcherMirror: HogWatcherService | null = valkeyShadow
        ? new HogWatcherService(
              deps.teamManager,
              { ...hogWatcherConfig, sendEvents: false },
              valkeyShadow.writer,
              valkeyShadow.reader
          )
        : null

    return new HogTransformerService(
        insightsFunctionManager,
        hogExecutor,
        hogWatcher,
        hogWatcherMirror,
        insightsFunctionMonitoringService,
        pluginExecutor,
        deps.geoipService,
        redis,
        {
            siteUrl: config.SITE_URL,
            hogWatcherSampleRate: config.CDP_FN_WATCHER_SAMPLE_RATE,
            hogRustVmExecutionEnabled: config.CDP_FN_RUST_VM_EXECUTION_ENABLED,
            mmdbFileLocation: config.MMDB_FILE_LOCATION,
        }
    )
}
