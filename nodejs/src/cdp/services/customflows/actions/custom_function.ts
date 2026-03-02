import { DateTime } from 'luxon'

import { CustomFlowAction } from '../../../../schema/customflow'
import {
    CyclotronJobInvocationCustomFlow,
    CyclotronJobInvocationCustomFunction,
    CyclotronJobInvocationResult,
    MinimalLogEntry,
} from '../../../types'
import { ScriptExecutorExecuteAsyncOptions } from '../../script-executor.service'
import { RecipientPreferencesService } from '../../messaging/recipient-preferences.service'
import { trackCustomFlowBillableInvocation } from '../billing-utils'
import { CustomFlowFunctionsService } from '../customflow-functions.service'
import { actionIdForLogging, findContinueAction } from '../customflow-utils'
import { ActionHandler, ActionHandlerOptions, ActionHandlerResult } from './action.interface'

type FunctionActionType = 'function' | 'function_email' | 'function_sms'

type Action = Extract<CustomFlowAction, { type: FunctionActionType }>

export class CustomFunctionHandler implements ActionHandler {
    constructor(
        private customFlowFunctionsService: CustomFlowFunctionsService,
        private recipientPreferencesService: RecipientPreferencesService,
        private customFlowActionBillingType: 'fetch' | 'email'
    ) {}

    async execute({
        invocation,
        action,
        result,
        scriptExecutorOptions,
    }: ActionHandlerOptions<Action>): Promise<ActionHandlerResult> {
        const functionResult = await this.executeCustomFunction(invocation, action, scriptExecutorOptions)

        // Add all logs
        functionResult.logs.forEach((log: MinimalLogEntry) => {
            result.logs.push({
                level: log.level,
                timestamp: log.timestamp,
                message: `${actionIdForLogging(action)} ${log.message}`,
            })
        })

        // Collect captured Insights events
        result.capturedInsightsEvents = [...result.capturedInsightsEvents, ...functionResult.capturedInsightsEvents]

        if (!functionResult.finished) {
            // Set the state of the function result on the substate of the flow for the next execution
            result.invocation.state.currentAction!.customFunctionState = functionResult.invocation.state
            // Also the queueParameters are required
            result.invocation.queueParameters = functionResult.invocation.queueParameters
            return {
                scheduledAt: functionResult.invocation.queueScheduledAt ?? DateTime.now(),
            }
        }

        // Add billable_invocation metric only if the function actually executed (not skipped)
        if (!functionResult.skipped) {
            trackCustomFlowBillableInvocation(result, {
                invocation: functionResult.invocation,
                billingMetricType: this.customFlowActionBillingType,
            })
        }

        return {
            nextAction: findContinueAction(invocation),
            result: functionResult.execResult,
            error: functionResult.error,
        }
    }

    private async executeCustomFunction(
        invocation: CyclotronJobInvocationCustomFlow,
        action: Action,
        scriptExecutorOptions?: ScriptExecutorExecuteAsyncOptions
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationCustomFunction> & { skipped?: boolean }> {
        const customFunction = await this.customFlowFunctionsService.buildCustomFunction(invocation.customFlow, action.config)
        const customFunctionInvocation = await this.customFlowFunctionsService.buildCustomFunctionInvocation(
            invocation,
            customFunction,
            {
                event: invocation.state.event,
                person: invocation.person,
                variables: invocation.state.variables,
            }
        )

        if (await this.recipientPreferencesService.shouldSkipAction(customFunctionInvocation, action)) {
            return {
                finished: true,
                skipped: true,
                invocation: customFunctionInvocation,
                logs: [
                    {
                        level: 'info',
                        timestamp: DateTime.now(),
                        message: `Recipient has opted out, skipping message delivery.`,
                    },
                ],
                metrics: [],
                capturedInsightsEvents: [],
            }
        }

        return this.customFlowFunctionsService.executeWithAsyncFunctions(customFunctionInvocation, scriptExecutorOptions)
    }
}
