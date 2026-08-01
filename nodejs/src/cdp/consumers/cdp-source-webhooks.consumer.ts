import { DateTime } from 'luxon'

import { InsightsFlow } from '~/cdp/schema/hogflow'
import type { ModifiedRequest } from '~/common/api/router'
import { instrumented } from '~/common/tracing/tracing-utils'
import { logger } from '~/common/utils/logger'
import { PromiseScheduler } from '~/common/utils/promise-scheduler'
import { UUID, UUIDT } from '~/common/utils/utils'

import { HealthCheckResult, HealthCheckResultOk, PluginsServerConfig } from '../../types'
import { createInsightsFlowInvocation } from '../services/insightsflows/hogflow-executor.service'
import { actionIdForLogging } from '../services/insightsflows/hogflow-utils'
import { JobQueue } from '../services/job-queue/job-queue.interface'
import { HogWatcherFunctionState, HogWatcherState } from '../services/monitoring/script-watcher.service'
import {
    CyclotronJobInvocationInsightsFunction,
    CyclotronJobInvocationResult,
    InsightsFunctionFilterGlobals,
    InsightsFunctionInvocationGlobals,
    InsightsFunctionType,
    LogEntryLevel,
    MinimalAppMetric,
} from '../types'
import { logEntry } from '../utils'
import { createInvocation, createInvocationResult } from '../utils/invocation-utils'
import { CdpConsumerBase, CdpConsumerBaseDeps } from './cdp-base.consumer'

const DISALLOWED_HEADERS = [
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-forwarded-port',
    'cookie',
    'x-csrftoken',
    'proxy-authorization',
    'referer',
    'forwarded',
    'x-real-ip',
    'true-client-ip',
]

const getFirstHeaderValue = (value: string | string[] | undefined): string | undefined => {
    return Array.isArray(value) ? value[0] : value
}

export type InsightsFunctionWebhookResult = {
    status: number
    body: Record<string, any> | string
    contentType?: string
    isBase64Encoded?: boolean
}

export const getCustomHttpResponse = (
    result: CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>
): InsightsFunctionWebhookResult | null => {
    if (typeof result.execResult === 'object' && result.execResult && 'httpResponse' in result.execResult) {
        const httpResponse = result.execResult.httpResponse as Record<string, any>
        return {
            status: 'status' in httpResponse && typeof httpResponse.status === 'number' ? httpResponse.status : 500,
            body: 'body' in httpResponse ? httpResponse.body : '',
            contentType:
                'contentType' in httpResponse && typeof httpResponse.contentType === 'string'
                    ? httpResponse.contentType
                    : undefined,
            isBase64Encoded:
                'isBase64Encoded' in httpResponse && typeof httpResponse.isBase64Encoded === 'boolean'
                    ? httpResponse.isBase64Encoded
                    : undefined,
        }
    }

    return null
}

export class SourceWebhookError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.name = 'SourceWebhookError'
        this.status = status
    }
}

export class CdpSourceWebhooksConsumer extends CdpConsumerBase<PluginsServerConfig> {
    protected name = 'CdpSourceWebhooksConsumer'
    private hogQueue: JobQueue
    private hogflowQueue: JobQueue
    private promiseScheduler: PromiseScheduler

    constructor(
        config: PluginsServerConfig,
        deps: CdpConsumerBaseDeps,
        jobQueues: { hogQueue: JobQueue; hogflowQueue: JobQueue }
    ) {
        super(config, deps)
        this.promiseScheduler = new PromiseScheduler()
        this.hogQueue = jobQueues.hogQueue
        this.hogflowQueue = jobQueues.hogflowQueue
    }

    public async getWebhook(webhookId: string): Promise<{ hogFlow?: InsightsFlow; insightsFunction: InsightsFunctionType } | null> {
        if (!UUID.validateString(webhookId, false)) {
            return null
        }

        // Check for script functions
        const insightsFunction = await this.insightsFunctionManager.getInsightsFunction(webhookId)
        if (insightsFunction?.type === 'source_webhook' && insightsFunction.enabled && !insightsFunction.deleted) {
            return { insightsFunction }
        }

        if (insightsFunction?.type === 'warehouse_source_webhook' && insightsFunction.enabled && !insightsFunction.deleted) {
            const templateId = insightsFunction.template_id ?? 'template-warehouse-source-default'
            const template = await this.insightsFunctionTemplateManager.getInsightsFunctionTemplate(templateId)
            if (template) {
                insightsFunction.bytecode = template.bytecode
                return { insightsFunction }
            }
        }

        // Otherwise check for script flows
        const hogFlow = await this.hogFlowManager.getInsightsFlow(webhookId)
        if (
            hogFlow &&
            hogFlow.status === 'active' &&
            (hogFlow.trigger?.type === 'webhook' ||
                hogFlow.trigger?.type === 'tracking_pixel' ||
                hogFlow.trigger?.type === 'manual')
        ) {
            const insightsFunction = await this.hogFlowFunctionsService.buildInsightsFunction(hogFlow, hogFlow.trigger)

            return { hogFlow, insightsFunction }
        }

        return null
    }

    private buildRequestGlobals(insightsFunction: InsightsFunctionType, req: ModifiedRequest): InsightsFunctionInvocationGlobals {
        const body: Record<string, any> = req.body

        const ipValue = getFirstHeaderValue(req.headers['x-forwarded-for']) || req.socket.remoteAddress || req.ip
        // IP could be comma delimited list of IPs
        const ips = ipValue?.split(',').map((ip) => ip.trim()) || []
        const ip = ips[0]

        const projectUrl = `${this.config.SITE_URL}/project/${insightsFunction.team_id}`
        const headers: Record<string, string> = {}

        for (const [key, value] of Object.entries(req.headers)) {
            const firstValue = getFirstHeaderValue(value)
            if (firstValue && !DISALLOWED_HEADERS.includes(key.toLowerCase())) {
                headers[key.toLowerCase()] = firstValue
            }
        }

        const query: Record<string, string> = {}
        for (const [key, value] of Object.entries(req.query)) {
            const firstValue = Array.isArray(value) ? value.join(',') : value
            query[key] = String(firstValue)
        }

        return {
            source: {
                name: insightsFunction.name ?? `Script function: ${insightsFunction.id}`,
                url: `${projectUrl}/functions/${insightsFunction.id}`,
            },
            project: {
                id: insightsFunction.team_id,
                name: '',
                url: '',
            },
            event: {
                event: '$incoming_webhook',
                properties: {},
                uuid: new UUIDT().toString(),
                distinct_id: req.body.distinct_id,
                elements_chain: '',
                timestamp: DateTime.now().toISO(),
                url: '',
            },
            request: {
                method: req.method,
                headers,
                ip,
                body,
                query,
                stringBody: req.rawBody ?? '',
            },
            variables: req.body.$variables || {},
        }
    }

    private async executeInsightsFlow(
        req: ModifiedRequest,
        hogFlow: InsightsFlow,
        insightsFunction: InsightsFunctionType
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>> {
        logger.info('Executing script flow trigger', {
            id: hogFlow.id,
            template_id: insightsFunction.template_id,
            team_id: hogFlow.team_id,
        })
        const invocationId = new UUIDT().toString()
        const triggerActionId = hogFlow.actions.find((action) => action.type === 'trigger')?.id ?? 'trigger_node'

        const addLog = (level: LogEntryLevel, message: string) => {
            this.insightsFunctionMonitoringService.queueLogs(
                [
                    {
                        team_id: hogFlow.team_id,
                        log_source: 'hog_flow',
                        log_source_id: hogFlow.id,
                        instance_id: invocationId,
                        ...logEntry(level, `${actionIdForLogging({ id: triggerActionId })} ${message}`),
                    },
                ],
                'hog_flow'
            )
        }

        const addMetric = (metric: Pick<MinimalAppMetric, 'metric_kind' | 'metric_name' | 'count'>) => {
            this.insightsFunctionMonitoringService.queueAppMetric(
                {
                    team_id: hogFlow.team_id,
                    app_source_id: hogFlow.id,
                    ...metric,
                },
                'hog_flow'
            )
        }

        try {
            const globals: InsightsFunctionInvocationGlobals = this.buildRequestGlobals(insightsFunction, req)

            const globalsWithInputs = await this.hogExecutor.buildInputsWithGlobals(insightsFunction, globals)
            const invocation = createInvocation(globalsWithInputs, insightsFunction)

            // Slightly different handling for script flows
            // Run the initial step - this allows functions not using fetches to respond immediately
            const functionResult = await this.hogFlowFunctionsService.execute(invocation)
            functionResult.logs.forEach((log) => addLog(log.level, log.message))
            functionResult.logs = []

            // Queue any queued work here. This allows us to enable delayed work like fetching eventually without blocking the API.
            if (!functionResult.finished) {
                throw new SourceWebhookError(500, 'Delayed processing not supported')
            }

            const customHttpResponse = getCustomHttpResponse(functionResult)
            if (customHttpResponse) {
                const level = customHttpResponse.status >= 400 ? 'warn' : 'info'
                if (level === 'warn') {
                    const bodyStr =
                        typeof customHttpResponse.body === 'string'
                            ? customHttpResponse.body
                            : JSON.stringify(customHttpResponse.body)
                    addLog(level, `Responded with response status - ${customHttpResponse.status}, reason: ${bodyStr}`)
                } else {
                    addLog(level, `Responded with response status - ${customHttpResponse.status}`)
                }
            }

            const capturedInsightsEvent = functionResult.capturedInsightsEvents[0]
            // Add all logs to the result

            if (capturedInsightsEvent) {
                // For workflows, the captured event is only used as trigger data and not to actually capture the event
                // Remove the execution count property to allow workflow actions to capture events without
                // triggering the infinite loop protection.
                const { $insights_function_execution_count, ...cleanProperties } = capturedInsightsEvent.properties || {}

                // Invoke the hogflow
                const triggerGlobals: InsightsFunctionInvocationGlobals = {
                    ...invocation.state.globals,
                    event: {
                        ...capturedInsightsEvent,
                        properties: cleanProperties,
                        uuid: new UUIDT().toString(),
                        elements_chain: '',
                        url: '',
                    },
                }
                const hogFlowInvocation = createInsightsFlowInvocation(
                    triggerGlobals,
                    hogFlow,
                    {} as InsightsFunctionFilterGlobals
                )

                hogFlowInvocation.id = invocationId // Keep the IDs consistent

                addMetric({
                    metric_kind: 'other',
                    metric_name: 'triggered',
                    count: 1,
                })

                addMetric({
                    metric_kind: 'billing',
                    metric_name: 'billable_invocation',
                    count: 1,
                })

                await this.hogflowQueue.queueInvocations([hogFlowInvocation])
            } else {
                addMetric({
                    metric_kind: 'failure',
                    metric_name: 'trigger_failed',
                    count: 1,
                })
            }
            // Always set to false for script flows as this triggers the flow to continue so we dont want metrics for this
            functionResult.finished = false

            return functionResult
        } catch (error) {
            logger.error('Error triggering script flow', { error })
            addMetric({
                metric_kind: 'failure',
                metric_name: 'trigger_failed',
                count: 1,
            })

            addLog('error', `Error triggering flow: ${error.message}`)

            // NOTE: We only return a script function result. We track out own logs and errors here
            return createInvocationResult(
                createInvocation({} as any, insightsFunction),
                {},
                {
                    finished: false,
                    error: error.message,
                }
            )
        }
    }

    private async executeInsightsFunction(
        req: ModifiedRequest,
        insightsFunction: InsightsFunctionType,
        insightsFunctionState: HogWatcherFunctionState | null
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>> {
        let result: CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>

        try {
            const globals: InsightsFunctionInvocationGlobals = this.buildRequestGlobals(insightsFunction, req)
            const globalsWithInputs = await this.hogExecutor.buildInputsWithGlobals(insightsFunction, globals)
            const invocation = createInvocation(globalsWithInputs, insightsFunction)

            if (insightsFunctionState?.state === HogWatcherState.degraded) {
                // Degraded functions are not executed immediately
                invocation.queue = 'hogoverflow'
                await this.hogQueue.queueInvocations([invocation])

                result = createInvocationResult<CyclotronJobInvocationInsightsFunction>(
                    invocation,
                    {},
                    {
                        finished: false,
                        logs: [
                            {
                                level: 'warn',
                                message: 'Function scheduled for future execution due to degraded state',
                                timestamp: DateTime.now(),
                            },
                        ],
                    }
                )

                result.execResult = {
                    // TODO: Add support for a default response as an input
                    httpResponse: {
                        status: 200,
                        body: '',
                    },
                }
            } else {
                // Run the initial step - this allows functions not using fetches to respond immediately
                result = await this.hogExecutor.execute(invocation)

                // Queue any queued work here. This allows us to enable delayed work like fetching eventually without blocking the API.
                if (!result.finished) {
                    await this.hogQueue.queueInvocationResults([result])
                }

                const customHttpResponse = getCustomHttpResponse(result)
                if (customHttpResponse) {
                    const level = customHttpResponse.status >= 400 ? 'warn' : 'info'
                    if (level === 'warn') {
                        const bodyStr =
                            typeof customHttpResponse.body === 'string'
                                ? customHttpResponse.body
                                : JSON.stringify(customHttpResponse.body)
                        result.logs.push(
                            logEntry(
                                level,
                                `Responded with response status - ${customHttpResponse.status}, reason: ${bodyStr}`
                            )
                        )
                    } else {
                        result.logs.push(
                            logEntry(level, `Responded with response status - ${customHttpResponse.status}`)
                        )
                    }
                }
            }
        } catch (error) {
            logger.error('Error executing script function', { error })
            result = createInvocationResult(
                createInvocation({} as any, insightsFunction),
                {},
                {
                    finished: true,
                    error: error.message,
                    logs: [{ level: 'error', message: error.message, timestamp: DateTime.now() }],
                }
            )
        }

        await this.invocationResultsService.queueInvocationResults([result])
        return result
    }

    @instrumented('cdpSourceWebhooksConsumer.processWebhook')
    public async processWebhook(
        identifier: string,
        req: ModifiedRequest
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>> {
        // NOTE: To simplify usage we allow setting a range of extensions for webhooks
        // Currently we just ignore it
        const [webhookId, _extension] = identifier.split('.')

        const [webhook, insightsFunctionState] = await Promise.all([
            this.getWebhook(webhookId),
            this.hogWatcher.getCachedEffectiveState(webhookId),
        ])

        if (!webhook) {
            throw new SourceWebhookError(404, 'Not found')
        }

        const { insightsFunction, hogFlow } = webhook

        if (insightsFunctionState?.state === HogWatcherState.disabled) {
            this.insightsFunctionMonitoringService.queueAppMetric(
                {
                    team_id: insightsFunction.team_id,
                    app_source_id: insightsFunction.id,
                    metric_kind: 'failure',
                    metric_name: 'disabled_permanently',
                    count: 1,
                },
                hogFlow ? 'hog_flow' : 'insights_function'
            )
            throw new SourceWebhookError(429, 'Disabled')
        }

        const result = hogFlow
            ? await this.executeInsightsFlow(req, hogFlow, insightsFunction)
            : await this.executeInsightsFunction(req, insightsFunction, insightsFunctionState)

        void this.promiseScheduler.schedule(
            this.invocationResultsService.flush(),
            this.hogWatcher.observeResultsBuffered(result)
        )

        return result
    }

    public override async start(): Promise<void> {
        await super.start()
        // Make sure we are ready to produce to cyclotron first
        await Promise.all([this.hogQueue.startAsProducer(), this.hogflowQueue.startAsProducer()])
    }

    public override async stop(): Promise<void> {
        await Promise.all([this.hogQueue.stopProducer(), this.hogflowQueue.stopProducer()])
        await this.promiseScheduler.waitForAllSettled()
        // IMPORTANT: super always comes last
        await super.stop()
    }

    public isHealthy(): HealthCheckResult {
        // TODO: What should we consider healthy / unhealthy here? kafka?
        return new HealthCheckResultOk()
    }
}
