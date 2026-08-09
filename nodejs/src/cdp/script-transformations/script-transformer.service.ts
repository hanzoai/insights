import { Counter, Gauge } from 'prom-client'

import { IngestionOutputs } from '~/common/outputs/ingestion-outputs'
import { ScriptTransformationResult, ScriptTransformer } from '~/common/script-transformations/script-transformer.interface'
import { instrumentFn } from '~/common/tracing/tracing-utils'
import { PostgresRouter } from '~/common/utils/db/postgres'
import { GeoIPService, GeoIp } from '~/common/utils/geoip'
import { logger } from '~/common/utils/logger'
import { PubSub } from '~/common/utils/pubsub'
import { PluginEvent } from '~/plugin-scaffold'

import { CyclotronJobInvocationResult, InsightsFunctionInvocationGlobals, InsightsFunctionType } from '../../cdp/types'
import { isLegacyPluginInsightsFunction } from '../../cdp/utils'
import type { CommonConfig } from '../../common/config'
import { LegacyPluginExecutorService } from '../services/legacy-plugin-executor.service'
import { IntegrationManagerService } from '../services/managers/integration-manager.service'
import { InsightsFunctionManagerService } from '../services/managers/script-function-manager.service'
import {
    InsightsFunctionMonitoringService,
    MonitoringOutput,
} from '../services/monitoring/script-function-monitoring.service'
import { ScriptExecutorService } from '../services/script-executor.service'
import { ScriptInputsService } from '../services/script-inputs.service'
import { EncryptedFields } from '../utils/encryption-utils'
import { createInvocation } from '../utils/invocation-utils'
import { convertToInsightsFunctionFilterGlobal, filterFunctionInstrumented } from '../utils/script-function-filtering'
import { RustVmExecutor } from './rust-vm-executor'
import { getTransformationFunctions } from './transformation-functions'

export interface ScriptTransformerConfig {
    siteUrl: string
    scriptRustVmExecutionEnabled: boolean
    mmdbFileLocation: string
}

export const scriptTransformationDroppedEvents = new Counter({
    name: 'hog_transformation_dropped_events',
    help: 'Indicates how many events are dropped by script transformations',
})

export const scriptTransformationInvocations = new Counter({
    name: 'hog_transformation_invocations_total',
    help: 'Number of times transformEvent was called directly',
})

export const scriptTransformationAttempts = new Counter({
    name: 'hog_transformation_attempts_total',
    help: 'Number of transformation attempts before any processing',
    labelNames: ['type'],
})

export const scriptTransformationCompleted = new Counter({
    name: 'hog_transformation_completed_total',
    help: 'Number of successfully completed transformations',
    labelNames: ['type'],
})

export const scriptTransformationPendingInvocationResults = new Gauge({
    name: 'hog_transformation_pending_invocation_results',
    help: 'Number of invocation results accumulated and waiting to be processed. High values indicate memory accumulation.',
})

export const scriptTransformationUnexpectedErrors = new Counter({
    name: 'hog_transformation_unexpected_errors_total',
    help: 'Number of unexpected errors during transformation execution. Any occurrence should trigger an alert as the transformation is skipped.',
})

export interface TransformationResult extends ScriptTransformationResult {
    event: PluginEvent | null
    invocationResults: CyclotronJobInvocationResult[]
}

export class ScriptTransformerService implements ScriptTransformer {
    private invocationResults: CyclotronJobInvocationResult[] = []
    private cachedGeoIp?: GeoIp
    private cachedTransformationFunctions?: ReturnType<typeof getTransformationFunctions>
    private rustVmExecutor: RustVmExecutor | null

    constructor(
        private insightsFunctionManager: InsightsFunctionManagerService,
        private scriptExecutor: ScriptExecutorService,
        private insightsFunctionMonitoringService: InsightsFunctionMonitoringService,
        private pluginExecutor: LegacyPluginExecutorService,
        private geoipService: GeoIPService,
        private config: ScriptTransformerConfig
    ) {
        this.rustVmExecutor = config.scriptRustVmExecutionEnabled
            ? new RustVmExecutor({ mmdbPath: config.mmdbFileLocation })
            : null
    }

    public async start(): Promise<void> {}

    public async stop(): Promise<void> {
        await this.processInvocationResults()
    }

    public async processInvocationResults(): Promise<void> {
        const results = [...this.invocationResults]
        this.invocationResults = []
        scriptTransformationPendingInvocationResults.set(0)

        this.insightsFunctionMonitoringService.queueInvocationResults(results)

        await this.insightsFunctionMonitoringService.flush()
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
        scriptTransformationAttempts.inc({ type: 'with_messages' })

        const teamInsightsFunctions = await this.insightsFunctionManager.getInsightsFunctionsForTeam(event.team_id, [
            'transformation',
        ])

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

        // Create globals once and update the event properties after each transformation
        const globals = this.createInvocationGlobals(event)

        for (const insightsFunction of teamInsightsFunctions) {
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
                scriptTransformationUnexpectedErrors.inc()
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

    public transformEvent(
        event: PluginEvent,
        teamInsightsFunctions: InsightsFunctionType[]
    ): Promise<TransformationResult> {
        // Sanitize transform event properties
        if (event.properties) {
            for (const key of ['$transformations_failed', '$transformations_skipped', '$transformations_succeeded']) {
                if (key in event.properties) {
                    delete event.properties[key]
                }
            }
        }

        return instrumentFn(`scriptTransformer.transformEvent`, () =>
            this.transformEventImpl(event, teamInsightsFunctions)
        )
    }

    private async executeInsightsFunction(
        insightsFunction: InsightsFunctionType,
        globals: InsightsFunctionInvocationGlobals
    ): Promise<CyclotronJobInvocationResult> {
        const transformationFunctions = await this.getTransformationFunctions()
        const globalsWithInputs = await this.scriptExecutor.buildInputsWithGlobals(insightsFunction, globals)

        const invocation = createInvocation(globalsWithInputs, insightsFunction)

        if (isLegacyPluginInsightsFunction(insightsFunction)) {
            return await this.pluginExecutor.execute(invocation)
        }

        if (this.rustVmExecutor) {
            const sensitiveValues = this.scriptExecutor.getSensitiveValues(insightsFunction, globalsWithInputs.inputs)
            const rustResult = this.rustVmExecutor.execute(invocation, sensitiveValues)
            // Null means the Rust VM can't run this program (addon not built, unsupported host
            // function): fall through to the Node VM.
            if (rustResult) {
                return rustResult
            }
        }

        return await this.scriptExecutor.execute(invocation, { functions: transformationFunctions })
    }
}

/** Config read by createScriptTransformerService when running inside ingestion. */
export type ScriptTransformerServiceConfig = Pick<
    CommonConfig,
    'SITE_URL' | 'CDP_FN_RUST_VM_EXECUTION_ENABLED' | 'MMDB_FILE_LOCATION' | 'TRANSFORMATIONS_FN_TIMEOUT_MS'
>

export interface ScriptTransformerServiceDeps {
    geoipService: GeoIPService
    postgres: PostgresRouter
    pubSub: PubSub
    encryptedFields: EncryptedFields
    integrationManager: IntegrationManagerService
    monitoringOutputs: IngestionOutputs<MonitoringOutput>
}

/**
 * Keep this factory's config and dependencies intentionally minimal. Transformations run only the synchronous Script
 * execution core and must not inherit Redis, fetch, email, push, or other CDP delivery infrastructure just to satisfy
 * a shared service constructor. Anything that needs those belongs in ScriptExecutorAsyncService, not in ScriptExecutorService.
 */
export function createScriptTransformerService(
    config: ScriptTransformerServiceConfig,
    deps: ScriptTransformerServiceDeps
): ScriptTransformerService {
    const insightsFunctionManager = new InsightsFunctionManagerService(deps.postgres, deps.pubSub, deps.encryptedFields)
    const scriptInputsService = new ScriptInputsService(deps.integrationManager, undefined, deps.encryptedFields)
    const scriptExecutor = new ScriptExecutorService(
        { executionTimeoutMs: config.TRANSFORMATIONS_FN_TIMEOUT_MS },
        scriptInputsService
    )
    const pluginExecutor = new LegacyPluginExecutorService(deps.postgres, deps.geoipService)
    const insightsFunctionMonitoringService = new InsightsFunctionMonitoringService(deps.monitoringOutputs)
    return new ScriptTransformerService(
        insightsFunctionManager,
        scriptExecutor,
        insightsFunctionMonitoringService,
        pluginExecutor,
        deps.geoipService,
        {
            siteUrl: config.SITE_URL,
            scriptRustVmExecutionEnabled: config.CDP_FN_RUST_VM_EXECUTION_ENABLED,
            mmdbFileLocation: config.MMDB_FILE_LOCATION,
        }
    )
}
