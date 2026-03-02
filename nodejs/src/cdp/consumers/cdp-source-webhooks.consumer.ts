import { DateTime } from 'luxon'

import { ModifiedRequest } from '~/api/router'
import { instrumented } from '~/common/tracing/tracing-utils'
import { CustomFlow } from '~/schema/customflow'

import { HealthCheckResult, HealthCheckResultOk, Hub, PluginsServerConfig } from '../../types'
import { logger } from '../../utils/logger'
import { PromiseScheduler } from '../../utils/promise-scheduler'
import { UUID, UUIDT } from '../../utils/utils'
import { createCustomFlowInvocation } from '../services/customflows/customflow-executor.service'
import { actionIdForLogging } from '../services/customflows/customflow-utils'
import { CyclotronJobQueue } from '../services/job-queue/job-queue'
import { ScriptWatcherFunctionState, ScriptWatcherState } from '../services/monitoring/script-watcher.service'
import {
    CyclotronJobInvocationCustomFunction,
    CyclotronJobInvocationResult,
    CustomFunctionFilterGlobals,
    CustomFunctionInvocationGlobals,
    CustomFunctionType,
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

export type CustomFunctionWebhookResult = {
    status: number
    body: Record<string, any> | string
    contentType?: string
}

export const getCustomHttpResponse = (
    result: CyclotronJobInvocationResult<CyclotronJobInvocationCustomFunction>
): CustomFunctionWebhookResult | null => {
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
        this.cyclotronJobQueue = new CyclotronJobQueue(hub, 'custom_script')
    }

    public async getWebhook(webhookId: string): Promise<{ customFlow?: CustomFlow; customFunction: CustomFunctionType } | null> {
        if (!UUID.validateString(webhookId, false)) {
            return null
        }

        // Check for custom functions
        const customFunction = await this.customFunctionManager.getCustomFunction(webhookId)
        if (customFunction?.type === 'source_webhook' && customFunction?.enabled) {
            return { customFunction }
        }

        if (customFunction?.type === 'warehouse_source_webhook' && customFunction?.enabled) {
            const templateId = customFunction.template_id ?? 'template-warehouse-source-default'
            const template = await this.customFunctionTemplateManager.getCustomFunctionTemplate(templateId)
            if (template) {
                customFunction.bytecode = template.bytecode
                return { customFunction }
            }
        }

        // Otherwise check for custom flows
        const customFlow = await this.customFlowManager.getCustomFlow(webhookId)
        if (
            customFlow &&
            customFlow.status === 'active' &&
            (customFlow.trigger?.type === 'webhook' ||
                customFlow.trigger?.type === 'tracking_pixel' ||
                customFlow.trigger?.type === 'manual' ||
                customFlow.trigger?.type === 'schedule')
        ) {
            const customFunction = await this.customFlowFunctionsService.buildCustomFunction(customFlow, customFlow.trigger)

            return { customFlow, customFunction }
        }

        return null
    }

    private buildRequestGlobals(customFunction: CustomFunctionType, req: ModifiedRequest): CustomFunctionInvocationGlobals {
        const body: Record<string, any> = req.body

        const ipValue = getFirstHeaderValue(req.headers['x-forwarded-for']) || req.socket.remoteAddress || req.ip
        // IP could be comma delimited list of IPs
        const ips = ipValue?.split(',').map((ip) => ip.trim()) || []
        const ip = ips[0]

        const projectUrl = `${this.hub.SITE_URL}/project/${customFunction.team_id}`
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
                name: customFunction.name ?? `Custom function: ${customFunction.id}`,
                url: `${projectUrl}/functions/${customFunction.id}`,
            },
            project: {
                id: customFunction.team_id,
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

    private async executeCustomFlow(
        req: ModifiedRequest,
        customFlow: CustomFlow,
        customFunction: CustomFunctionType
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationCustomFunction>> {
        logger.info('Executing custom flow trigger', {
            id: customFlow.id,
            template_id: customFunction.template_id,
            team_id: customFlow.team_id,
        })
        const invocationId = new UUIDT().toString()
        const triggerActionId = customFlow.actions.find((action) => action.type === 'trigger')?.id ?? 'trigger_node'

        const addLog = (level: LogEntryLevel, message: string) => {
            this.customFunctionMonitoringService.queueLogs(
                [
                    {
                        team_id: customFlow.team_id,
                        log_source: 'custom_flow',
                        log_source_id: customFlow.id,
                        instance_id: invocationId,
                        ...logEntry(level, `${actionIdForLogging({ id: triggerActionId })} ${message}`),
                    },
                ],
                'custom_flow'
            )
        }

        const addMetric = (metric: Pick<MinimalAppMetric, 'metric_kind' | 'metric_name' | 'count'>) => {
            this.customFunctionMonitoringService.queueAppMetric(
                {
                    team_id: customFlow.team_id,
                    app_source_id: customFlow.id,
                    ...metric,
                },
                'custom_flow'
            )
        }

        try {
            const globals: CustomFunctionInvocationGlobals = this.buildRequestGlobals(customFunction, req)

            const globalsWithInputs = await this.scriptExecutor.buildInputsWithGlobals(customFunction, globals)
            const invocation = createInvocation(globalsWithInputs, customFunction)

            // Slightly different handling for custom flows
            // Run the initial step - this allows functions not using fetches to respond immediately
            const functionResult = await this.customFlowFunctionsService.execute(invocation)
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
                const { $custom_function_execution_count, ...cleanProperties } = capturedInsightsEvent.properties || {}

                // Invoke the customflow
                const triggerGlobals: CustomFunctionInvocationGlobals = {
                    ...invocation.state.globals,
                    event: {
                        ...capturedInsightsEvent,
                        properties: cleanProperties,
                        uuid: new UUIDT().toString(),
                        elements_chain: '',
                        url: '',
                    },
                }
                const customFlowInvocation = createCustomFlowInvocation(
                    triggerGlobals,
                    customFlow,
                    {} as CustomFunctionFilterGlobals
                )

                const scheduledAt = customFlow.trigger && 'scheduled_at' in customFlow.trigger && customFlow.trigger.scheduled_at
                if (scheduledAt) {
                    const scheduledDateTime = DateTime.fromISO(scheduledAt)
                    if (!scheduledDateTime.isValid) {
                        addLog('warn', `Invalid scheduled_at date format: ${scheduledAt}`)
                    } else {
                        customFlowInvocation.queueScheduledAt = scheduledDateTime
                        addLog('info', `Workflow run scheduled for ${scheduledAt}`)
                    }
                }

                customFlowInvocation.id = invocationId // Keep the IDs consistent

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

                await this.cyclotronJobQueue.queueInvocations([customFlowInvocation])
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
                createInvocation({} as any, customFunction),
                {},
                {
                    finished: false,
                    error: error.message,
                }
            )
        }
    }

    private async executeCustomFunction(
        req: ModifiedRequest,
        customFunction: CustomFunctionType,
        customFunctionState: ScriptWatcherFunctionState | null
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationCustomFunction>> {
        let result: CyclotronJobInvocationResult<CyclotronJobInvocationCustomFunction>

        try {
            const globals: CustomFunctionInvocationGlobals = this.buildRequestGlobals(customFunction, req)
            const globalsWithInputs = await this.scriptExecutor.buildInputsWithGlobals(customFunction, globals)
            const invocation = createInvocation(globalsWithInputs, customFunction)

            if (customFunctionState?.state === ScriptWatcherState.degraded) {
                // Degraded functions are not executed immediately
                invocation.queue = 'scriptoverflow'
                await this.cyclotronJobQueue.queueInvocations([invocation])

                result = createInvocationResult<CyclotronJobInvocationCustomFunction>(
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
                createInvocation({} as any, customFunction),
                {},
                {
                    finished: true,
                    error: error.message,
                    logs: [{ level: 'error', message: error.message, timestamp: DateTime.now() }],
                }
            )
        }

        await this.customFunctionMonitoringService.queueInvocationResults([result])
        return result
    }

    @instrumented('cdpSourceWebhooksConsumer.processWebhook')
    public async processWebhook(
        identifier: string,
        req: ModifiedRequest
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationCustomFunction>> {
        // NOTE: To simplify usage we allow setting a range of extensions for webhooks
        // Currently we just ignore it
        const [webhookId, _extension] = identifier.split('.')

        const [webhook, customFunctionState] = await Promise.all([
            this.getWebhook(webhookId),
            this.scriptWatcher.getCachedEffectiveState(webhookId),
        ])

        if (!webhook) {
            throw new SourceWebhookError(404, 'Not found')
        }

        const { customFunction, customFlow } = webhook

        if (customFunctionState?.state === ScriptWatcherState.disabled) {
            this.customFunctionMonitoringService.queueAppMetric(
                {
                    team_id: customFunction.team_id,
                    app_source_id: customFunction.id,
                    metric_kind: 'failure',
                    metric_name: 'disabled_permanently',
                    count: 1,
                },
                customFlow ? 'custom_flow' : 'custom_function'
            )
            throw new SourceWebhookError(429, 'Disabled')
        }

        const result = customFlow
            ? await this.executeCustomFlow(req, customFlow, customFunction)
            : await this.executeCustomFunction(req, customFunction, customFunctionState)

        void this.promiseScheduler.schedule(
            Promise.all([this.customFunctionMonitoringService.flush(), this.scriptWatcher.observeResultsBuffered(result)])
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
