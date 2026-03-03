import { DateTime } from 'luxon'

import { ModifiedRequest } from '~/api/router'
import { instrumented } from '~/common/tracing/tracing-utils'
import { InsightsFlow } from '~/schema/insightsflow'

import { HealthCheckResult, HealthCheckResultOk, Hub, PluginsServerConfig } from '../../types'
import { logger } from '../../utils/logger'
import { PromiseScheduler } from '../../utils/promise-scheduler'
import { UUID, UUIDT } from '../../utils/utils'
import { createInsightsFlowInvocation } from '../services/insightsflows/insightsflow-executor.service'
import { actionIdForLogging } from '../services/insightsflows/customflow-utils'
import { CyclotronJobQueue } from '../services/job-queue/job-queue'
import { ScriptWatcherFunctionState, ScriptWatcherState } from '../services/monitoring/script-watcher.service'
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
import { CdpConsumerBase, CdpConsumerBaseHub } from './cdp-base.consumer'

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
}

export const getCustomHttpResponse = (
    result: CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>
): InsightsFunctionWebhookResult | null => {
    if (typeof result.execResult === 'object' && result.execResult && 'httpResponse' in result.execResult) {
        const httpResponse = result.execResult.httpResponse as Record<string, any>
        return {
            status: 'status' in httpResponse && typeof httpResponse.status === 'number' ? httpResponse.status : 500,
            body: 'body' in httpResponse ? httpResponse.body : '',
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

/**
 * Hub type for CdpSourceWebhooksConsumer.
 * Extends CdpConsumerBaseHub with webhook-specific fields.
 */
export type CdpSourceWebhooksConsumerHub = CdpConsumerBaseHub &
    PluginsServerConfig & // For CyclotronJobQueue (to be narrowed later)
    Pick<Hub, 'SITE_URL'>

export class CdpSourceWebhooksConsumer extends CdpConsumerBase<CdpSourceWebhooksConsumerHub> {
    protected name = 'CdpSourceWebhooksConsumer'
    private cyclotronJobQueue: CyclotronJobQueue
    private promiseScheduler: PromiseScheduler

    constructor(hub: CdpSourceWebhooksConsumerHub) {
        super(hub)
        this.promiseScheduler = new PromiseScheduler()
        this.cyclotronJobQueue = new CyclotronJobQueue(hub, 'fn')
    }

    public async getWebhook(webhookId: string): Promise<{ insightsFlow?: InsightsFlow; insightsFunction: InsightsFunctionType } | null> {
        if (!UUID.validateString(webhookId, false)) {
            return null
        }

        // Check for custom functions
        const insightsFunction = await this.insightsFunctionManager.getInsightsFunction(webhookId)
        if (insightsFunction?.type === 'source_webhook' && insightsFunction?.enabled) {
            return { insightsFunction }
        }

        if (insightsFunction?.type === 'warehouse_source_webhook' && insightsFunction?.enabled) {
            const templateId = insightsFunction.template_id ?? 'template-warehouse-source-default'
            const template = await this.insightsFunctionTemplateManager.getInsightsFunctionTemplate(templateId)
            if (template) {
                insightsFunction.bytecode = template.bytecode
                return { insightsFunction }
            }
        }

        // Otherwise check for custom flows
        const insightsFlow = await this.insightsFlowManager.getInsightsFlow(webhookId)
        if (
            insightsFlow &&
            insightsFlow.status === 'active' &&
            (insightsFlow.trigger?.type === 'webhook' ||
                insightsFlow.trigger?.type === 'tracking_pixel' ||
                insightsFlow.trigger?.type === 'manual' ||
                insightsFlow.trigger?.type === 'schedule')
        ) {
            const insightsFunction = await this.insightsFlowFunctionsService.buildInsightsFunction(insightsFlow, insightsFlow.trigger)

            return { insightsFlow, insightsFunction }
        }

        return null
    }

    private buildRequestGlobals(insightsFunction: InsightsFunctionType, req: ModifiedRequest): InsightsFunctionInvocationGlobals {
        const body: Record<string, any> = req.body

        const ipValue = getFirstHeaderValue(req.headers['x-forwarded-for']) || req.socket.remoteAddress || req.ip
        // IP could be comma delimited list of IPs
        const ips = ipValue?.split(',').map((ip) => ip.trim()) || []
        const ip = ips[0]

        const projectUrl = `${this.hub.SITE_URL}/project/${insightsFunction.team_id}`
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
                name: insightsFunction.name ?? `Custom function: ${insightsFunction.id}`,
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
        insightsFlow: InsightsFlow,
        insightsFunction: InsightsFunctionType
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>> {
        logger.info('Executing custom flow trigger', {
            id: insightsFlow.id,
            template_id: insightsFunction.template_id,
            team_id: insightsFlow.team_id,
        })
        const invocationId = new UUIDT().toString()
        const triggerActionId = insightsFlow.actions.find((action) => action.type === 'trigger')?.id ?? 'trigger_node'

        const addLog = (level: LogEntryLevel, message: string) => {
            this.insightsFunctionMonitoringService.queueLogs(
                [
                    {
                        team_id: insightsFlow.team_id,
                        log_source: 'insights_flow',
                        log_source_id: insightsFlow.id,
                        instance_id: invocationId,
                        ...logEntry(level, `${actionIdForLogging({ id: triggerActionId })} ${message}`),
                    },
                ],
                'insights_flow'
            )
        }

        const addMetric = (metric: Pick<MinimalAppMetric, 'metric_kind' | 'metric_name' | 'count'>) => {
            this.insightsFunctionMonitoringService.queueAppMetric(
                {
                    team_id: insightsFlow.team_id,
                    app_source_id: insightsFlow.id,
                    ...metric,
                },
                'insights_flow'
            )
        }

        try {
            const globals: InsightsFunctionInvocationGlobals = this.buildRequestGlobals(insightsFunction, req)

            const globalsWithInputs = await this.scriptExecutor.buildInputsWithGlobals(insightsFunction, globals)
            const invocation = createInvocation(globalsWithInputs, insightsFunction)

            // Slightly different handling for custom flows
            // Run the initial step - this allows functions not using fetches to respond immediately
            const functionResult = await this.insightsFlowFunctionsService.execute(invocation)
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

                // Invoke the customflow
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
                const insightsFlowInvocation = createInsightsFlowInvocation(
                    triggerGlobals,
                    insightsFlow,
                    {} as InsightsFunctionFilterGlobals
                )

                const scheduledAt = insightsFlow.trigger && 'scheduled_at' in insightsFlow.trigger && insightsFlow.trigger.scheduled_at
                if (scheduledAt) {
                    const scheduledDateTime = DateTime.fromISO(scheduledAt)
                    if (!scheduledDateTime.isValid) {
                        addLog('warn', `Invalid scheduled_at date format: ${scheduledAt}`)
                    } else {
                        insightsFlowInvocation.queueScheduledAt = scheduledDateTime
                        addLog('info', `Workflow run scheduled for ${scheduledAt}`)
                    }
                }

                insightsFlowInvocation.id = invocationId // Keep the IDs consistent

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

                await this.cyclotronJobQueue.queueInvocations([insightsFlowInvocation])
            } else {
                addMetric({
                    metric_kind: 'failure',
                    metric_name: 'trigger_failed',
                    count: 1,
                })
            }
            // Always set to false for custom flows as this triggers the flow to continue so we dont want metrics for this
            functionResult.finished = false

            return functionResult
        } catch (error) {
            logger.error('Error triggering custom flow', { error })
            addMetric({
                metric_kind: 'failure',
                metric_name: 'trigger_failed',
                count: 1,
            })

            addLog('error', `Error triggering flow: ${error.message}`)

            // NOTE: We only return a custom function result. We track out own logs and errors here
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
        insightsFunctionState: ScriptWatcherFunctionState | null
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>> {
        let result: CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>

        try {
            const globals: InsightsFunctionInvocationGlobals = this.buildRequestGlobals(insightsFunction, req)
            const globalsWithInputs = await this.scriptExecutor.buildInputsWithGlobals(insightsFunction, globals)
            const invocation = createInvocation(globalsWithInputs, insightsFunction)

            if (insightsFunctionState?.state === ScriptWatcherState.degraded) {
                // Degraded functions are not executed immediately
                invocation.queue = 'scriptoverflow'
                await this.cyclotronJobQueue.queueInvocations([invocation])

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
                result = await this.scriptExecutor.execute(invocation)

                // Queue any queued work here. This allows us to enable delayed work like fetching eventually without blocking the API.
                if (!result.finished) {
                    await this.cyclotronJobQueue.queueInvocationResults([result])
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
            logger.error('Error executing custom function', { error })
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

        await this.insightsFunctionMonitoringService.queueInvocationResults([result])
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
            this.scriptWatcher.getCachedEffectiveState(webhookId),
        ])

        if (!webhook) {
            throw new SourceWebhookError(404, 'Not found')
        }

        const { insightsFunction, insightsFlow } = webhook

        if (insightsFunctionState?.state === ScriptWatcherState.disabled) {
            this.insightsFunctionMonitoringService.queueAppMetric(
                {
                    team_id: insightsFunction.team_id,
                    app_source_id: insightsFunction.id,
                    metric_kind: 'failure',
                    metric_name: 'disabled_permanently',
                    count: 1,
                },
                insightsFlow ? 'insights_flow' : 'insights_function'
            )
            throw new SourceWebhookError(429, 'Disabled')
        }

        const result = insightsFlow
            ? await this.executeInsightsFlow(req, insightsFlow, insightsFunction)
            : await this.executeInsightsFunction(req, insightsFunction, insightsFunctionState)

        void this.promiseScheduler.schedule(
            Promise.all([this.insightsFunctionMonitoringService.flush(), this.scriptWatcher.observeResultsBuffered(result)])
        )

        return result
    }

    public async start(): Promise<void> {
        await super.start()
        // Make sure we are ready to produce to cyclotron first
        await this.cyclotronJobQueue.startAsProducer()
    }

    public async stop(): Promise<void> {
        await this.cyclotronJobQueue.stop()
        await this.promiseScheduler.waitForAllSettled()
        // IMPORTANT: super always comes last
        await super.stop()
    }

    public isHealthy(): HealthCheckResult {
        // TODO: What should we consider healthy / unhealthy here? kafka?
        return new HealthCheckResultOk()
    }
}
