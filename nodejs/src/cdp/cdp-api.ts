import { DateTime } from 'luxon'
import express from 'ultimate-express'

import { ModifiedRequest } from '~/common/api/router'
import { logger } from '~/common/utils/logger'
import { UUID, UUIDT, delay } from '~/common/utils/utils'
import { LogRecord } from '~/logs/log-record-avro'
import {
    DEFAULT_LOG_TRANSFORMATION_TIMEOUT_MS,
    buildLogRecordGlobals,
    executeLogTransformation,
    resolveLogTransformationInputs,
} from '~/logs/transformations/script-log-exec'
import { PluginEvent } from '~/plugin-scaffold'

import {
    HealthCheckResult,
    HealthCheckResultError,
    HealthCheckResultOk,
    PluginServerService,
    PluginsServerConfig,
} from '../types'
import { getAsyncFunctionHandler, getRegisteredAsyncFunctionNames } from './async-function-registry'
import './async-functions'
import { createCdpCoreServices } from './cdp-services'
import { CdpConsumerBaseDeps } from './consumers/cdp-base.consumer'
import {
    CdpSourceWebhooksConsumer,
    InsightsFunctionWebhookResult,
    SourceWebhookError,
} from './consumers/cdp-source-webhooks.consumer'
import { HogTransformerService, createHogTransformerService } from './script-transformations/script-transformer.service'
import { RerunJobManager } from './rerun/rerun-job.manager'
import { RerunRequest } from './rerun/rerun-job.types'
import { InsightsFlowAction } from './schema/hogflow'
import { BatchExportInsightsFunctionService, NotFoundError, ParseError } from './services/batch-export-script-function.service'
import type { CyclotronV2JobProducer } from './services/cyclotron-v2'
import { HogExecutorExecuteAsyncOptions, HogExecutorService, MAX_ASYNC_STEPS } from './services/script-executor.service'
import {
    BatchResolverState,
    HOGFLOW_BATCH_RESOLVE_QUEUE,
    serializeResolverState,
} from './services/insightsflows/batch-resolver.types'
import { InsightsFlowExecutorService, createInsightsFlowInvocation } from './services/insightsflows/hogflow-executor.service'
import { InsightsFlowManagerService } from './services/insightsflows/hogflow-manager.service'
import { matchesWaitUntilCondition } from './services/insightsflows/hogflow-utils'
import { InvocationResultsService } from './services/invocation-results.service'
import { JobQueue } from './services/job-queue/job-queue.interface'
import { GroupsManagerService } from './services/managers/groups-manager.service'
import { InsightsFunctionManagerService } from './services/managers/script-function-manager.service'
import { EmailTrackingService } from './services/messaging/email-tracking.service'
import { EmailTrackingCodeSigner } from './services/messaging/helpers/tracking-code'
import { RecipientTokensService } from './services/messaging/recipient-tokens.service'
import { HogWatcherService, HogWatcherState } from './services/monitoring/script-watcher.service'
import { NativeDestinationExecutorService } from './services/native-destination-executor.service'
import { SegmentDestinationExecutorService } from './services/segment-destination-executor.service'
import { FN_FUNCTION_TEMPLATES } from './templates'
import { InsightsFunctionInvocationGlobals, InsightsFunctionType, MinimalLogEntry } from './types'
import {
    convertToInsightsFunctionInvocationGlobals,
    isNativeInsightsFunction,
    isSegmentPluginInsightsFunction,
    sanitizeLogMessage,
} from './utils'
import { convertToInsightsFunctionFilterGlobal } from './utils/script-function-filtering'
import { JWT, InsightsJwtAudience } from './utils/jwt-utils'

// Allowlist of safe content types for webhook responses to prevent XSS
const SAFE_CONTENT_TYPES = new Set([
    'text/plain',
    'text/csv',
    'application/json',
    'application/octet-stream',
    'application/xml',
    'image/gif',
    'image/png',
    'image/jpeg',
    'image/webp',
])

function sanitizeContentType(contentType: string | undefined, fallback: string): string {
    if (!contentType) {
        return fallback
    }
    const normalized = contentType.toLowerCase().trim().split(';')[0].trim()
    if (SAFE_CONTENT_TYPES.has(normalized)) {
        return normalized
    }
    return fallback
}

// Matches the default email template's `to.email` value: `{{ person.properties.email }}`, whitespace-tolerant.
// Anything else (custom property, computed Liquid, static address) makes the dedupe key diverge from the
// actual send target — see `canDedupeByEmail`.
const DEFAULT_EMAIL_TO_TEMPLATE_RE = /^\s*\{\{\s*person\.properties\.email\s*\}\}\s*$/

function canDedupeByEmail(hogFlow: { actions?: unknown }): boolean {
    if (!Array.isArray(hogFlow.actions)) {
        return false
    }
    const emailActions = hogFlow.actions.filter((action: any) => action?.type === 'function_email')
    if (emailActions.length === 0) {
        return false
    }
    return emailActions.every((action: any) => {
        const toEmail = action?.config?.inputs?.email?.value?.to?.email
        return typeof toEmail === 'string' && DEFAULT_EMAIL_TO_TEMPLATE_RE.test(toEmail)
    })
}

export type CdpApiConfig = PluginsServerConfig
export type CdpApiDeps = CdpConsumerBaseDeps

export class CdpApi {
    private hogExecutor: HogExecutorService
    private nativeDestinationExecutorService: NativeDestinationExecutorService
    private segmentDestinationExecutorService: SegmentDestinationExecutorService

    private insightsFunctionManager: InsightsFunctionManagerService
    private hogFlowManager: InsightsFlowManagerService

    private hogFlowExecutor: InsightsFlowExecutorService
    private hogWatcher: HogWatcherService
    private hogTransformer: HogTransformerService
    private invocationResultsService: InvocationResultsService
    private rerunJobManager: RerunJobManager | null = null
    private cdpSourceWebhooksConsumer: CdpSourceWebhooksConsumer
    private hogQueue: JobQueue
    private hogflowQueue: JobQueue
    private emailTrackingService: EmailTrackingService
    private recipientTokensService: RecipientTokensService
    private batchExportInsightsFunctionService: BatchExportInsightsFunctionService
    private groupsManager: GroupsManagerService
    private batchResolverProducer: CyclotronV2JobProducer | null
    // Scoped auth for the reschedule_parked route (exempted from the shared internal-secret
    // middleware): Django mints per-call JWTs pinned to a team + workflow. Null when the key
    // isn't provisioned — the route then fails closed.
    private rescheduleJwt: JWT | null

    constructor(
        private config: PluginsServerConfig,
        private deps: CdpApiDeps,
        jobQueues: { hogQueue: JobQueue; hogflowQueue: JobQueue },
        batchResolverProducer: CyclotronV2JobProducer | null = null
    ) {
        const services = createCdpCoreServices(config, deps, 'cdp-api-redis')

        this.insightsFunctionManager = services.insightsFunctionManager
        this.hogFlowManager = services.hogFlowManager
        this.recipientTokensService = services.recipientTokensService
        this.hogExecutor = services.hogExecutor
        this.hogFlowExecutor = services.hogFlowExecutor
        this.nativeDestinationExecutorService = services.nativeDestinationExecutorService
        this.segmentDestinationExecutorService = services.segmentDestinationExecutorService
        this.hogWatcher = services.hogWatcher
        this.invocationResultsService = services.invocationResultsService

        // API-only services. The script-transformer's monitoring service reuses the same
        // resolved outputs registry as the core CDP services — no separate construction.
        this.hogTransformer = createHogTransformerService(config, {
            ...deps,
            monitoringOutputs: services.outputs,
        })
        this.hogQueue = jobQueues.hogQueue
        this.hogflowQueue = jobQueues.hogflowQueue
        this.cdpSourceWebhooksConsumer = new CdpSourceWebhooksConsumer(config, deps, jobQueues)
        this.emailTrackingService = new EmailTrackingService(
            this.insightsFunctionManager,
            this.hogFlowManager,
            services.insightsFunctionMonitoringService,
            services.capturedEventsService,
            services.teamWorkflowsConfigService,
            new EmailTrackingCodeSigner(config.ENCRYPTION_SALT_KEYS, config.CDP_EMAIL_TRACKING_URL),
            services.emailSuppressionService
        )
        this.groupsManager = new GroupsManagerService(deps.teamManager, deps.groupRepository)
        this.batchExportInsightsFunctionService = new BatchExportInsightsFunctionService(
            config.SITE_URL,
            deps.teamManager,
            this.groupsManager,
            this.insightsFunctionManager,
            this.hogExecutor,
            this.hogWatcher,
            this.invocationResultsService
        )
        this.batchResolverProducer = batchResolverProducer
        this.rescheduleJwt = config.WORKFLOWS_RESCHEDULE_JWT_SECRET
            ? new JWT(config.WORKFLOWS_RESCHEDULE_JWT_SECRET)
            : null
    }

    public get service(): PluginServerService {
        return {
            id: 'cdp-api',
            onShutdown: async () => await this.stop(),
            healthcheck: () => this.isHealthy() ?? new HealthCheckResultError('CDP API is not healthy', {}),
        }
    }

    async start(): Promise<void> {
        // CdpSourceWebhooksConsumer.start() calls startAsProducer on both queues
        await this.cdpSourceWebhooksConsumer.start()

        // Rerun endpoints don't run the work — they just enqueue a wrapper
        // job onto the cyclotron-v2 'rerun' queue. A dedicated consumer
        // (`CdpRerunWorkerConsumer`) deployed as PLUGIN_SERVER_MODE=cdp-rerun-worker
        // pages Datastore, rehydrates invocations, and commits progress back
        // to the wrapper job via reschedule(state).
        if (this.config.CYCLOTRON_NODE_DATABASE_URL) {
            this.rerunJobManager = new RerunJobManager({
                dbUrl: this.config.CYCLOTRON_NODE_DATABASE_URL,
                maxCount: this.config.FN_INVOCATION_RERUN_MAX_COUNT,
            })
            await this.rerunJobManager.connect()
        }
    }

    async stop(): Promise<void> {
        // CdpSourceWebhooksConsumer.stop() calls stopProducer on both queues
        await Promise.all([
            this.cdpSourceWebhooksConsumer.stop(),
            this.batchExportInsightsFunctionService.stop(),
            this.rerunJobManager?.disconnect() ?? Promise.resolve(),
        ])
    }

    isHealthy(): HealthCheckResult {
        // NOTE: There isn't really anything to check for here so we are just always healthy
        return new HealthCheckResultOk()
    }

    router(): express.Router {
        const router = express.Router()

        const asyncHandler =
            (fn: (req: ModifiedRequest, res: express.Response) => Promise<void>) =>
            (req: ModifiedRequest, res: express.Response, next: express.NextFunction): Promise<void> =>
                fn(req, res).catch(next)

        // API routes (authentication handled globally by middleware)
        router.post('/api/projects/:team_id/insights_functions/:id/invocations', asyncHandler(this.postFunctionInvocation))
        router.post('/api/projects/:team_id/hog_flows/:id/invocations', asyncHandler(this.insightsflowInvocation))
        router.post(
            '/api/projects/:team_id/hog_flows/:id/scheduled_invocations',
            asyncHandler(this.insightsflowScheduledInvocation)
        )
        router.post(
            '/api/projects/:team_id/hog_flows/:id/batch_invocations/:parent_run_id',
            asyncHandler(this.postInsightsFlowBatchInvocation)
        )
        router.post(
            '/api/projects/:team_id/insights_functions/:id/rerun',
            asyncHandler(this.postRerunInvocations('insights_function'))
        )
        router.post('/api/projects/:team_id/hog_flows/:id/rerun', asyncHandler(this.postRerunInvocations('hog_flow')))
        router.get('/api/projects/:team_id/hog_flows/:id/in_flight_count', asyncHandler(this.getInsightsFlowInFlightCount))
        router.post(
            '/api/projects/:team_id/hog_flows/:id/reschedule_parked',
            asyncHandler(this.postInsightsFlowRescheduleParked)
        )
        router.get('/api/projects/:team_id/insights_functions/:id/status', asyncHandler(this.getFunctionStatus()))
        router.patch('/api/projects/:team_id/insights_functions/:id/status', asyncHandler(this.patchFunctionStatus()))
        router.get('/api/insights_functions/states', asyncHandler(this.getFunctionStates()))
        router.get('/api/insights_function_templates', this.getInsightsFunctionTemplates)
        router.post('/api/messaging/generate_preferences_token', asyncHandler(this.generatePreferencesToken()))
        router.get('/api/messaging/validate_preferences_token/:token', asyncHandler(this.validatePreferencesToken()))
        router.post(
            '/api/projects/:team_id/insights_functions/:insights_function_id/batch_export_invocations',
            asyncHandler(this.handleBatchExportInsightsFunction())
        )

        const publicBodySizeLimit = (req: ModifiedRequest, res: express.Response, next: express.NextFunction): void => {
            if (req.rawBody && req.rawBody.length > 512_000) {
                res.status(413).json({ error: 'Request entity too large' })
                return
            }
            next()
        }

        // Public routes (excluded from authentication by middleware)
        router.post(
            '/public/webhooks/dwh/:webhook_id',
            publicBodySizeLimit,
            asyncHandler(this.handleWarehouseSourceWebhook())
        )
        router.post('/public/webhooks/:webhook_id', publicBodySizeLimit, asyncHandler(this.handleWebhook()))
        router.get('/public/webhooks/:webhook_id', asyncHandler(this.handleWebhook()))
        router.get('/public/m/pixel', asyncHandler(this.getEmailTrackingPixel()))
        router.post('/public/m/ses_webhook', publicBodySizeLimit, express.text(), asyncHandler(this.postSesWebhook()))
        router.get('/public/m/redirect', asyncHandler(this.getEmailTrackingRedirect()))

        return router
    }

    private getInsightsFunctionTemplates = (req: ModifiedRequest, res: express.Response): void => {
        res.json(FN_FUNCTION_TEMPLATES)
    }

    private getFunctionStatus =
        () =>
        async (req: ModifiedRequest, res: express.Response): Promise<void> => {
            const { id } = req.params
            const summary = await this.hogWatcher.getPersistedState(id)

            res.json(summary)
        }

    private patchFunctionStatus =
        () =>
        async (req: ModifiedRequest, res: express.Response): Promise<void> => {
            const { id } = req.params
            const { state } = req.body

            // Check that state is valid
            if (!Object.values(HogWatcherState).includes(state)) {
                res.status(400).json({ error: 'Invalid state' })
                return
            }

            const summary = await this.hogWatcher.getPersistedState(id)
            const insightsFunction = await this.insightsFunctionManager.fetchInsightsFunction(id)

            if (!insightsFunction) {
                res.status(404).json({ error: 'Script function not found' })
                return
            }

            // Only allow patching the status if it is different from the current status

            if (summary.state !== state) {
                await this.hogWatcher.forceStateChange(insightsFunction, state)
            }

            // Hacky - wait for a little to give a chance for the state to change
            await delay(100)

            res.json(await this.hogWatcher.getPersistedState(id))
        }

    private getFunctionStates =
        () =>
        async (req: ModifiedRequest, res: express.Response): Promise<void> => {
            try {
                const allStates = await this.hogWatcher.getAllFunctionStates()

                // Transform the data for better consumption by Grafana and sort by tokens ascending
                const statesArray = Object.entries(allStates)
                    .map(([functionId, state]) => ({
                        function_id: functionId,
                        state: HogWatcherState[state.state], // Convert numeric state to readable string
                        tokens: state.tokens,
                        state_numeric: state.state,
                    }))
                    .sort((a, b) => b.state_numeric - a.state_numeric)

                const insightsFunctions = await this.insightsFunctionManager.getInsightsFunctions(
                    statesArray.map((x) => x.function_id)
                )

                const results = statesArray.map((x) => ({
                    ...x,
                    function_name: insightsFunctions[x.function_id]?.name,
                    function_team_id: insightsFunctions[x.function_id]?.team_id,
                    function_type: insightsFunctions[x.function_id]?.type,
                    function_enabled: insightsFunctions[x.function_id]?.enabled && !insightsFunctions[x.function_id]?.deleted,
                }))

                res.json({
                    results,
                    total: results.length,
                })
            } catch (error) {
                logger.error('[CdpApi] Error getting all function states', error)
                res.status(500).json({ error: 'Failed to get function states' })
            }
        }

    private postFunctionInvocation = async (req: ModifiedRequest, res: express.Response): Promise<any> => {
        try {
            const { id, team_id } = req.params
            const { datastore_event, mock_async_functions, configuration, invocation_id } = req.body
            let { globals } = req.body

            // Redact configuration: it carries function inputs (auth headers, API keys) that must not land in logs
            logger.info('⚡️', 'Received invocation', {
                id,
                team_id,
                body: { ...req.body, configuration: configuration ? '[redacted]' : undefined },
            })

            const invocationID = invocation_id ?? new UUIDT().toString()

            // Check the invocationId is a valid UUID
            if (!UUID.validateString(invocationID)) {
                res.status(400).json({ error: 'Invalid invocation ID' })
                return
            }

            const isNewFunction = req.params.id === 'new'

            const insightsFunction = isNewFunction
                ? null
                : await this.insightsFunctionManager.fetchInsightsFunction(req.params.id).catch(() => null)
            const team = await this.deps.teamManager.getTeam(parseInt(team_id)).catch(() => null)

            if (!team) {
                return res.status(404).json({ error: 'Team not found' })
            }

            globals = datastore_event
                ? convertToInsightsFunctionInvocationGlobals(datastore_event, team, this.config.SITE_URL)
                : globals

            const functionType: string | undefined = configuration?.type ?? insightsFunction?.type

            if (functionType === 'transformation_log') {
                // Log transformations run against a log record, not an event
                if (!globals?.record || typeof globals.record !== 'object' || Array.isArray(globals.record)) {
                    res.status(400).json({ error: 'Missing record' })
                    return
                }
            } else if (!globals || !globals.event) {
                res.status(400).json({ error: 'Missing event' })
                return
            }

            // NOTE: We allow the script function to be null if it is a "new" script function
            // The real security happens at the django layer so this is more of a sanity check
            if (!isNewFunction && (!insightsFunction || insightsFunction.team_id !== team.id)) {
                return res.status(404).json({ error: 'Script function not found' })
            }

            // We use the provided config if given, otherwise the function's config
            const compoundConfiguration: InsightsFunctionType = {
                ...insightsFunction,
                ...configuration,
                team_id: team.id,
            }

            let logs: MinimalLogEntry[] = []
            let result: any = null
            const errors: any[] = []

            const triggerGlobals: InsightsFunctionInvocationGlobals = {
                ...globals,
                project: {
                    id: team.id,
                    name: team.name,
                    url: `${this.config.SITE_URL}/project/${team.id}`,
                    ...globals.project,
                },
            }

            if (['destination', 'internal_destination'].includes(compoundConfiguration.type)) {
                const {
                    invocations,
                    logs: filterLogs,
                    metrics: filterMetrics,
                } = await this.hogExecutor.buildInsightsFunctionInvocations([compoundConfiguration], triggerGlobals)

                // Add metrics to the logs
                filterMetrics.forEach((metric) => {
                    if (metric.metric_name === 'filtered') {
                        logs.push({
                            level: 'info',
                            timestamp: DateTime.now(),
                            message: `Mapping trigger not matching filters was ignored.`,
                        })
                    }
                })

                filterLogs.forEach((log) => {
                    logs.push(log)
                })

                for (const invocation of invocations) {
                    invocation.id = invocationID

                    const sensitiveValues = this.hogExecutor.getSensitiveValues(
                        invocation.insightsFunction,
                        invocation.state.globals.inputs ?? {}
                    )
                    const options: HogExecutorExecuteAsyncOptions = buildHogExecutorAsyncOptions(
                        mock_async_functions,
                        logs,
                        sensitiveValues
                    )
                    options.sendEmailsInline = true

                    let response: any = null
                    if (isNativeInsightsFunction(compoundConfiguration)) {
                        response = await this.nativeDestinationExecutorService.execute(invocation)
                    } else if (isSegmentPluginInsightsFunction(compoundConfiguration)) {
                        response = await this.segmentDestinationExecutorService.execute(invocation)
                    } else {
                        response = await this.hogExecutor.executeWithAsyncFunctions(invocation, options)
                    }

                    logs = logs.concat(response.logs)
                    if (response.error) {
                        errors.push(response.error)
                    }
                }

                const wasSkipped = invocations.length === 0

                res.json({
                    result: result,
                    status: errors.length > 0 ? 'error' : wasSkipped ? 'skipped' : 'success',
                    errors: errors.map((e) => String(e)),
                    logs: logs,
                })
            } else if (compoundConfiguration.type === 'transformation') {
                // NOTE: We override the ID so that the transformer doesn't cache the result
                // TODO: We could do this with a "special" ID to indicate no caching...
                compoundConfiguration.id = new UUIDT().toString()
                const pluginEvent: PluginEvent = {
                    ...triggerGlobals.event,
                    ip:
                        typeof triggerGlobals.event.properties.$ip === 'string'
                            ? triggerGlobals.event.properties.$ip
                            : null,
                    site_url: triggerGlobals.project.url,
                    team_id: triggerGlobals.project.id,
                    now: '',
                }
                const response = await this.hogTransformer.transformEvent(pluginEvent, [compoundConfiguration])

                result = response.event

                for (const invocationResult of response.invocationResults) {
                    logs = logs.concat(invocationResult.logs)
                    if (invocationResult.error) {
                        errors.push(invocationResult.error)
                    }
                }

                const wasSkipped = response.invocationResults.some((r) =>
                    r.metrics.some((m) => m.metric_name === 'filtered')
                )

                res.json({
                    result: result,
                    status: errors.length > 0 ? 'error' : wasSkipped ? 'skipped' : 'success',
                    errors: errors.map((e) => String(e)),
                    logs: logs,
                })
            } else if (compoundConfiguration.type === 'transformation_log') {
                const mock = globals.record as Record<string, unknown>

                const toStringMap = (value: unknown): Record<string, string> => {
                    const map: Record<string, string> = {}
                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                        for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
                            if (entry !== null && entry !== undefined) {
                                map[key] = typeof entry === 'string' ? entry : JSON.stringify(entry)
                            }
                        }
                    }
                    return map
                }

                // Mock log record from the request; trace/span ids stay null (they are
                // read-only in transformations and not meaningful for a test run).
                const record: LogRecord = {
                    uuid: invocationID,
                    trace_id: null,
                    span_id: null,
                    trace_flags: null,
                    timestamp: typeof mock.timestamp === 'number' ? mock.timestamp : DateTime.now().toMillis() * 1e6,
                    observed_timestamp: typeof mock.observed_timestamp === 'number' ? mock.observed_timestamp : null,
                    body: typeof mock.body === 'string' ? mock.body : null,
                    severity_text: typeof mock.severity_text === 'string' ? mock.severity_text : null,
                    severity_number: typeof mock.severity_number === 'number' ? mock.severity_number : null,
                    service_name: typeof mock.service_name === 'string' ? mock.service_name : null,
                    resource_attributes: toStringMap(mock.resource_attributes),
                    instrumentation_scope:
                        typeof mock.instrumentation_scope === 'string' ? mock.instrumentation_scope : null,
                    event_name: typeof mock.event_name === 'string' ? mock.event_name : null,
                    attributes: toStringMap(mock.attributes),
                    bytes_uncompressed: null,
                }

                const hogGlobals = buildLogRecordGlobals(record, triggerGlobals.project, {})

                try {
                    hogGlobals.inputs = resolveLogTransformationInputs(
                        compoundConfiguration,
                        hogGlobals,
                        DEFAULT_LOG_TRANSFORMATION_TIMEOUT_MS
                    ).inputs
                } catch (e) {
                    return res.json({
                        result: null,
                        status: 'error',
                        errors: [String(e)],
                        logs,
                    })
                }

                // Derive from the resolved inputs (which merge inputs + encrypted_inputs) like the
                // destination test path does — Django resolves stored secrets into `inputs`, so
                // collecting from `encrypted_inputs` alone would leave them unredacted in test logs.
                const sensitiveValues = this.hogExecutor.getSensitiveValues(
                    compoundConfiguration,
                    (hogGlobals.inputs ?? {}) as Record<string, any>
                )

                const outcome = executeLogTransformation(compoundConfiguration.bytecode, record, hogGlobals, {
                    sensitiveValues,
                })

                logs = logs.concat(
                    outcome.logs.map((message) => ({
                        level: 'info' as const,
                        timestamp: DateTime.now(),
                        message,
                    }))
                )

                if (outcome.status === 'failed') {
                    errors.push(outcome.error)
                } else if (outcome.status === 'dropped') {
                    logs.push({
                        level: 'info',
                        timestamp: DateTime.now(),
                        message: 'Record dropped by transformation.',
                    })
                }

                // Same record shape the function saw (hex ids, string maps) — null when dropped
                result =
                    outcome.status === 'dropped'
                        ? null
                        : buildLogRecordGlobals(record, triggerGlobals.project, {}).record

                res.json({
                    result: result,
                    status: errors.length > 0 ? 'error' : 'success',
                    errors: errors.map((e) => String(e)),
                    logs: logs,
                })
            } else {
                return res.status(400).json({ error: 'Invalid function type' })
            }
        } catch (e) {
            console.error(e)
            res.status(500).json({ errors: [e.message] })
        } finally {
            await this.invocationResultsService.flush()
        }
    }

    private insightsflowInvocation = async (req: ModifiedRequest, res: express.Response): Promise<any> => {
        try {
            const { id, team_id } = req.params
            const { datastore_event, configuration, invocation_id, current_action_id, mock_async_functions } = req.body

            // Redact configuration: it carries action inputs (auth headers, API keys) that must not land in logs
            logger.info('⚡️', 'Received hogflow invocation', {
                id,
                team_id,
                body: { ...req.body, configuration: configuration ? '[redacted]' : undefined },
            })

            const invocationID = invocation_id ?? new UUIDT().toString()

            // Check the invocationId is a valid UUID
            if (!UUID.validateString(invocationID)) {
                res.status(400).json({ error: 'Invalid invocation ID' })
                return
            }

            const isNewInsightsFlow = req.params.id === 'new'
            const hogFlow = isNewInsightsFlow ? null : await this.hogFlowManager.getInsightsFlow(req.params.id)

            const team = await this.deps.teamManager.getTeam(parseInt(team_id)).catch(() => null)

            if (!team) {
                return res.status(404).json({ error: 'Team not found' })
            }

            // NOTE: We allow the script flow to be null if it is a "new" script flow
            // The real security happens at the django layer so this is more of a sanity check
            if (!isNewInsightsFlow && (!hogFlow || hogFlow.team_id !== team.id)) {
                return res.status(404).json({ error: 'Script flow not found' })
            }

            const globals: InsightsFunctionInvocationGlobals | null = datastore_event
                ? convertToInsightsFunctionInvocationGlobals(
                      datastore_event,
                      team,
                      this.config.SITE_URL ?? 'http://localhost:8000'
                  )
                : req.body.globals

            if (!globals || !globals.event) {
                return res.status(400).json({ error: 'Missing event' })
            }

            // We use the provided config if given, otherwise the flow's config
            const compoundConfiguration = {
                ...hogFlow,
                ...configuration,
                team_id: team.id,
            }

            // Mirror real execution: resolve groups server-side from the event's $groups so test-run
            // conditionals branch on group properties. Only resolve when the caller didn't supply
            // groups, so hand-edited test payloads are respected.
            if (!globals.groups || Object.keys(globals.groups).length === 0) {
                globals.groups = await this.groupsManager.getGroupsForEvent(
                    team.id,
                    globals.event.properties,
                    `${this.config.SITE_URL ?? 'http://localhost:8000'}/project/${team.id}`
                )
            }

            const triggerGlobals: InsightsFunctionInvocationGlobals = {
                ...globals,
                project: {
                    id: team.id,
                    name: team.name,
                    url: `${this.config.SITE_URL ?? 'http://localhost:8000'}/project/${team.id}`,
                },
            }

            const filterGlobals = convertToInsightsFunctionFilterGlobal({
                event: globals.event,
                person: globals.person,
                groups: globals.groups,
                variables: globals.variables || {},
            })

            const invocation = createInsightsFlowInvocation(triggerGlobals, compoundConfiguration, filterGlobals)

            invocation.state.currentAction = current_action_id
                ? {
                      id: current_action_id,
                      startedAtTimestamp: Date.now(),
                  }
                : undefined

            const logs: MinimalLogEntry[] = []

            // In production a wait_until_condition step's "events to wait for" are evaluated by the
            // subscription matcher against incoming events (never by the executor), so a plain
            // executeCurrentAction could not advance past one. Simulate the matcher here: when the
            // supplied test event matches, tag the invocation the same way a real match would, and
            // the handler advances to the next step.
            const currentAction: InsightsFlowAction | undefined = current_action_id
                ? compoundConfiguration.actions?.find((a: InsightsFlowAction) => a.id === current_action_id)
                : undefined
            if (currentAction?.type === 'wait_until_condition' && invocation.state.currentAction) {
                const matched = await matchesWaitUntilCondition(currentAction, filterGlobals, {
                    hogFlowId: isNewInsightsFlow ? 'new' : id,
                    actionId: currentAction.id,
                })
                if (matched) {
                    invocation.state.currentAction.eventMatched = true
                    invocation.state.currentAction.eventMatchedEvent = globals.event.event
                    invocation.state.currentAction.eventMatchedEventUuid = globals.event.uuid
                    invocation.state.currentAction.eventMatchedEventTimestamp = globals.event.timestamp
                }
                logs.push({
                    level: 'info',
                    timestamp: DateTime.now(),
                    message: matched
                        ? `Test event '${globals.event.event}' matched the wait conditions`
                        : `Test event '${globals.event.event}' did not match the wait conditions - the workflow would continue waiting`,
                })
            }

            // Redact the flow's decrypted secret inputs from the mocked async-function logs, so a test
            // run can't echo a stored credential (e.g. an Authorization header) back to the caller.
            const sensitiveValues = await this.hogFlowExecutor.getSensitiveValues(compoundConfiguration)
            const options: HogExecutorExecuteAsyncOptions = buildHogExecutorAsyncOptions(
                mock_async_functions,
                logs,
                sensitiveValues
            )
            options.sendEmailsInline = true
            const result = await this.hogFlowExecutor.executeCurrentAction(invocation, { hogExecutorOptions: options })

            res.json({
                nextActionId: result.invocation.state.currentAction?.id,
                status: result.error ? 'error' : 'success',
                errors: result.error ? [result.error] : [],
                logs: [...result.logs, ...logs],
                variables: result.invocation.state.variables ?? {},
                execResult: result.execResult ?? null,
            })
        } catch (e) {
            console.error(e)
            res.status(500).json({ error: [e.message] })
        }
    }

    private insightsflowScheduledInvocation = async (req: ModifiedRequest, res: express.Response): Promise<any> => {
        try {
            const { id, team_id } = req.params
            const { variables } = req.body

            logger.info('⚡️', 'Received hogflow scheduled invocation', { id, team_id })

            const team = await this.deps.teamManager.getTeam(parseInt(team_id)).catch(() => null)
            if (!team) {
                return res.status(404).json({ error: 'Team not found' })
            }

            const hogFlow = await this.hogFlowManager.getInsightsFlow(id)
            if (!hogFlow || hogFlow.team_id !== team.id) {
                return res.status(404).json({ error: 'Workflow not found' })
            }

            if (hogFlow.trigger?.type !== 'schedule') {
                return res.status(400).json({ error: 'Workflow trigger must be of type "schedule"' })
            }

            // Build a synthetic event for the scheduled run. Schedule triggers don't have a real
            // event, but the executor expects one to populate globals.event used by downstream actions.
            const syntheticEvent: InsightsFunctionInvocationGlobals['event'] = {
                uuid: new UUIDT().toString(),
                event: '$workflow_scheduled',
                distinct_id: `workflow-${hogFlow.id}`,
                timestamp: DateTime.now().toISO(),
                url: '',
                properties: {},
                elements_chain: '',
            }

            const triggerGlobals: InsightsFunctionInvocationGlobals = {
                event: syntheticEvent,
                project: {
                    id: team.id,
                    name: team.name,
                    url: `${this.config.SITE_URL ?? 'http://localhost:8000'}/project/${team.id}`,
                },
                variables: variables ?? {},
            }

            const filterGlobals = convertToInsightsFunctionFilterGlobal({
                event: syntheticEvent,
                person: undefined,
                groups: {},
                variables: variables ?? {},
            })

            const invocation = createInsightsFlowInvocation(triggerGlobals, hogFlow, filterGlobals)

            await this.hogflowQueue.queueInvocations([invocation])

            res.json({ status: 'queued', invocation_id: invocation.id })
        } catch (e) {
            logger.error('Error handling hogflow scheduled invocation', { error: e })
            res.status(500).json({ error: [e.message] })
        }
    }

    // Rerun endpoints don't run the work — they just enqueue a wrapper job
    // onto the cyclotron-v2 'rerun' queue. The dedicated `CdpRerunWorkerConsumer`
    // picks it up, pages Datastore, rehydrates invocations onto the regular
    // queue, and commits progress back to the wrapper job's state.
    private postRerunInvocations =
        (functionKind: 'insights_function' | 'hog_flow') =>
        async (req: ModifiedRequest, res: express.Response): Promise<any> => {
            try {
                if (!this.rerunJobManager) {
                    return res.status(503).json({
                        error: 'Rerun manager not initialized (CYCLOTRON_NODE_DATABASE_URL unset)',
                    })
                }

                const { team_id, id } = req.params
                const team = await this.deps.teamManager.getTeam(parseInt(team_id)).catch(() => null)
                if (!team) {
                    return res.status(404).json({ error: 'Team not found' })
                }

                if (functionKind === 'insights_function') {
                    const insightsFunction = await this.insightsFunctionManager.getInsightsFunction(id)
                    if (!insightsFunction || insightsFunction.team_id !== team.id) {
                        return res.status(404).json({ error: 'Script function not found' })
                    }
                } else {
                    const hogFlow = await this.hogFlowManager.getInsightsFlow(id)
                    if (!hogFlow || hogFlow.team_id !== team.id) {
                        return res.status(404).json({ error: 'Script flow not found' })
                    }
                }

                const rerunRequest = req.body as RerunRequest
                const rerunJobId = await this.rerunJobManager.enqueue(team.id, functionKind, id, rerunRequest)

                // Surface the wrapper job in the Invocations list immediately —
                // a 'running' lifecycle row + a `rerun_queued` log line. Both
                // share the same `instance_id = rerun_job_id` so the logs
                // viewer in the row's expand panel picks them up automatically.
                const now = new Date()
                this.invocationResultsService.invocationResultsRowsService.queueRerunWrapperRow({
                    teamId: team.id,
                    parentFunctionKind: functionKind,
                    functionId: id,
                    rerunJobId,
                    status: 'running',
                    pagesProcessed: 0,
                    filter: rerunRequest.filter,
                    scheduledAt: now,
                    startedAt: now,
                })
                this.invocationResultsService.monitoringService.queueLogs(
                    [
                        {
                            team_id: team.id,
                            log_source: functionKind,
                            log_source_id: id,
                            instance_id: rerunJobId,
                            timestamp: DateTime.fromJSDate(now),
                            level: 'info',
                            message: `Re-run queued. Filter: ${JSON.stringify(rerunRequest.filter)}`,
                        },
                    ],
                    functionKind
                )
                await this.invocationResultsService.flush()

                logger.info('⚡️', 'Rerun job enqueued', {
                    function_kind: functionKind,
                    function_id: id,
                    team_id: team.id,
                    rerun_job_id: rerunJobId,
                })
                res.json({ rerun_job_id: rerunJobId, queued_count: 0, skipped_count: 0 })
            } catch (e) {
                logger.error('Error enqueueing rerun job', {
                    error: e instanceof Error ? e.message : String(e),
                })
                res.status(500).json({ error: e instanceof Error ? e.message : String(e) })
            }
        }

    // How many of this workflow's runs are still in flight (parked on waits/delays or actively
    // executing). Django calls this to show publish/edit impact before a live workflow changes.
    private getInsightsFlowInFlightCount = async (req: ModifiedRequest, res: express.Response): Promise<any> => {
        try {
            if (!this.batchResolverProducer) {
                return res.status(503).json({
                    error: 'Cyclotron producer not initialized (CYCLOTRON_NODE_DATABASE_URL unset)',
                })
            }

            const { team_id, id } = req.params
            const team = await this.deps.teamManager.getTeam(parseInt(team_id)).catch(() => null)
            if (!team) {
                return res.status(404).json({ error: 'Team not found' })
            }

            const hogFlow = await this.hogFlowManager.getInsightsFlow(id)
            if (!hogFlow || hogFlow.team_id !== team.id) {
                return res.status(404).json({ error: 'Workflow not found' })
            }

            const counts = await this.batchResolverProducer.countInFlightJobs(team.id, id)
            return res.json({
                count: counts.count,
                by_action: counts.byAction,
                position_unknown: counts.positionUnknown,
            })
        } catch (e) {
            logger.error('Error counting in-flight script flow jobs', {
                error: e instanceof Error ? e.message : String(e),
            })
            return res.status(500).json({ error: e instanceof Error ? e.message : String(e) })
        }
    }

    // Pull forward the wake times of this workflow's parked jobs after a timing edit. Django
    // calls this (via a Celery task) when a published/saved change shortened a delay or moved a
    // wait window; one call is one slice, and the caller loops with the returned bounds until
    // `done`. See CyclotronV2Manager.rescheduleParkedJobs for the sweep semantics.
    //
    // Auth: a scoped JWT minted by Django per call, pinned to this team + workflow — NOT the
    // fleet-wide internal secret (the route is exempted from that middleware). Fails closed when
    // the key isn't provisioned.
    private postInsightsFlowRescheduleParked = async (req: ModifiedRequest, res: express.Response): Promise<any> => {
        try {
            if (!this.batchResolverProducer) {
                return res.status(503).json({
                    error: 'Cyclotron producer not initialized (CYCLOTRON_NODE_DATABASE_URL unset)',
                })
            }
            if (!this.rescheduleJwt) {
                return res.status(503).json({
                    error: 'Reschedule auth not configured (WORKFLOWS_RESCHEDULE_JWT_SECRET unset)',
                })
            }

            const { team_id, id } = req.params

            const authHeader = req.headers['authorization']
            const token =
                typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined
            const claims = token
                ? (this.rescheduleJwt.verify(token, InsightsJwtAudience.WORKFLOWS_RESCHEDULE_PARKED, {
                      ignoreVerificationErrors: true,
                  }) as { team_id?: number; hog_flow_id?: string } | undefined)
                : undefined
            // The claims pin the token to one team + workflow, so a leaked token can't sweep anything else.
            if (!claims || claims.team_id !== parseInt(team_id) || claims.hog_flow_id !== id) {
                return res.status(401).json({ error: 'Unauthorized: Invalid reschedule token' })
            }

            const team = await this.deps.teamManager.getTeam(parseInt(team_id)).catch(() => null)
            if (!team) {
                return res.status(404).json({ error: 'Team not found' })
            }

            const hogFlow = await this.hogFlowManager.getInsightsFlow(id)
            if (!hogFlow || hogFlow.team_id !== team.id) {
                return res.status(404).json({ error: 'Workflow not found' })
            }

            const body = req.body ?? {}
            const actionIds = body.action_ids
            if (
                !Array.isArray(actionIds) ||
                actionIds.length === 0 ||
                actionIds.length > 100 ||
                !actionIds.every((a: unknown) => typeof a === 'string' && a.length > 0)
            ) {
                return res.status(400).json({ error: 'action_ids must be a non-empty array of up to 100 strings' })
            }
            const sweepFloor = body.sweep_floor ? new Date(body.sweep_floor) : undefined
            const sweepUntil = body.sweep_until ? new Date(body.sweep_until) : undefined
            if ((sweepFloor && isNaN(sweepFloor.getTime())) || (sweepUntil && isNaN(sweepUntil.getTime()))) {
                return res.status(400).json({ error: 'sweep_floor and sweep_until must be ISO datetimes' })
            }
            if (
                (sweepFloor === undefined) !== (sweepUntil === undefined) ||
                (sweepFloor && sweepUntil && sweepFloor >= sweepUntil)
            ) {
                return res
                    .status(400)
                    .json({ error: 'sweep_floor and sweep_until must be passed together, with floor before until' })
            }

            const result = await this.batchResolverProducer.rescheduleParkedJobs({
                teamId: team.id,
                functionId: id,
                actionIds,
                sweepFloor,
                sweepUntil,
            })
            return res.json({
                swept: result.swept,
                remaining: result.remaining,
                done: result.done,
                sweep_floor: result.sweepFloor.toISOString(),
                sweep_until: result.sweepUntil.toISOString(),
            })
        } catch (e) {
            logger.error('Error rescheduling parked script flow jobs', {
                error: e instanceof Error ? e.message : String(e),
            })
            return res.status(500).json({ error: e instanceof Error ? e.message : String(e) })
        }
    }

    private postInsightsFlowBatchInvocation = async (req: ModifiedRequest, res: express.Response): Promise<any> => {
        try {
            const { id, team_id, parent_run_id } = req.params

            logger.info('⚡️', 'Received hogflow batch invocation', { id, team_id, parent_run_id })

            const team = await this.deps.teamManager.getTeam(parseInt(team_id)).catch(() => null)

            if (!team) {
                return res.status(404).json({ error: 'Team not found' })
            }

            const hogFlow = await this.hogFlowManager.getInsightsFlow(id)

            if (!hogFlow || hogFlow.team_id !== team.id) {
                return res.status(404).json({ error: 'Workflow not found' })
            }

            if (hogFlow.trigger.type !== 'batch') {
                return res.status(400).json({ error: 'Only batch Workflows are supported for batch jobs' })
            }

            const maxAudienceSize =
                typeof req.body.max_audience_size === 'number' ? req.body.max_audience_size : undefined

            if (!this.batchResolverProducer) {
                throw new Error('Batch resolver producer is not configured (missing CYCLOTRON_NODE_DATABASE_URL)')
            }

            const initialState: BatchResolverState = {
                batchJobId: parent_run_id,
                teamId: team.id,
                hogFlowId: hogFlow.id,
                filters: {
                    // Prefer the audience snapshot validated at dispatch time - re-reading the live
                    // trigger here would let an edit landing after the confirm check widen the send.
                    // Fallback covers callers that predate the snapshot.
                    properties: req.body.filters?.properties ?? (hogFlow.trigger.filters.properties || []),
                    filter_test_accounts:
                        req.body.filters?.filter_test_accounts ??
                        (hogFlow.trigger.filters.filter_test_accounts || false),
                },
                variables: req.body.variables ?? {},
                groupTypeIndex: typeof req.body.group_type_index === 'number' ? req.body.group_type_index : undefined,
                // Only dedupe by email when every email action's `to` template is exactly the default
                // `{{ person.properties.email }}`. Custom recipients (work_email, computed Liquid, static
                // strings) would make the dedupe key diverge from the actual send target — better to skip
                // dedupe than dedupe wrongly. Also skip when the flow has no email action at all.
                dedupeKey: canDedupeByEmail(hogFlow) ? ('email' as const) : undefined,
                maxAudienceSize: maxAudienceSize ?? this.config.CDP_BATCH_WORKFLOW_MAX_AUDIENCE_SIZE,
                cursor: null,
                totalEnqueued: 0,
                pagesProcessed: 0,
                attempts: 0,
                startedAt: new Date().toISOString(),
            }
            await this.batchResolverProducer.createJob({
                teamId: team.id,
                queueName: HOGFLOW_BATCH_RESOLVE_QUEUE,
                parentRunId: parent_run_id,
                functionId: hogFlow.id,
                state: serializeResolverState(initialState),
            })

            res.json({ status: 'queued' })
        } catch (e) {
            logger.error('Error handling hogflow batch invocation', { error: e })
            res.status(500).json({ error: [e.message] })
        }
    }

    private async processAndRespondToWebhook(
        webhookId: string,
        req: ModifiedRequest,
        res: express.Response,
        onSuccess: (
            result: Awaited<ReturnType<typeof this.cdpSourceWebhooksConsumer.processWebhook>>
        ) => Promise<any> | any
    ): Promise<any> {
        try {
            const result = await this.cdpSourceWebhooksConsumer.processWebhook(webhookId, req)

            if (typeof result.execResult === 'object' && result.execResult && 'httpResponse' in result.execResult) {
                const httpResponse = result.execResult.httpResponse as InsightsFunctionWebhookResult

                // Security headers to prevent XSS via content-type injection
                res.set('X-Content-Type-Options', 'nosniff')
                res.set('Content-Security-Policy', "default-src 'none'")

                if (typeof httpResponse.body === 'string') {
                    const safeContentType = sanitizeContentType(
                        httpResponse.contentType,
                        httpResponse.isBase64Encoded ? 'application/octet-stream' : 'text/plain'
                    )
                    if (httpResponse.isBase64Encoded) {
                        const buffer = Buffer.from(httpResponse.body, 'base64')
                        return res.status(httpResponse.status).type(safeContentType).send(buffer)
                    }
                    return res.status(httpResponse.status).type(safeContentType).send(httpResponse.body)
                } else if (typeof httpResponse.body === 'object') {
                    return res.status(httpResponse.status).json(httpResponse.body)
                }
                return res.status(httpResponse.status).send('')
            }

            return await onSuccess(result)
        } catch (error) {
            if (error instanceof SourceWebhookError) {
                return res.status(error.status).json({ error: error.message })
            }
            logger.error('[CdpApi] Error handling webhook', { error })
            return res.status(500).json({ error: 'Internal error' })
        }
    }

    private handleWebhook =
        () =>
        async (req: ModifiedRequest, res: express.Response): Promise<any> => {
            const { webhook_id } = req.params
            return this.processAndRespondToWebhook(webhook_id, req, res, (result) => {
                if (result.error) {
                    return res.status(500).json({ status: 'Unhandled error' })
                }
                if (!result.finished) {
                    return res.status(201).json({ status: 'queued' })
                }
                return res.status(200).json({ status: 'ok' })
            })
        }

    private handleWarehouseSourceWebhook =
        () =>
        async (req: ModifiedRequest, res: express.Response): Promise<any> => {
            const { webhook_id } = req.params
            return this.processAndRespondToWebhook(webhook_id, req, res, (result) => {
                if (result.error) {
                    return res.status(500).json({ error: 'Internal error' })
                }
                if (!result.finished) {
                    return res.status(201).json({ status: 'queued' })
                }
                return res.status(200).json({ status: 'ok' })
            })
        }

    private postSesWebhook =
        () =>
        async (req: ModifiedRequest, res: express.Response): Promise<any> => {
            try {
                const { status, message } = await this.emailTrackingService.handleSesWebhook(req)
                return res.status(status).json({ message })
            } catch {
                return res.status(500).json({ error: 'Internal error' })
            }
        }

    private getEmailTrackingPixel =
        () =>
        (req: ModifiedRequest, res: express.Response): any => {
            this.emailTrackingService.handleEmailTrackingPixel(req, res)
        }

    private getEmailTrackingRedirect =
        () =>
        (req: ModifiedRequest, res: express.Response): any => {
            this.emailTrackingService.handleEmailTrackingRedirect(req, res)
        }

    private generatePreferencesToken =
        () =>
        (req: ModifiedRequest, res: express.Response): any => {
            const { team_id, identifier } = req.body

            if (!team_id || !identifier) {
                return res.status(400).json({ error: 'Team ID and identifier are required' })
            }

            const token = this.recipientTokensService.generatePreferencesToken({
                team_id,
                identifier,
            })
            return res.status(200).json({ token })
        }

    private validatePreferencesToken =
        () =>
        (req: ModifiedRequest, res: express.Response): any => {
            try {
                const { token } = req.params

                if (!token) {
                    return res.status(400).json({ error: 'Token is required' })
                }

                const result = this.recipientTokensService.validatePreferencesToken(token)

                if (!result.valid) {
                    return res.status(400).json({ error: 'Invalid or expired token' })
                }

                return res.status(200).json({
                    valid: result.valid,
                    team_id: result.team_id,
                    identifier: result.identifier,
                })
            } catch (error) {
                logger.error('[CdpApi] Error validating preferences token', error)
                return res.status(500).json({ error: 'Failed to validate token' })
            }
        }

    private handleBatchExportInsightsFunction =
        () =>
        async (req: ModifiedRequest, res: express.Response): Promise<any> => {
            try {
                const result = await this.batchExportInsightsFunctionService.execute(
                    {
                        team_id: req.params.team_id,
                        insights_function_id: req.params.insights_function_id,
                    },
                    req.body
                )

                return res.json({
                    status: result.error ? 'error' : 'success',
                    errors: result.error ? [String(result.error)] : [],
                    logs: result.logs,
                })
            } catch (e) {
                if (e instanceof NotFoundError) {
                    return res.status(404).json({ errors: [e.message] })
                } else if (e instanceof ParseError) {
                    return res.status(400).json({ errors: [e.message] })
                } else {
                    console.error(e)
                    return res.status(500).json({ errors: [e.message] })
                }
            }
        }
}

const buildHogExecutorAsyncOptions = (
    mockAsyncFunctions: boolean,
    logs: MinimalLogEntry[],
    sensitiveValues?: string[]
): HogExecutorExecuteAsyncOptions => {
    let mockFunctions: Record<string, (...args: any[]) => any> | undefined

    if (mockAsyncFunctions) {
        mockFunctions = {}
        for (const name of getRegisteredAsyncFunctionNames()) {
            const handler = getAsyncFunctionHandler(name)!
            mockFunctions[name] = (...args: any[]) => {
                const startIndex = logs.length
                const result = handler.mock(args, logs)
                if (sensitiveValues?.length) {
                    for (let i = startIndex; i < logs.length; i++) {
                        logs[i] = {
                            ...logs[i],
                            message: sanitizeLogMessage([logs[i].message], sensitiveValues),
                        }
                    }
                }
                return result
            }
        }
    }

    return {
        maxAsyncFunctions: MAX_ASYNC_STEPS,
        asyncFunctionsNames: mockAsyncFunctions ? [] : undefined,
        functions: mockFunctions,
    }
}
