import { DateTime } from 'luxon'
import { Histogram } from 'prom-client'

import { ExecResult, convertHogToJS } from '@hanzo/scriptvm'

import { instrumented } from '~/common/tracing/tracing-utils'
import { logger } from '~/common/utils/logger'

import type {
    CyclotronJobInvocationInsightsFunction,
    CyclotronJobInvocationResult,
    InsightsFunctionInvocationGlobals,
    InsightsFunctionInvocationGlobalsWithInputs,
    InsightsFunctionType,
} from '../types'
import { createAddLogFunction, sanitizeLogMessage } from '../utils'
import { execScript } from '../utils/script-exec'
import { convertToInsightsFunctionFilterGlobal, filterFunctionInstrumented } from '../utils/script-function-filtering'
import { createInvocationResult } from '../utils/invocation-utils'
import { ScriptInputsService } from './script-inputs.service'

export interface ScriptExecutorConfig {
    /** Hard wall-clock limit for one Script program. The VM aborts the invocation once it elapses. */
    executionTimeoutMs: number
}

export const MAX_ASYNC_STEPS = 5
export const MAX_FN_LOGS = 25

const scriptExecutionDuration = new Histogram({
    name: 'cdp_insights_function_execution_duration_ms',
    help: 'Processing time and success status of internal functions',
    // We have a timeout so we don't need to worry about much more than that
    buckets: [0, 10, 20, 50, 100, 200, 300, 500, 1000],
})

const insightsFunctionStateMemory = new Histogram({
    name: 'cdp_insights_function_execution_state_memory_kb',
    help: 'The amount of memory in kb used by a script function',
    buckets: [0, 50, 100, 250, 500, 1000, 2000, 3000, 5000, Infinity],
})

function formatNumber(val: number) {
    return Number(val.toPrecision(2)).toString()
}

/**
 * Called when the VM suspends on an async function instead of finishing. The Script core has no way
 * to service one, so a caller that wants async functions (fetch, email, push) must supply this -
 * see ScriptExecutorAsyncService. Without it a suspending function is an error.
 */
export type ScriptExecutorAsyncFunctionHandler = (
    call: { name: string; args: any[]; globals: InsightsFunctionInvocationGlobalsWithInputs },
    result: CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>
) => Promise<void>

/** The parts of an earlier step's result that carry forward into the next one. */
export type ScriptExecutorPreviousResult = Pick<
    Partial<CyclotronJobInvocationResult>,
    'finished' | 'capturedInsightsEvents' | 'warehouseWebhookPayloads' | 'logs' | 'metrics' | 'error' | 'execResult'
>

export type ScriptExecutorExecuteOptions = {
    functions?: Record<string, (args: unknown[]) => unknown>
    /**
     * Async functions are stubbed in the VM so the program can call them and suspend. Defaults to
     * none, meaning any async call is unknown to the VM - callers that can service them pass their
     * names (and an `onAsyncFunction` handler) in.
     */
    asyncFunctionsNames?: string[]
    onAsyncFunction?: ScriptExecutorAsyncFunctionHandler
}

/**
 * Synchronous Script execution: build inputs, run the bytecode, collect logs, metrics and timings.
 *
 * Deliberately has no fetch, email, push, team or Redis dependency - transformations run in
 * ingestion on exactly this and must not inherit CDP delivery infrastructure. Anything that needs
 * to suspend and resume belongs in ScriptExecutorAsyncService, which wraps this one.
 */
export class ScriptExecutorService {
    constructor(
        private config: ScriptExecutorConfig,
        private scriptInputsService: ScriptInputsService
    ) {}

    async buildInputsWithGlobals(
        insightsFunction: InsightsFunctionType,
        globals: InsightsFunctionInvocationGlobals,
        additionalInputs?: Record<string, any>
    ): Promise<InsightsFunctionInvocationGlobalsWithInputs> {
        return this.scriptInputsService.buildInputsWithGlobals(insightsFunction, globals, additionalInputs)
    }

    /**
     * For mapping destinations the per-mapping inputs (e.g. the Google Ads
     * `gclid`) are resolved only for mappings whose filters match the event —
     * see `buildInsightsFunctionInvocations`, which merges `mapping.inputs` when it
     * first builds the invocation. The rerun path re-enqueues invocations with
     * `inputs` stripped and keeps no record of which mapping produced them, so
     * a plain rebuild against the top-level config drops those inputs entirely
     * and any function guarding on them (e.g. `if (empty(inputs.gclid))`)
     * early-exits. Re-match the mappings here against the (current) config to
     * rebuild the additional inputs before the executor resolves them.
     *
     * When several mappings match one event the original produced a separate
     * invocation per mapping; the stored row can't be tied back to a single
     * one, so we merge all matching mappings' inputs — exact for the common
     * single-mapping case and strictly better than dropping them.
     */
    private async resolveMappingInputs(
        insightsFunction: InsightsFunctionType,
        globals: InsightsFunctionInvocationGlobals
    ): Promise<InsightsFunctionType['inputs'] | undefined> {
        const mappings = insightsFunction.mappings
        if (!mappings || mappings.length === 0) {
            return undefined
        }

        const filterGlobals = convertToInsightsFunctionFilterGlobal(globals)
        let merged: InsightsFunctionType['inputs'] | undefined

        for (const mapping of mappings) {
            if (!mapping.inputs) {
                continue
            }
            const { match } = await filterFunctionInstrumented({
                fn: insightsFunction,
                filters: mapping.filters,
                filterGlobals,
            })
            if (match) {
                merged = { ...(merged ?? {}), ...mapping.inputs }
            }
        }

        return merged
    }

    @instrumented({ key: 'script-executor.execute', sendException: false })
    async execute(
        invocation: CyclotronJobInvocationInsightsFunction,
        options: ScriptExecutorExecuteOptions = {},
        previousResult: ScriptExecutorPreviousResult = {}
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
                // Build inputs here when the invocation arrives without them.
                // This is a supported path, not a transitional fallback: the
                // rerun pipeline deliberately re-enqueues invocations with only
                // the bare globals so the run resolves inputs against the
                // current script function config. Callers that pre-resolve inputs
                // (e.g. the mappings path) skip the rebuild.
                if (invocation.state.globals.inputs) {
                    globals = invocation.state.globals
                } else {
                    // Mapping destinations need their per-mapping inputs
                    // re-merged here — they aren't part of the top-level config
                    // and were stripped from the rerun blob.
                    const additionalInputs = await this.resolveMappingInputs(
                        invocation.insightsFunction,
                        invocation.state.globals
                    )
                    globals = await this.scriptInputsService.buildInputsWithGlobals(
                        invocation.insightsFunction,
                        invocation.state.globals,
                        additionalInputs
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

                const asyncFunctions = (options.asyncFunctionsNames ?? []).reduce(
                    (acc, fn) => {
                        acc[fn] = async () => Promise.resolve()
                        return acc
                    },
                    {} as Record<string, (args: any[]) => Promise<void>>
                )

                const execScriptOutcome = await execScript(invocationInput, {
                    globals,
                    timeout: this.config.executionTimeoutMs,
                    maxAsyncSteps: MAX_ASYNC_STEPS, // NOTE: This will likely be configurable in the future
                    asyncFunctions: asyncFunctions,
                    functions: {
                        print: (...args) => {
                            scriptLogs++
                            if (scriptLogs === MAX_FN_LOGS) {
                                addLog(
                                    'warn',
                                    `Function exceeded maximum log entries. No more logs will be collected. Event: ${eventId}`
                                )
                            }

                            if (scriptLogs >= MAX_FN_LOGS) {
                                return
                            }

                            result.logs.push({
                                level: 'info',
                                timestamp: DateTime.now(),
                                message: sanitizeLogMessage(args, sensitiveValues),
                            })
                        },
                        insightsCapture: (event) => {
                            const distinctId = event.distinct_id || globals.event?.distinct_id || globals.person?.id
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

                scriptExecutionDuration.observe(execScriptOutcome.durationMs)

                result.invocation.state.timings.push({
                    kind: 'script',
                    duration_ms: execScriptOutcome.durationMs,
                })

                if (!execScriptOutcome.execResult || execScriptOutcome.error || execScriptOutcome.execResult.error) {
                    throw execScriptOutcome.error ?? execScriptOutcome.execResult?.error ?? new Error('Unknown error')
                }

                execRes = execScriptOutcome.execResult

                // Store the result if execution finished
                if (execRes.finished && Boolean(execRes.result)) {
                    result.execResult = convertHogToJS(execRes.result)
                }
            } catch (e) {
                addLog('error', `Error executing function on event ${eventId}: ${e}`)
                throw e
            }

            result.finished = execRes.finished
            result.invocation.state.vmState = execRes.state

            if (!execRes.finished) {
                const args = (execRes.asyncFunctionArgs ?? []).map((arg) => convertHogToJS(arg))
                if (!execRes.state) {
                    // NOTE: This shouldn't be possible so is more of a type sanity check
                    throw new Error('State should be provided for async function')
                }

                if (execRes.asyncFunctionName) {
                    if (!options.onAsyncFunction) {
                        throw new Error(
                            `Function suspended on async function '${execRes.asyncFunctionName}' but this executor cannot run async functions`
                        )
                    }
                    await options.onAsyncFunction({ name: execRes.asyncFunctionName, args, globals }, result)
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

    getSensitiveValues(insightsFunction: InsightsFunctionType, inputs: Record<string, any>): string[] {
        const values: string[] = []

        const collectStringValues = (obj: any): void => {
            if (obj && typeof obj === 'object') {
                // Assume the values are the sensitive parts
                Object.values(obj).forEach((val: any) => {
                    if (typeof val === 'string') {
                        values.push(val)
                    }
                })
            }
        }

        insightsFunction.inputs_schema?.forEach((schema) => {
            if (
                schema.secret ||
                schema.type === 'integration' ||
                schema.type === 'integration_multi' ||
                schema.type === 'push_subscription'
            ) {
                const value = inputs[schema.key]
                if (typeof value === 'string') {
                    values.push(value)
                } else if (schema.type === 'integration_multi' && Array.isArray(value)) {
                    // integration_multi resolves to an array of integration objects, each carrying its own
                    // sensitive_config (e.g. APNs signing_key, FCM access_token_raw) — mask every one.
                    value.forEach(collectStringValues)
                } else if (
                    (schema.type === 'dictionary' ||
                        schema.type === 'integration' ||
                        schema.type === 'push_subscription') &&
                    typeof value === 'object'
                ) {
                    collectStringValues(value)
                }
            }
        })

        // We don't want to add "REDACTED" for empty strings
        return values.filter((v) => v.trim())
    }
}
