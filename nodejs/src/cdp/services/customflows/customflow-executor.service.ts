import { get } from 'lodash'
import { DateTime } from 'luxon'

import { CustomFlow, CustomFlowAction } from '../../../schema/customflow'
import { logger } from '../../../utils/logger'
import { UUIDT } from '../../../utils/utils'
import {
    CyclotronJobInvocationCustomFlow,
    CyclotronJobInvocationResult,
    CustomFunctionCapturedEvent,
    CustomFunctionFilterGlobals,
    CustomFunctionInvocationGlobals,
    LogEntry,
    LogEntryLevel,
    MinimalAppMetric,
    MinimalLogEntry,
} from '../../types'
import { convertToCustomFunctionFilterGlobal, filterFunctionInstrumented } from '../../utils/custom-function-filtering'
import { createInvocationResult } from '../../utils/invocation-utils'
import { ScriptExecutorExecuteAsyncOptions } from '../script-executor.service'
import { RecipientPreferencesService } from '../messaging/recipient-preferences.service'
import { ActionHandler } from './actions/action.interface'
import { ConditionalBranchHandler } from './actions/conditional_branch'
import { DelayHandler } from './actions/delay'
import { ExitHandler } from './actions/exit.handler'
import { CustomFunctionHandler } from './actions/custom_function'
import { RandomCohortBranchHandler } from './actions/random_cohort_branch'
import { TriggerHandler } from './actions/trigger.handler'
import { WaitUntilTimeWindowHandler } from './actions/wait_until_time_window'
import { CustomFlowFunctionsService } from './customflow-functions.service'
import {
    actionIdForLogging,
    ensureCurrentAction,
    findContinueAction,
    shouldSkipAction,
    trackE2eLag,
} from './customflow-utils'

export const MAX_ACTION_STEPS_HARD_LIMIT = 1000

export function createCustomFlowInvocation(
    globals: CustomFunctionInvocationGlobals,
    customFlow: CustomFlow,
    filterGlobals: CustomFunctionFilterGlobals
): CyclotronJobInvocationCustomFlow {
    // Build default variables from customFlow, then merge in any provided in globals.variables
    const defaultVariables =
        customFlow.variables?.reduce(
            (acc, variable) => {
                acc[variable.key] = variable.default || null
                return acc
            },
            {} as Record<string, any>
        ) || {}

    const mergedVariables = {
        ...defaultVariables,
        ...(globals.variables || {}),
    }

    return {
        id: new UUIDT().toString(),
        state: {
            event: globals.event,
            actionStepCount: 0,
            variables: mergedVariables,
        },
        teamId: customFlow.team_id,
        functionId: customFlow.id, // TODO: Include version?
        customFlow,
        person: globals.person, // This is outside of state as we don't persist it
        filterGlobals,
        queue: 'customflow',
        queuePriority: 1,
    }
}

export class CustomFlowExecutorService {
    private readonly actionHandlers: Record<CustomFlowAction['type'], ActionHandler>

    constructor(
        customFlowFunctionsService: CustomFlowFunctionsService,
        recipientPreferencesService: RecipientPreferencesService
    ) {
        const customFunctionHandler = new CustomFunctionHandler(customFlowFunctionsService, recipientPreferencesService, 'fetch')
        const customFunctionEmailHandler = new CustomFunctionHandler(
            customFlowFunctionsService,
            recipientPreferencesService,
            'email'
        )

        this.actionHandlers = {
            trigger: new TriggerHandler(),
            conditional_branch: new ConditionalBranchHandler(),
            wait_until_condition: new ConditionalBranchHandler(),
            delay: new DelayHandler(),
            wait_until_time_window: new WaitUntilTimeWindowHandler(),
            random_cohort_branch: new RandomCohortBranchHandler(),
            function: customFunctionHandler,
            function_sms: customFunctionHandler,
            function_email: customFunctionEmailHandler,
            exit: new ExitHandler(),
        }
    }

    async buildCustomFlowInvocations(
        customFlows: CustomFlow[],
        triggerGlobals: CustomFunctionInvocationGlobals
    ): Promise<{
        invocations: CyclotronJobInvocationCustomFlow[]
        metrics: MinimalAppMetric[]
        logs: LogEntry[]
    }> {
        const metrics: MinimalAppMetric[] = []
        const logs: LogEntry[] = []
        const invocations: CyclotronJobInvocationCustomFlow[] = []

        // TRICKY: The frontend generates filters matching the Clickhouse event type so we are converting back
        const filterGlobals = convertToCustomFunctionFilterGlobal(triggerGlobals)

        for (const customFlow of customFlows) {
            if (customFlow.trigger.type !== 'event') {
                continue
            }
            const filterResults = await filterFunctionInstrumented({
                fn: customFlow,
                filters: customFlow.trigger.filters,
                filterGlobals,
            })

            // Add any generated metrics and logs to our collections
            metrics.push(...filterResults.metrics)
            logs.push(...filterResults.logs)

            if (!filterResults.match) {
                continue
            }

            const invocation = createCustomFlowInvocation(triggerGlobals, customFlow, filterGlobals)
            invocations.push(invocation)
        }

        return {
            invocations,
            metrics,
            logs,
        }
    }

    async execute(
        invocation: CyclotronJobInvocationCustomFlow
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow>> {
        let result: CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow> | null = null
        const metrics: MinimalAppMetric[] = []
        const logs: MinimalLogEntry[] = []
        const capturedInsightsEvents: CustomFunctionCapturedEvent[] = []

        const earlyExitResult = await this.shouldExitEarly(invocation)
        if (earlyExitResult) {
            return earlyExitResult
        }

        logs.push(this.logExecutionTriggerInfo(invocation))

        while (!result || !result.finished) {
            const nextInvocation: CyclotronJobInvocationCustomFlow = result?.invocation ?? invocation

            // Here we could be continuing the custom function side of things?
            result = await this.executeCurrentAction(nextInvocation)

            if (result.finished) {
                if (result.error) {
                    this.log(result, 'error', `Workflow encountered an error: ${result.error}`)
                } else {
                    this.log(result, 'info', `Workflow completed`)
                }

                trackE2eLag(result)
            }

            logs.push(...result.logs)
            metrics.push(...result.metrics)
            capturedInsightsEvents.push(...result.capturedInsightsEvents)

            if (this.shouldEndCustomFlowExecution(result, logs)) {
                break
            }
        }

        result.logs = logs
        result.metrics = metrics
        result.capturedInsightsEvents = capturedInsightsEvents

        return result
    }

    private shouldEndCustomFlowExecution(
        result: CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow>,
        logs: MinimalLogEntry[]
    ): boolean {
        const finishedWithoutError = result.finished && !result.error
        const delayScheduled = Boolean(result.invocation.queueScheduledAt)

        let shouldAbortAfterError = false
        if (result.error) {
            const lastExecutedActionId = result.invocation.state.currentAction?.id
            const lastExecutedAction = result.invocation.customFlow.actions.find((a) => a.id === lastExecutedActionId)

            if (lastExecutedAction?.on_error === 'abort') {
                shouldAbortAfterError = true
                logs.push({
                    level: 'info',
                    timestamp: DateTime.now(),
                    message: `Workflow is aborting due to ${actionIdForLogging(lastExecutedAction)} error handling setting being set to abort on error`,
                })
            }
        }

        /**
         * If one of the following happens:
         * - we have finished the flow successfully
         * - something has been scheduled to run later
         * - there was an error during the action and the action's on_error is set to 'abort'
         * - we have reached the max async functions count
         *
         * then we break the loop
         */
        return finishedWithoutError || delayScheduled || shouldAbortAfterError
    }

    /**
     * Determines if the invocation should exit early based on the customflow's exit condition
     */
    private async shouldExitEarly(
        invocation: CyclotronJobInvocationCustomFlow
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow> | null> {
        let earlyExitResult: CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow> | null = null

        const { customFlow, person } = invocation
        let shouldExit = false
        let exitReason = ''

        let triggerMatch: boolean | undefined = undefined
        let conversionMatch: boolean | undefined = undefined

        if (customFlow.trigger.type === 'event' && customFlow.trigger.filters && person) {
            const filterResult = await filterFunctionInstrumented({
                fn: customFlow,
                filters: customFlow.trigger.filters,
                filterGlobals: invocation.filterGlobals,
            })
            triggerMatch = filterResult.match
        }
        if (customFlow.conversion?.filters && person) {
            const filterResult = await filterFunctionInstrumented({
                fn: customFlow,
                filters: customFlow.conversion.filters,
                filterGlobals: invocation.filterGlobals,
            })
            conversionMatch = filterResult.match
        }

        switch (customFlow.exit_condition) {
            case 'exit_on_trigger_not_matched':
                if (triggerMatch === false) {
                    shouldExit = true
                    exitReason = 'Person no longer matches trigger filters'
                }
                break
            case 'exit_on_conversion':
                if (conversionMatch === true) {
                    shouldExit = true
                    exitReason = 'Person matches conversion filters'
                }
                break
            case 'exit_on_trigger_not_matched_or_conversion':
                if (triggerMatch === false || conversionMatch === true) {
                    shouldExit = true
                    exitReason =
                        triggerMatch === false
                            ? 'Person no longer matches trigger filters'
                            : 'Person matches conversion filters'
                }
                break
        }

        if (shouldExit) {
            earlyExitResult = createInvocationResult<CyclotronJobInvocationCustomFlow>(invocation)
            earlyExitResult.finished = true
            earlyExitResult.logs.push({
                level: 'info',
                timestamp: DateTime.now(),
                message: `Workflow exited early due to exit condition: ${customFlow.exit_condition} (${exitReason})`,
            })
            earlyExitResult.metrics.push({
                team_id: customFlow.team_id,
                app_source_id: customFlow.id,
                instance_id: invocation.state?.currentAction?.id || 'exit_condition',
                metric_kind: 'other',
                metric_name: 'early_exit',
                count: 1,
            })
        }

        return earlyExitResult
    }

    public async executeCurrentAction(
        invocation: CyclotronJobInvocationCustomFlow,
        options?: {
            scriptExecutorOptions?: ScriptExecutorExecuteAsyncOptions
        }
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow>> {
        const result = createInvocationResult<CyclotronJobInvocationCustomFlow>(invocation)
        result.finished = false // Typically we are never finished unless we error or exit

        try {
            const currentAction = ensureCurrentAction(invocation)

            if (await shouldSkipAction(invocation, currentAction)) {
                this.logAction(result, currentAction, 'info', `Skipped due to filter conditions`)
                this.goToNextAction(result, currentAction, findContinueAction(invocation), 'filtered')

                return result
            }

            result.logs.push({
                level: 'debug',
                message: `Executing action ${actionIdForLogging(currentAction)}`,
                timestamp: DateTime.now(),
            })
            logger.debug('🦔', `[CustomFlowActionRunner] Running action ${currentAction.type}`, {
                action: currentAction,
                invocation,
            })

            const handler = this.actionHandlers[currentAction.type]
            if (!handler) {
                throw new Error(`Action type '${currentAction.type}' not supported`)
            }

            try {
                const handlerResult = await handler.execute({
                    invocation,
                    action: currentAction,
                    result,
                    scriptExecutorOptions: options?.scriptExecutorOptions,
                })

                if (handlerResult.error) {
                    throw handlerResult.error instanceof Error ? handlerResult.error : new Error(handlerResult.error)
                }

                if (handlerResult.result) {
                    this.trackActionResult(result, currentAction, handlerResult.result)
                    result.execResult = handlerResult.result
                }

                if (handlerResult.finished) {
                    result.finished = true
                    // Special case for exit - we just track a success metric
                    this.trackActionMetric(result, currentAction, 'succeeded')
                }

                if (handlerResult.scheduledAt) {
                    this.scheduleInvocation(result, handlerResult.scheduledAt)
                }

                if (handlerResult.nextAction) {
                    this.goToNextAction(result, currentAction, handlerResult.nextAction, 'succeeded')
                }
            } catch (err) {
                // Add logs and metric specifically for this action
                this.logAction(result, currentAction, 'error', `Errored: ${String(err)}`) // TODO: Is this enough detail?
                this.trackActionMetric(result, currentAction, 'failed')

                throw err
            }
        } catch (err) {
            // The final catch - in this case we are always just logging the final outcome
            result.error = err.message
            result.finished = true // Explicitly set to true to prevent infinite loops

            this.maybeContinueToNextActionOnError(result)

            logger.error(
                '🦔',
                `[CustomFlowExecutor] Error executing custom flow ${invocation.customFlow.id} - ${invocation.customFlow.name}. Event: '${invocation.state.event?.url}'`,
                err
            )
        }

        return result
    }

    private goToNextAction(
        result: CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow>,
        currentAction: CustomFlowAction,
        nextAction: CustomFlowAction,
        reason: 'filtered' | 'failed' | 'succeeded'
    ): CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow> {
        result.finished = false

        result.invocation.state.actionStepCount++
        // Update the state to be going to the next action
        result.invocation.state.currentAction = {
            id: nextAction.id,
            startedAtTimestamp: DateTime.now().toMillis(),
        }

        result.logs.push({
            level: 'info',
            timestamp: DateTime.now(),
            message: `Workflow moved to action ${actionIdForLogging(nextAction)}`,
        })

        this.trackActionMetric(result, currentAction, reason)

        return result
    }

    /**
     * If the action has on_error set to 'continue' then we continue to the next action instead of failing the flow
     */
    private maybeContinueToNextActionOnError(
        result: CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow>
    ): void {
        try {
            const { invocation } = result
            // If current action's on_error is set to 'continue', we move to the next action instead of failing the flow
            const currentAction = ensureCurrentAction(invocation)
            if (currentAction?.on_error === 'continue') {
                const nextAction = findContinueAction(invocation)
                if (nextAction) {
                    this.logAction(
                        result,
                        currentAction,
                        'info',
                        `Continuing to next action ${actionIdForLogging(nextAction)} despite error due to error handling setting being set to continue on error`
                    )

                    /**
                     * TODO: Determine if we should track this as a 'succeeded' metric here or
                     * a new metric_name e.g. 'continued_after_error'
                     */
                    this.goToNextAction(result, currentAction, nextAction, 'succeeded')
                }
            }
        } catch (err) {
            logger.error('Error trying to continue to next action on error', { error: err })
        }
    }

    /**
     * Updates the scheduledAt field on the result to indicate that the invocation should be scheduled for the future
     */
    private scheduleInvocation(
        result: CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow>,
        scheduledAt: DateTime
    ): CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow> {
        // If the result has scheduled for the future then we return that triggering a push back to the queue
        result.invocation.queueScheduledAt = scheduledAt
        result.finished = false
        result.logs.push({
            level: 'info',
            timestamp: DateTime.now(),
            message: `Workflow will pause until ${scheduledAt.toUTC().toISO()}`,
        })

        return result
    }

    private logAction(
        result: CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow>,
        action: CustomFlowAction,
        level: LogEntryLevel,
        message: string
    ): void {
        this.log(result, level, `${actionIdForLogging(action)} ${message}`)
    }

    private log(
        result: CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow>,
        level: LogEntryLevel,
        message: string
    ): void {
        result.logs.push({
            level,
            timestamp: DateTime.now(),
            message,
        })
    }

    private trackActionMetric(
        result: CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow>,
        action: CustomFlowAction,
        metricName: 'failed' | 'succeeded' | 'filtered'
    ): void {
        result.metrics.push({
            team_id: result.invocation.customFlow.team_id,
            app_source_id: result.invocation.customFlow.id,
            instance_id: action.id,
            metric_kind: metricName === 'failed' ? 'failure' : metricName === 'succeeded' ? 'success' : 'other',
            metric_name: metricName,
            count: 1,
        })
    }

    private trackActionResult(
        result: CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow>,
        action: CustomFlowAction,
        actionResult: unknown
    ): void {
        // Normalize output_variable to an array for uniform handling
        const outputVars = Array.isArray(action.output_variable)
            ? action.output_variable
            : action.output_variable
              ? [action.output_variable]
              : []

        if (outputVars.length === 0) {
            return
        }

        if (!actionResult) {
            this.log(
                result,
                'warn',
                `An output variable was specified for [Action:${action.id}], but no output was returned.`
            )
            return
        }

        if (!result.invocation.state.variables) {
            result.invocation.state.variables = {}
        }

        const allStoredKeys: string[] = []

        for (const outputVar of outputVars) {
            if (!outputVar.key) {
                continue
            }

            const resolvedResult = outputVar.result_path ? get(actionResult, outputVar.result_path) : actionResult

            // When spread is true, store each property of the result as a separate variable
            if (
                outputVar.spread &&
                typeof resolvedResult === 'object' &&
                resolvedResult !== null &&
                !Array.isArray(resolvedResult)
            ) {
                const prefix = outputVar.key
                for (const [prop, value] of Object.entries(resolvedResult)) {
                    const spreadKey = `${prefix}_${prop}`
                    result.invocation.state.variables[spreadKey] = value
                    allStoredKeys.push(spreadKey)
                }
            } else {
                result.invocation.state.variables[outputVar.key] = resolvedResult
                allStoredKeys.push(outputVar.key)
            }
        }

        // Check that total variables are below 5KB
        const resultSize = Buffer.byteLength(JSON.stringify(result.invocation.state.variables), 'utf8')
        if (resultSize > 5120) {
            const keyNames = allStoredKeys.join(', ')
            this.log(
                result,
                'error',
                `Total variable size after updating '${keyNames}' exceeds 5KB limit. Use result_path to store only the fields you need.`
            )
            // Clean up all variables we just set
            for (const key of allStoredKeys) {
                delete result.invocation.state.variables[key]
            }
            throw new Error(
                `Total variable size after updating '${keyNames}' exceeds 5KB limit. Use result_path to store only the fields you need.`
            )
        }

        const storedSummary = allStoredKeys
            .map((key) => `${key} = ${JSON.stringify(result.invocation.state.variables![key])}`)
            .join(', ')
        this.log(result, 'debug', `Stored action result in variable(s): ${storedSummary}`)
    }

    private logExecutionTriggerInfo(invocation: CyclotronJobInvocationCustomFlow): MinimalLogEntry {
        const hasCurrentAction = Boolean(invocation.state.currentAction)
        const currentAction = hasCurrentAction ? `[Action:${invocation.state.currentAction!.id}]` : 'trigger'

        const hasAssociatedPerson = Boolean(invocation.person)
        const hasAssociatedEvent = Boolean(invocation.state.event)
        const isWebhookTriggered = ['webhook', 'manual', 'schedule'].includes(invocation.customFlow.trigger.type)
        const isBatchWorkflow = invocation.customFlow.trigger.type === 'batch'

        let triggeredForActor = ''
        if (!hasCurrentAction) {
            triggeredForActor = isWebhookTriggered
                ? ` at request of [Actor:${invocation.state.event?.distinct_id || 'unknown'}]`
                : ''
            triggeredForActor += hasAssociatedPerson
                ? ` for [Person:${invocation.person?.id}|${invocation.person?.name}]`
                : ''
        }

        const triggeredByEvent = hasAssociatedEvent
            ? ` on [Event:${invocation.state.event?.uuid}|${invocation.state.event?.event?.replaceAll('|', '')}|${invocation.state.event?.timestamp}]`
            : ''

        return {
            level: 'debug',
            message: `${hasCurrentAction ? 'Resuming' : 'Starting'} ${isBatchWorkflow ? 'batch ' : ''}workflow execution at ${currentAction}${triggeredForActor}${triggeredByEvent}`,
            timestamp: DateTime.now(),
        }
    }
}
