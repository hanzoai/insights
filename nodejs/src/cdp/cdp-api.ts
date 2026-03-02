import { DateTime } from 'luxon'
import express from 'ultimate-express'

import { PluginEvent } from '@posthog/plugin-scaffold'

import { ModifiedRequest } from '~/api/router'
import { createRedisV2PoolFromConfig } from '~/common/redis/redis-v2'
import { KAFKA_CDP_BATCH_INSIGHTSFLOW_REQUESTS, KAFKA_WAREHOUSE_SOURCE_WEBHOOKS } from '~/config/kafka-topics'
import { KafkaProducerWrapper } from '~/kafka/producer'

import { HealthCheckResult, HealthCheckResultError, HealthCheckResultOk, Hub, PluginServerService } from '../types'
import { logger } from '../utils/logger'
import { UUID, UUIDT, delay } from '../utils/utils'
import { getAsyncFunctionHandler, getRegisteredAsyncFunctionNames } from './async-function-registry'
import './async-functions'
import {
    CdpSourceWebhooksConsumer,
    CdpSourceWebhooksConsumerHub,
    InsightsFunctionWebhookResult,
    SourceWebhookError,
} from './consumers/cdp-source-webhooks.consumer'
import { ScriptTransformerHub, ScriptTransformerService } from './script-transformations/script-transformer.service'
import { ScriptExecutorExecuteAsyncOptions, ScriptExecutorService, MAX_ASYNC_STEPS } from './services/script-executor.service'
import { InsightsFlowExecutorService, createInsightsFlowInvocation } from './services/insightsflows/customflow-executor.service'
import { InsightsFlowFunctionsService } from './services/insightsflows/customflow-functions.service'
import { InsightsFlowManagerService } from './services/insightsflows/customflow-manager.service'
import { InsightsFunctionManagerService } from './services/managers/insights-function-manager.service'
import { InsightsFunctionTemplateManagerService } from './services/managers/insights-function-template-manager.service'
import { RecipientsManagerService } from './services/managers/recipients-manager.service'
import { EmailTrackingService } from './services/messaging/email-tracking.service'
import { RecipientPreferencesService } from './services/messaging/recipient-preferences.service'
import { RecipientTokensService } from './services/messaging/recipient-tokens.service'
import { InsightsFunctionMonitoringService } from './services/monitoring/insights-function-monitoring.service'
import { ScriptWatcherService, ScriptWatcherState } from './services/monitoring/script-watcher.service'
import { NativeDestinationExecutorService } from './services/native-destination-executor.service'
import { SegmentDestinationExecutorService } from './services/segment-destination-executor.service'
import { INSIGHTS_FUNCTION_TEMPLATES } from './templates'
import { InsightsFunctionInvocationGlobals, InsightsFunctionType, MinimalLogEntry } from './types'
import { convertToInsightsFunctionInvocationGlobals, isNativeInsightsFunction, isSegmentPluginInsightsFunction } from './utils'
import { convertToInsightsFunctionFilterGlobal } from './utils/insights-function-filtering'

/**
 * Hub type for CdpApi.
 * Combines all hub types needed by CdpApi and its dependencies.
 */
export type CdpApiHub = CdpSourceWebhooksConsumerHub &
    ScriptTransformerHub &
    Pick<
        Hub,
        | 'teamManager'
        | 'SITE_URL'
        | 'REDIS_URL'
        | 'REDIS_POOL_MIN_SIZE'
        | 'REDIS_POOL_MAX_SIZE'
        | 'CDP_REDIS_HOST'
        | 'CDP_REDIS_PORT'
        | 'CDP_REDIS_PASSWORD'
    >

export class CdpApi {
    private scriptExecutor: ScriptExecutorService
    private nativeDestinationExecutorService: NativeDestinationExecutorService
    private segmentDestinationExecutorService: SegmentDestinationExecutorService

    private insightsFunctionManager: InsightsFunctionManagerService
    private insightsFunctionTemplateManager: InsightsFunctionTemplateManagerService
    private insightsFlowManager: InsightsFlowManagerService
    private recipientsManager: RecipientsManagerService

    private insightsFlowExecutor: InsightsFlowExecutorService
    private insightsFlowFunctionsService: InsightsFlowFunctionsService
    private scriptWatcher: ScriptWatcherService
    private scriptTransformer: ScriptTransformerService
    private insightsFunctionMonitoringService: InsightsFunctionMonitoringService
    private cdpSourceWebhooksConsumer: CdpSourceWebhooksConsumer
    private emailTrackingService: EmailTrackingService
    private recipientPreferencesService: RecipientPreferencesService
    private recipientTokensService: RecipientTokensService
    private cdpWarehouseKafkaProducer?: KafkaProducerWrapper

    constructor(private hub: CdpApiHub) {
        this.insightsFunctionManager = new InsightsFunctionManagerService(hub)
        this.insightsFunctionTemplateManager = new InsightsFunctionTemplateManagerService(hub.postgres)
        this.insightsFlowManager = new InsightsFlowManagerService(hub.postgres, hub.pubSub)
        this.recipientsManager = new RecipientsManagerService(hub.postgres)
        this.scriptExecutor = new ScriptExecutorService(hub)
        this.insightsFlowFunctionsService = new InsightsFlowFunctionsService(
            hub.SITE_URL,
            this.insightsFunctionTemplateManager,
            this.scriptExecutor
        )
        this.recipientPreferencesService = new RecipientPreferencesService(this.recipientsManager)
        this.recipientTokensService = new RecipientTokensService(hub)
        this.insightsFlowExecutor = new InsightsFlowExecutorService(
            this.insightsFlowFunctionsService,
            this.recipientPreferencesService
        )
        this.nativeDestinationExecutorService = new NativeDestinationExecutorService(hub)
        this.segmentDestinationExecutorService = new SegmentDestinationExecutorService(hub)
        // CDP uses its own Redis instance with fallback to default
        this.scriptWatcher = new ScriptWatcherService(
            hub,
            createRedisV2PoolFromConfig({
                connection: hub.CDP_REDIS_HOST
                    ? {
                          url: hub.CDP_REDIS_HOST,
                          options: { port: hub.CDP_REDIS_PORT, password: hub.CDP_REDIS_PASSWORD },
                          name: 'cdp-api-redis',
                      }
                    : { url: hub.REDIS_URL, name: 'cdp-api-redis-fallback' },
                poolMinSize: hub.REDIS_POOL_MIN_SIZE,
                poolMaxSize: hub.REDIS_POOL_MAX_SIZE,
            })
        )
        this.scriptTransformer = new ScriptTransformerService(hub)
        this.insightsFunctionMonitoringService = new InsightsFunctionMonitoringService(hub)
        this.cdpSourceWebhooksConsumer = new CdpSourceWebhooksConsumer(hub)
        this.emailTrackingService = new EmailTrackingService(
            this.insightsFunctionManager,
            this.insightsFlowManager,
            this.insightsFunctionMonitoringService
        )
    }

    public get service(): PluginServerService {
        return {
            id: 'cdp-api',
            onShutdown: async () => await this.stop(),
            healthcheck: () => this.isHealthy() ?? new HealthCheckResultError('CDP API is not healthy', {}),
        }
    }

    async start(): Promise<void> {
        this.cdpWarehouseKafkaProducer = await KafkaProducerWrapper.create(
            this.hub.KAFKA_CLIENT_RACK,
            'WAREHOUSE_PRODUCER'
        )
        await this.cdpSourceWebhooksConsumer.start()
    }

    async stop(): Promise<void> {
        await Promise.all([this.cdpWarehouseKafkaProducer?.disconnect(), this.cdpSourceWebhooksConsumer.stop()])
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
        router.post('/api/projects/:team_id/insights_flows/:id/invocations', asyncHandler(this.postCustomflowInvocation))
        router.post(
            '/api/projects/:team_id/insights_flows/:id/batch_invocations/:parent_run_id',
            asyncHandler(this.postInsightsFlowBatchInvocation)
        )
        router.get('/api/projects/:team_id/insights_functions/:id/status', asyncHandler(this.getFunctionStatus()))
        router.patch('/api/projects/:team_id/insights_functions/:id/status', asyncHandler(this.patchFunctionStatus()))
        router.get('/api/insights_functions/states', asyncHandler(this.getFunctionStates()))
        router.get('/api/insights_function_templates', this.getInsightsFunctionTemplates)
        router.post('/api/messaging/generate_preferences_token', asyncHandler(this.generatePreferencesToken()))
        router.get('/api/messaging/validate_preferences_token/:token', asyncHandler(this.validatePreferencesToken()))

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
        res.json(INSIGHTS_FUNCTION_TEMPLATES)
    }

    private getFunctionStatus =
        () =>
        async (req: ModifiedRequest, res: express.Response): Promise<void> => {
            const { id } = req.params
            const summary = await this.scriptWatcher.getPersistedState(id)

            res.json(summary)
        }

    private patchFunctionStatus =
        () =>
        async (req: ModifiedRequest, res: express.Response): Promise<void> => {
            const { id } = req.params
            const { state } = req.body

            // Check that state is valid
            if (!Object.values(ScriptWatcherState).includes(state)) {
                res.status(400).json({ error: 'Invalid state' })
                return
            }

            const summary = await this.scriptWatcher.getPersistedState(id)
            const insightsFunction = await this.insightsFunctionManager.fetchInsightsFunction(id)

            if (!insightsFunction) {
                res.status(404).json({ error: 'Custom function not found' })
                return
            }

            // Only allow patching the status if it is different from the current status

            if (summary.state !== state) {
                await this.scriptWatcher.forceStateChange(insightsFunction, state)
            }

            // Hacky - wait for a little to give a chance for the state to change
            await delay(100)

            res.json(await this.scriptWatcher.getPersistedState(id))
        }

    private getFunctionStates =
        () =>
        async (req: ModifiedRequest, res: express.Response): Promise<void> => {
            try {
                const allStates = await this.scriptWatcher.getAllFunctionStates()

                // Transform the data for better consumption by Grafana and sort by tokens ascending
                const statesArray = Object.entries(allStates)
                    .map(([functionId, state]) => ({
                        function_id: functionId,
                        state: ScriptWatcherState[state.state], // Convert numeric state to readable string
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
            const { clickhouse_event, mock_async_functions, configuration, invocation_id } = req.body
            let { globals } = req.body

            logger.info('⚡️', 'Received invocation', { id, team_id, body: req.body })

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
            const team = await this.hub.teamManager.getTeam(parseInt(team_id)).catch(() => null)

            if (!team) {
                return res.status(404).json({ error: 'Team not found' })
            }

            globals = clickhouse_event
                ? convertToInsightsFunctionInvocationGlobals(clickhouse_event, team, this.hub.SITE_URL)
                : globals

            if (!globals || !globals.event) {
                res.status(400).json({ error: 'Missing event' })
                return
            }

            // NOTE: We allow the custom function to be null if it is a "new" custom function
            // The real security happens at the django layer so this is more of a sanity check
            if (!isNewFunction && (!insightsFunction || insightsFunction.team_id !== team.id)) {
                return res.status(404).json({ error: 'Custom function not found' })
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
                    url: `${this.hub.SITE_URL}/project/${team.id}`,
                    ...globals.project,
                },
            }

            if (['destination', 'internal_destination'].includes(compoundConfiguration.type)) {
                const {
                    invocations,
                    logs: filterLogs,
                    metrics: filterMetrics,
                } = await this.scriptExecutor.buildInsightsFunctionInvocations([compoundConfiguration], triggerGlobals)

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

                    const options: ScriptExecutorExecuteAsyncOptions = buildScriptExecutorAsyncOptions(
                        mock_async_functions,
                        logs
                    )

                    let response: any = null
                    if (isNativeInsightsFunction(compoundConfiguration)) {
                        response = await this.nativeDestinationExecutorService.execute(invocation)
                    } else if (isSegmentPluginInsightsFunction(compoundConfiguration)) {
                        response = await this.segmentDestinationExecutorService.execute(invocation)
                    } else {
                        response = await this.scriptExecutor.executeWithAsyncFunctions(invocation, options)
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
                const response = await this.scriptTransformer.transformEvent(pluginEvent, [compoundConfiguration])

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
            } else {
                return res.status(400).json({ error: 'Invalid function type' })
            }
        } catch (e) {
            console.error(e)
            res.status(500).json({ errors: [e.message] })
        } finally {
            await this.insightsFunctionMonitoringService.flush()
        }
    }

    private postCustomflowInvocation = async (req: ModifiedRequest, res: express.Response): Promise<any> => {
        try {
            const { id, team_id } = req.params
            const { clickhouse_event, configuration, invocation_id, current_action_id, mock_async_functions } = req.body

            logger.info('⚡️', 'Received customflow invocation', { id, team_id, body: req.body })

            const invocationID = invocation_id ?? new UUIDT().toString()

            // Check the invocationId is a valid UUID
            if (!UUID.validateString(invocationID)) {
                res.status(400).json({ error: 'Invalid invocation ID' })
                return
            }

            const isNewInsightsFlow = req.params.id === 'new'
            const insightsFlow = isNewInsightsFlow ? null : await this.insightsFlowManager.getInsightsFlow(req.params.id)

            const team = await this.hub.teamManager.getTeam(parseInt(team_id)).catch(() => null)

            if (!team) {
                return res.status(404).json({ error: 'Team not found' })
            }

            // NOTE: We allow the custom flow to be null if it is a "new" custom flow
            // The real security happens at the django layer so this is more of a sanity check
            if (!isNewInsightsFlow && (!insightsFlow || insightsFlow.team_id !== team.id)) {
                return res.status(404).json({ error: 'Custom flow not found' })
            }

            const globals: InsightsFunctionInvocationGlobals | null = clickhouse_event
                ? convertToInsightsFunctionInvocationGlobals(
                      clickhouse_event,
                      team,
                      this.hub.SITE_URL ?? 'http://localhost:8000'
                  )
                : req.body.globals

            if (!globals || !globals.event) {
                return res.status(400).json({ error: 'Missing event' })
            }

            // We use the provided config if given, otherwise the flow's config
            const compoundConfiguration = {
                ...insightsFlow,
                ...configuration,
                team_id: team.id,
            }

            const triggerGlobals: InsightsFunctionInvocationGlobals = {
                ...globals,
                project: {
                    id: team.id,
                    name: team.name,
                    url: `${this.hub.SITE_URL ?? 'http://localhost:8000'}/project/${team.id}`,
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
            const options: ScriptExecutorExecuteAsyncOptions = buildScriptExecutorAsyncOptions(mock_async_functions, logs)
            const result = await this.insightsFlowExecutor.executeCurrentAction(invocation, { scriptExecutorOptions: options })

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

    private postInsightsFlowBatchInvocation = async (req: ModifiedRequest, res: express.Response): Promise<any> => {
        try {
            const { id, team_id, parent_run_id } = req.params

            logger.info('⚡️', 'Received customflow batch invocation', { id, team_id, parent_run_id })

            const team = await this.hub.teamManager.getTeam(parseInt(team_id)).catch(() => null)

            if (!team) {
                return res.status(404).json({ error: 'Team not found' })
            }

            const insightsFlow = await this.insightsFlowManager.getInsightsFlow(id)

            if (!insightsFlow || insightsFlow.team_id !== team.id) {
                return res.status(404).json({ error: 'Workflow not found' })
            }

            // Queue a message for the CDP batch producer to consume
            const kafkaProducer = this.hub.kafkaProducer
            if (!kafkaProducer) {
                return res.status(500).json({ error: 'Kafka producer not available' })
            }

            if (insightsFlow.trigger.type !== 'batch') {
                return res.status(400).json({ error: 'Only batch Workflows are supported for batch jobs' })
            }

            const batchInsightsFlowRequest = {
                teamId: team.id,
                insightsFlowId: insightsFlow.id,
                parentRunId: parent_run_id,
                filters: {
                    properties: insightsFlow.trigger.filters.properties || [],
                    filter_test_accounts: req.body.filters?.filter_test_accounts || false,
                },
            }

            await kafkaProducer.produce({
                topic: KAFKA_CDP_BATCH_INSIGHTSFLOW_REQUESTS,
                value: Buffer.from(JSON.stringify(batchInsightsFlowRequest)),
                key: `${team.id}_${insightsFlow.id}`,
            })

            res.json({ status: 'queued' })
        } catch (e) {
            logger.error('Error handling customflow batch invocation', { error: e })
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
                if (typeof httpResponse.body === 'string') {
                    return res
                        .status(httpResponse.status)
                        .set('Content-Type', httpResponse.contentType ?? 'text/plain')
                        .send(httpResponse.body)
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
            return this.processAndRespondToWebhook(webhook_id, req, res, async (result) => {
                if (result.error) {
                    return res.status(500).json({ error: 'Internal error' })
                }
                if (!result.execResult || typeof result.execResult !== 'object') {
                    return res.status(500).json({ error: 'Template did not return a payload' })
                }

                const insightsFunction = result.invocation.insightsFunction
                const schemaId = insightsFunction.inputs?.schema_id?.value
                if (!schemaId) {
                    return res.status(500).json({ error: 'Missing schema_id on custom function' })
                }

                const kafkaProducer = this.cdpWarehouseKafkaProducer
                if (!kafkaProducer) {
                    return res.status(500).json({ error: 'Kafka producer not available' })
                }

                await kafkaProducer.produce({
                    topic: KAFKA_WAREHOUSE_SOURCE_WEBHOOKS,
                    key: `${insightsFunction.team_id}:${schemaId}`,
                    value: Buffer.from(JSON.stringify(result.execResult)),
                })

                return res.status(200).json({ status: 'ok' })
            })
        }

    private postSesWebhook =
        () =>
        async (req: ModifiedRequest, res: express.Response): Promise<any> => {
            try {
                const { status, message } = await this.emailTrackingService.handleSesWebhook(req)
                return res.status(status).json({ message })
            } catch (error) {
                return res.status(500).json({ error: 'Internal error' })
            }
        }

    private getEmailTrackingPixel =
        () =>
        async (req: ModifiedRequest, res: express.Response): Promise<any> => {
            await this.emailTrackingService.handleEmailTrackingPixel(req, res)
        }

    private getEmailTrackingRedirect =
        () =>
        async (req: ModifiedRequest, res: express.Response): Promise<any> => {
            await this.emailTrackingService.handleEmailTrackingRedirect(req, res)
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
}

const buildScriptExecutorAsyncOptions = (
    mockAsyncFunctions: boolean,
    logs: MinimalLogEntry[]
): ScriptExecutorExecuteAsyncOptions => {
    let mockFunctions: Record<string, (...args: any[]) => any> | undefined

    if (mockAsyncFunctions) {
        mockFunctions = {}
        for (const name of getRegisteredAsyncFunctionNames()) {
            const handler = getAsyncFunctionHandler(name)!
            mockFunctions[name] = (...args: any[]) => handler.mock(args, logs)
        }
    }

    return {
        maxAsyncFunctions: MAX_ASYNC_STEPS,
        asyncFunctionsNames: mockAsyncFunctions ? [] : undefined,
        functions: mockFunctions,
    }
}
