import { DateTime } from 'luxon'
import { AsyncLocalStorage } from 'node:async_hooks'
import { Counter, Histogram } from 'prom-client'

import { ExecResult, convertScriptToJS } from '@insights/scriptvm'

import { instrumented } from '~/common/tracing/tracing-utils'
import { ACCESS_TOKEN_PLACEHOLDER } from '~/config/constants'
import { FetchOptions, FetchResponse, InvalidRequestError, SecureRequestError, fetch } from '~/utils/request'
import { tryCatch } from '~/utils/try-catch'

import { Hub } from '../../types'
import { parseJSON } from '../../utils/json-parse'
import { logger } from '../../utils/logger'
import { UUIDT } from '../../utils/utils'
import { getAsyncFunctionHandler, getRegisteredAsyncFunctionNames } from '../async-function-registry'
import '../async-functions'
import {
    CyclotronJobInvocationInsightsFunction,
    CyclotronJobInvocationResult,
    InsightsFunctionFilterGlobals,
    InsightsFunctionInvocationGlobals,
    InsightsFunctionInvocationGlobalsWithInputs,
    InsightsFunctionType,
    LogEntry,
    MinimalAppMetric,
    MinimalLogEntry,
} from '../types'
import { destinationE2eLagMsSummary } from '../utils'
import { createAddLogFunction, sanitizeLogMessage } from '../utils'
import { execFn } from '../utils/script-exec'
import { convertToInsightsFunctionFilterGlobal, filterFunctionInstrumented } from '../utils/insights-function-filtering'
import { createInvocation, createInvocationResult } from '../utils/invocation-utils'
import { ScriptInputsService, ScriptInputsServiceHub } from './script-inputs.service'
import { EmailService, EmailServiceHub } from './messaging/email.service'
import { RecipientTokensService } from './messaging/recipient-tokens.service'

/** Narrowed config type for CDP fetch retry settings, used by destination executors */
export type CdpFetchConfig = Pick<Hub, 'CDP_FETCH_RETRIES' | 'CDP_FETCH_BACKOFF_BASE_MS' | 'CDP_FETCH_BACKOFF_MAX_MS'>

export type ScriptExecutorServiceHub = CdpFetchConfig &
    ScriptInputsServiceHub &
    EmailServiceHub &
    Pick<Hub, 'CDP_WATCHER_HOG_COST_TIMING_UPPER_MS' | 'CDP_GOOGLE_ADWORDS_DEVELOPER_TOKEN' | 'teamManager'>

const cdpHttpRequests = new Counter({
    name: 'cdp_http_requests',
    help: 'HTTP requests and their outcomes',
    labelNames: ['status', 'template_id'],
})

const cdpHttpRequestTiming = new Histogram({
    name: 'cdp_http_request_timing_ms',
    help: 'Timing of HTTP requests',
    buckets: [0, 10, 20, 50, 100, 200, 500, 1000, 2000, 3000, 5000, 10000],
})

export const shadowFetchContext = new AsyncLocalStorage<boolean>()

export async function cdpTrackedFetch({
    url,
    fetchParams,
    templateId,
}: {
    url: string
    fetchParams: FetchOptions
    templateId: string
}): Promise<{ fetchError: Error | null; fetchResponse: FetchResponse | null; fetchDuration: number }> {
    if (shadowFetchContext.getStore()) {
        return {
            fetchError: null,
            fetchResponse: {
                status: 200,
                headers: {},
                text: () => Promise.resolve(''),
                json: () => Promise.resolve(null),
                dump: () => Promise.resolve(),
            },
            fetchDuration: 0,
        }
    }

    const start = performance.now()
    const [fetchError, fetchResponse] = await tryCatch(async () => await fetch(url, fetchParams))
    const fetchDuration = performance.now() - start
    cdpHttpRequestTiming.observe(fetchDuration)
    cdpHttpRequests.inc({ status: fetchResponse?.status?.toString() ?? 'error', template_id: templateId })

    return { fetchError, fetchResponse, fetchDuration }
}

export const RETRIABLE_STATUS_CODES = [
    408, // Request Timeout
    429, // Too Many Requests (rate limiting)
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
]

function formatNumber(val: number) {
    return Number(val.toPrecision(2)).toString()
}

export const isFetchResponseRetriable = (response: FetchResponse | null, error: any | null): boolean => {
    let canRetry = !!response?.status && RETRIABLE_STATUS_CODES.includes(response.status)

    if (error) {
        if (
            error instanceof SecureRequestError ||
            error instanceof InvalidRequestError ||
            error.name === 'ResponseContentLengthMismatchError'
        ) {
            canRetry = false
        } else {
            canRetry = true // Only retry on general errors, not security, validation, or response parsing errors
        }
    }

    return canRetry
}

export const getNextRetryTime = (backoffBaseMs: number, backoffMaxMs: number, tries: number): DateTime => {
    const backoffMs = Math.min(backoffBaseMs * tries + Math.floor(Math.random() * backoffBaseMs), backoffMaxMs)
    return DateTime.utc().plus({ milliseconds: backoffMs })
}

export const MAX_ASYNC_STEPS = 5
export const MAX_HOG_LOGS = 25
export const EXTEND_OBJECT_KEY = '$$_extend_object'

const scriptExecutionDuration = new Histogram({
    name: 'cdp_insights_function_execution_duration_ms',
    help: 'Processing time and success status of internal functions',
    // We have a timeout so we don't need to worry about much more than that
    buckets: [0, 10, 20, 50, 100, 200, 300, 500, 1000],
})

const insightsFunctionStateMemory = new Histogram({
    name: 'cdp_insights_function_execution_state_memory_kb',
    help: 'The amount of memory in kb used by a custom function',
    buckets: [0, 50, 100, 250, 500, 1000, 2000, 3000, 5000, Infinity],
})

export type ScriptExecutorExecuteOptions = {
    functions?: Record<string, (args: unknown[]) => unknown>
    asyncFunctionsNames?: string[]
}

export type ScriptExecutorExecuteAsyncOptions = ScriptExecutorExecuteOptions & {
    maxAsyncFunctions?: number
}

export class ScriptExecutorService {
    private scriptInputsService: ScriptInputsService
    private emailService: EmailService
    private recipientTokensService: RecipientTokensService

    constructor(private hub: ScriptExecutorServiceHub) {
        this.recipientTokensService = new RecipientTokensService(hub)
        this.scriptInputsService = new ScriptInputsService(hub)
        this.emailService = new EmailService(hub)
    }

    async buildInputsWithGlobals(
        insightsFunction: InsightsFunctionType,
        globals: InsightsFunctionInvocationGlobals,
        additionalInputs?: Record<string, any>
    ): Promise<InsightsFunctionInvocationGlobalsWithInputs> {
        return this.scriptInputsService.buildInputsWithGlobals(insightsFunction, globals, additionalInputs)
    }

    async buildInsightsFunctionInvocations(
        insightsFunctions: InsightsFunctionType[],
        triggerGlobals: InsightsFunctionInvocationGlobals
    ): Promise<{
        invocations: CyclotronJobInvocationInsightsFunction[]
        metrics: MinimalAppMetric[]
        logs: LogEntry[]
    }> {
        const metrics: MinimalAppMetric[] = []
        const logs: LogEntry[] = []
        const invocations: CyclotronJobInvocationInsightsFunction[] = []

        // TRICKY: The frontend generates filters matching the Clickhouse event type so we are converting back
        const filterGlobals = convertToInsightsFunctionFilterGlobal(triggerGlobals)

        const _filterInsightsFunction = async (
            insightsFunction: InsightsFunctionType,
            filters: InsightsFunctionType['filters'],
            filterGlobals: InsightsFunctionFilterGlobals
        ): Promise<boolean> => {
            const filterResults = await filterFunctionInstrumented({
                fn: insightsFunction,
                filters,
                filterGlobals,
            })

            // Add any generated metrics and logs to our collections
            metrics.push(...filterResults.metrics)
            logs.push(...filterResults.logs)

            return filterResults.match
        }

        const _buildInvocation = async (
            insightsFunction: InsightsFunctionType,
            additionalInputs?: InsightsFunctionType['inputs']
        ): Promise<CyclotronJobInvocationInsightsFunction | null> => {
            try {
                const globalsWithSource = {
                    ...triggerGlobals,
                    source: {
                        name: insightsFunction.name ?? `Custom function: ${insightsFunction.id}`,
                        url: `${triggerGlobals.project.url}/pipeline/destinations/insights-function-${insightsFunction.id}/configuration/`,
                    },
                }

                const globalsWithInputs = await this.scriptInputsService.buildInputsWithGlobals(
                    insightsFunction,
                    globalsWithSource,
                    additionalInputs
                )

                return createInvocation(globalsWithInputs, insightsFunction)
            } catch (error) {
                logs.push({
                    team_id: insightsFunction.team_id,
                    log_source: 'insights_function',
                    log_source_id: insightsFunction.id,
                    instance_id: new UUIDT().toString(), // random UUID, like it would be for an invocation
                    timestamp: DateTime.now(),
                    level: 'error',
                    message: `Error building inputs for event ${triggerGlobals.event.uuid}: ${error.message}`,
                })

                metrics.push({
                    team_id: insightsFunction.team_id,
                    app_source_id: insightsFunction.id,
                    metric_kind: 'failure',
                    metric_name: 'inputs_failed',
                    count: 1,
                })

                return null
            }
        }

        await Promise.all(
            insightsFunctions.map(async (insightsFunction) => {
                // We always check the top level filters
                if (!(await _filterInsightsFunction(insightsFunction, insightsFunction.filters, filterGlobals))) {
                    return
                }

                // Check for non-mapping functions first
                if (!insightsFunction.mappings) {
                    const invocation = await _buildInvocation(insightsFunction)
                    if (!invocation) {
                        return
                    }

                    invocations.push(invocation)
                    return
                }

                await Promise.all(
                    insightsFunction.mappings.map(async (mapping) => {
                        if (!(await _filterInsightsFunction(insightsFunction, mapping.filters, filterGlobals))) {
                            return
                        }

                        const invocation = await _buildInvocation(insightsFunction, mapping.inputs ?? {})
                        if (!invocation) {
                            return
                        }

                        invocations.push(invocation)
                    })
                )
            })
        )

        return {
            invocations,
            metrics,
            logs,
        }
    }

    @instrumented('script-executor.executeWithAsyncFunctions')
    async executeWithAsyncFunctions(
        invocation: CyclotronJobInvocationInsightsFunction,
        options?: ScriptExecutorExecuteAsyncOptions
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>> {
        let asyncFunctionCount = 0
        const maxAsyncFunctions = options?.maxAsyncFunctions ?? 1

        let result: CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction> | null = null
        const metrics: MinimalAppMetric[] = []
        const logs: MinimalLogEntry[] = []

        while (!result || !result.finished) {
            const nextInvocation: CyclotronJobInvocationInsightsFunction = result?.invocation ?? invocation

            const queueParamsType = nextInvocation.queueParameters?.type
            if (['fetch', 'email'].includes(queueParamsType ?? '')) {
                asyncFunctionCount++

                if (result && asyncFunctionCount > maxAsyncFunctions) {
                    // We don't want to block the consumer too much hence we have a limit on async functions
                    logger.debug('🦔', `[ScriptExecutor] Max async functions reached: ${maxAsyncFunctions}`)
                    break
                }

                if (queueParamsType === 'fetch') {
                    result = await this.executeFetch(nextInvocation)
                } else if (queueParamsType === 'email') {
                    result = await this.emailService.executeSendEmail(nextInvocation)
                } else {
                    throw new Error(`Unknown queue type: ${queueParamsType}`)
                }
            } else {
                // Finish execution, carrying forward previous execResult
                // Tricky: We don't pass metrics in previousResult as they're accumulated in the local metrics array
                const { metrics: _m, logs: _l, ...previousResultWithoutMetrics } = result || {}
                result = await this.execute(nextInvocation, options, previousResultWithoutMetrics)
            }

            logs.push(...result.logs)
            metrics.push(...result.metrics)

            // If we have finished _or_ something has been scheduled to run later _or_ we have reached the max async functions then we break the loop
            if (result.finished || result.invocation.queueScheduledAt) {
                break
            }
        }

        if (result.finished) {
            const capturedAt = invocation.state.globals.event?.captured_at
            if (capturedAt) {
                const e2eLagMs = Date.now() - new Date(capturedAt).getTime()
                destinationE2eLagMsSummary.observe(e2eLagMs)
            }
        }

        result.logs = logs
        result.metrics = metrics

        return result
    }

    @instrumented({ key: 'script-executor.execute', sendException: false })
    async execute(
        invocation: CyclotronJobInvocationInsightsFunction,
        options: ScriptExecutorExecuteOptions = {},
        previousResult: Pick<
            Partial<CyclotronJobInvocationResult>,
            'finished' | 'capturedInsightsEvents' | 'logs' | 'metrics' | 'error' | 'execResult'
        > = {}
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>> {
        const loggingContext = {
            invocationId: invocation.id,
            insightsFunctionId: invocation.insightsFunction.id,
            insightsFunctionName: invocation.insightsFunction.name,
            insightsFunctionUrl: invocation.state.globals.source?.url,
        }

        logger.debug('🦔', `[ScriptExecutor] Executing function`, loggingContext)

        const result = createInvocationResult<CyclotronJobInvocationInsightsFunction>(invocation, {}, previousResult)
        const addLog = createAddLogFunction(result.logs)

        try {
            let globals: InsightsFunctionInvocationGlobalsWithInputs
            let execRes: ExecResult | undefined = undefined

            try {
                // NOTE: As of the mappings work, we added input generation to the caller, reducing the amount of data passed into the function
                // This is just a fallback to support the old format - once fully migrated we can remove the building and just use the globals
                if (invocation.state.globals.inputs) {
                    globals = invocation.state.globals
                } else {
                    globals = await this.scriptInputsService.buildInputsWithGlobals(
                        invocation.insightsFunction,
                        invocation.state.globals
                    )
                }
            } catch (e) {
                addLog('error', `Error building inputs: ${e}`)

                throw e
            }

            const sensitiveValues = this.getSensitiveValues(invocation.insightsFunction, globals.inputs)
            const invocationInput = invocation.state.vmState ?? invocation.insightsFunction.bytecode
            const eventId = invocation?.state.globals?.event?.uuid || 'Unknown event'

            try {
                let scriptLogs = 0

                const asyncFunctionsNames = options.asyncFunctionsNames ?? getRegisteredAsyncFunctionNames()
                const asyncFunctions = asyncFunctionsNames.reduce(
                    (acc, fn) => {
                        acc[fn] = async () => Promise.resolve()
                        return acc
                    },
                    {} as Record<string, (args: any[]) => Promise<void>>
                )

                const execFnOutcome = await execFn(invocationInput, {
                    globals,
                    timeout: this.hub.CDP_WATCHER_HOG_COST_TIMING_UPPER_MS,
                    maxAsyncSteps: MAX_ASYNC_STEPS, // NOTE: This will likely be configurable in the future
                    asyncFunctions: asyncFunctions,
                    functions: {
                        print: (...args: any[]) => {
                            scriptLogs++
                            if (scriptLogs === MAX_HOG_LOGS) {
                                addLog(
                                    'warn',
                                    `Function exceeded maximum log entries. No more logs will be collected. Event: ${eventId}`
                                )
                            }

                            if (scriptLogs >= MAX_HOG_LOGS) {
                                return
                            }

                            result.logs.push({
                                level: 'info',
                                timestamp: DateTime.now(),
                                message: sanitizeLogMessage(args, sensitiveValues),
                            })
                        },
                        generateMessagingPreferencesUrl: (identifier: any): string | null => {
                            return identifier && typeof identifier === 'string'
                                ? this.recipientTokensService.generatePreferencesUrl({
                                      team_id: invocation.teamId,
                                      identifier,
                                  })
                                : null
                        },
                        insightsCapture: (event: any) => {
                            const distinctId = event.distinct_id || globals.event?.distinct_id
                            const eventName = event.event
                            const eventProperties = event.properties || {}

                            if (typeof event.event !== 'string') {
                                throw new Error("[InsightsFunction] - insightsCapture call missing 'event' property")
                            }

                            if (!distinctId) {
                                throw new Error("[InsightsFunction] - insightsCapture call missing 'distinct_id' property")
                            }

                            if (result.capturedInsightsEvents.length > 0) {
                                throw new Error(
                                    'insightsCapture was called more than once. Only one call is allowed per function'
                                )
                            }

                            if (globals.event) {
                                // Protection to stop a recursive loop
                                const givenCount = globals.event.properties?.$insights_function_execution_count
                                const executionCount = typeof givenCount === 'number' ? givenCount : 0

                                if (executionCount > 9) {
                                    addLog(
                                        'warn',
                                        `insightsCapture was called from an event that already executed this function 10 times previously. To prevent unbounded infinite loops, the event was not captured.`
                                    )
                                    return
                                }

                                // Increment the execution count so that we can check it in the future
                                eventProperties.$insights_function_execution_count = executionCount + 1
                            }

                            result.capturedInsightsEvents.push({
                                team_id: invocation.teamId,
                                timestamp: DateTime.utc().toISO(),
                                distinct_id: distinctId,
                                event: eventName,
                                properties: {
                                    ...eventProperties,
                                },
                            })
                        },
                        ...options.functions,
                    },
                })

                scriptExecutionDuration.observe(execFnOutcome.durationMs)

                result.invocation.state.timings.push({
                    kind: 'fn',
                    duration_ms: execFnOutcome.durationMs,
                })

                if (!execFnOutcome.execResult || execFnOutcome.error || execFnOutcome.execResult.error) {
                    throw execFnOutcome.error ?? execFnOutcome.execResult?.error ?? new Error('Unknown error')
                }

                execRes = execFnOutcome.execResult

                // Store the result if execution finished
                if (execRes.finished && Boolean(execRes.result)) {
                    result.execResult = convertScriptToJS(execRes.result)
                }
            } catch (e) {
                addLog('error', `Error executing function on event ${eventId}: ${e}`)
                throw e
            }

            result.finished = execRes.finished
            result.invocation.state.vmState = execRes.state

            if (!execRes.finished) {
                const args = (execRes.asyncFunctionArgs ?? []).map((arg: any) => convertScriptToJS(arg))
                if (!execRes.state) {
                    // NOTE: This shouldn't be possible so is more of a type sanity check
                    throw new Error('State should be provided for async function')
                }

                if (execRes.asyncFunctionName) {
                    const handler = getAsyncFunctionHandler(execRes.asyncFunctionName)
                    if (!handler) {
                        throw new Error(`Unknown async function '${execRes.asyncFunctionName}'`)
                    }
                    await handler.execute(args, { invocation: result.invocation, globals, hub: this.hub }, result)
                } else {
                    addLog('warn', `Function was not finished but also had no async function to execute.`)
                }
            } else {
                const totalDuration = result.invocation.state.timings.reduce(
                    (acc, timing) => acc + timing.duration_ms,
                    0
                )
                const messages = [`Function completed in ${formatNumber(totalDuration)}ms.`]
                if (execRes.state) {
                    messages.push(`Sync: ${formatNumber(execRes.state.syncDuration)}ms.`)
                    messages.push(`Mem: ${formatNumber(execRes.state.maxMemUsed / 1024)}kb.`)
                    messages.push(`Ops: ${execRes.state.ops}.`)
                    messages.push(`Event: '${globals.event.url}'`)

                    insightsFunctionStateMemory.observe(execRes.state.maxMemUsed / 1024)

                    if (execRes.state.maxMemUsed > 1024 * 1024) {
                        // If the memory used is more than a MB then we should log it
                        logger.warn('🦔', `[ScriptExecutor] Function used more than 1MB of memory`, {
                            insightsFunctionId: invocation.insightsFunction.id,
                            insightsFunctionName: invocation.insightsFunction.name,
                            teamId: invocation.teamId,
                            eventId: invocation.state.globals.event.url,
                            memoryUsedKb: execRes.state.maxMemUsed / 1024,
                        })
                    }
                }
                addLog('debug', messages.join(' '))
            }
        } catch (err) {
            result.error = err.message
            result.finished = true // Explicitly set to true to prevent infinite loops
        }

        return result
    }

    @instrumented('script-executor.executeFetch')
    async executeFetch(
        invocation: CyclotronJobInvocationInsightsFunction
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>> {
        const templateId = invocation.insightsFunction.template_id ?? 'unknown'
        if (invocation.queueParameters?.type !== 'fetch') {
            throw new Error('Bad invocation')
        }

        const params = invocation.queueParameters

        const result = createInvocationResult<CyclotronJobInvocationInsightsFunction>(
            invocation,
            {},
            {
                finished: false,
            }
        )
        const addLog = createAddLogFunction(result.logs)

        const method = params.method.toUpperCase()
        let headers = params.headers ?? {}

        if (params.url.startsWith('https://googleads.googleapis.com/') && !headers['developer-token']) {
            headers['developer-token'] = this.hub.CDP_GOOGLE_ADWORDS_DEVELOPER_TOKEN
        }

        const integrationInputs = await this.scriptInputsService.loadIntegrationInputs(invocation.insightsFunction)

        if (Object.keys(integrationInputs).length > 0) {
            for (const [key, value] of Object.entries(integrationInputs)) {
                const accessToken: string = value.value?.access_token_raw
                if (!accessToken) {
                    continue
                }

                const placeholder: string = ACCESS_TOKEN_PLACEHOLDER + invocation.insightsFunction.inputs?.[key]?.value

                if (placeholder && accessToken) {
                    const replace = (val: string) => val.replaceAll(placeholder, accessToken)

                    params.body = params.body ? replace(params.body) : params.body
                    headers = Object.fromEntries(
                        Object.entries(params.headers ?? {}).map(([key, value]) => [
                            key,
                            typeof value === 'string' ? replace(value) : value,
                        ])
                    )
                    params.url = replace(params.url)
                }
            }
        }

        const fetchParams: FetchOptions = { method, headers }

        if (!['GET', 'HEAD'].includes(method) && params.body) {
            fetchParams.body = params.body
        }

        const { fetchError, fetchResponse, fetchDuration } = await cdpTrackedFetch({
            url: params.url,
            fetchParams,
            templateId,
        })

        result.invocation.state.timings.push({
            kind: 'async_function',
            duration_ms: fetchDuration,
        })

        result.invocation.state.attempts++

        if (!fetchResponse || (fetchResponse?.status && fetchResponse.status >= 400)) {
            const backoffMs = Math.min(
                this.hub.CDP_FETCH_BACKOFF_BASE_MS * result.invocation.state.attempts +
                    Math.floor(Math.random() * this.hub.CDP_FETCH_BACKOFF_BASE_MS),
                this.hub.CDP_FETCH_BACKOFF_MAX_MS
            )

            const canRetry = isFetchResponseRetriable(fetchResponse, fetchError)

            let message = `HTTP fetch failed on attempt ${result.invocation.state.attempts} with status code ${
                fetchResponse?.status ?? '(none)'
            }.`

            if (fetchError) {
                message += ` Error: ${fetchError.message}.`
            }

            if (canRetry) {
                message += ` Retrying in ${backoffMs}ms.`
            }

            addLog('error', message)

            if (canRetry && result.invocation.state.attempts < this.hub.CDP_FETCH_RETRIES) {
                await fetchResponse?.dump()
                result.invocation.queue = 'fn'
                result.invocation.queueParameters = params
                result.invocation.queuePriority = invocation.queuePriority + 1
                result.invocation.queueScheduledAt = DateTime.utc().plus({ milliseconds: backoffMs })

                return result
            } else {
                result.error = new Error(message)
            }
        }

        // Reset the attempts as we are done
        result.invocation.state.attempts = 0

        let body: unknown = undefined
        try {
            body = await fetchResponse?.text()

            if (typeof body === 'string') {
                try {
                    body = parseJSON(body)
                } catch (e) {
                    // Pass through the error
                }
            }
        } catch (e) {
            addLog('error', `Failed to parse response body: ${e.message}`)
            body = undefined
        }

        const scriptVmResponse: {
            status: number
            body: unknown
        } = {
            status: fetchResponse?.status ?? 500,
            body,
        }

        // Finally we create the response object as the VM expects
        result.invocation.state.vmState!.stack.push(scriptVmResponse)
        result.execResult = scriptVmResponse

        result.metrics.push({
            team_id: invocation.teamId,
            app_source_id: invocation.functionId,
            metric_kind: 'other',
            metric_name: 'fetch',
            count: 1,
        })

        return result
    }

    getSensitiveValues(insightsFunction: InsightsFunctionType, inputs: Record<string, any>): string[] {
        const values: string[] = []

        insightsFunction.inputs_schema?.forEach((schema) => {
            if (schema.secret || schema.type === 'integration') {
                const value = inputs[schema.key]
                if (typeof value === 'string') {
                    values.push(value)
                } else if (
                    (schema.type === 'dictionary' || schema.type === 'integration') &&
                    typeof value === 'object'
                ) {
                    // Assume the values are the sensitive parts
                    Object.values(value).forEach((val: any) => {
                        if (typeof val === 'string') {
                            values.push(val)
                        }
                    })
                }
            }
        })

        // We don't want to add "REDACTED" for empty strings
        return values.filter((v) => v.trim())
    }
}
