// @ts-nocheck
import { DateTime } from 'luxon'

import { InsightsFlowAction } from '../../../../schema/insightsflow'
import {
    CyclotronJobInvocationInsightsFlow,
    CyclotronJobInvocationInsightsFunction,
    CyclotronJobInvocationResult,
    MinimalLogEntry,
} from '../../../types'
import { ScriptExecutorExecuteAsyncOptions } from '../../script-executor.service'
import { RecipientPreferencesService } from '../../messaging/recipient-preferences.service'
import { trackInsightsFlowBillableInvocation } from '../billing-utils'
import { InsightsFlowFunctionsService } from '../insightsflow-functions.service'
import { actionIdForLogging, findContinueAction } from '../insightsflow-utils'
import { ActionHandler, ActionHandlerOptions, ActionHandlerResult } from './action.interface'

type FunctionActionType = 'function' | 'function_email' | 'function_sms'

type Action = Extract<InsightsFlowAction, { type: FunctionActionType }>

export class InsightsFunctionHandler implements ActionHandler {
    constructor(
        private insightsFlowFunctionsService: InsightsFlowFunctionsService,
        private recipientPreferencesService: RecipientPreferencesService,
        private insightsFlowActionBillingType: 'fetch' | 'email'
    ) {}

    async execute({
        invocation,
        action,
        result,
        scriptExecutorOptions,
    }: ActionHandlerOptions<Action>): Promise<ActionHandlerResult> {
        const functionResult = await this.executeInsightsFunction(invocation, action, scriptExecutorOptions)

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
            result.invocation.state.currentAction!.insightsFunctionState = functionResult.invocation.state
            // Also the queueParameters are required
            result.invocation.queueParameters = functionResult.invocation.queueParameters
            return {
                scheduledAt: functionResult.invocation.queueScheduledAt ?? DateTime.now(),
            }
        }

        // Add billable_invocation metric only if the function actually executed (not skipped)
        if (!functionResult.skipped) {
            trackInsightsFlowBillableInvocation(result, {
                invocation: functionResult.invocation,
                billingMetricType: this.insightsFlowActionBillingType,
            })
        }

        return {
            nextAction: findContinueAction(invocation),
            result: functionResult.execResult,
            error: functionResult.error,
        }
    }

    private async executeInsightsFunction(
        invocation: CyclotronJobInvocationInsightsFlow,
        action: Action,
        scriptExecutorOptions?: ScriptExecutorExecuteAsyncOptions
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction> & { skipped?: boolean }> {
        const insightsFunction = await this.insightsFlowFunctionsService.buildInsightsFunction(invocation.insightsFlow, action.config)
        const insightsFunctionInvocation = await this.insightsFlowFunctionsService.buildInsightsFunctionInvocation(
            invocation,
            insightsFunction,
            {
                event: invocation.state.event,
                person: invocation.person,
                variables: invocation.state.variables,
            }
        )

        if (await this.recipientPreferencesService.shouldSkipAction(insightsFunctionInvocation, action)) {
            return {
                finished: true,
                skipped: true,
                invocation: insightsFunctionInvocation,
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

        return this.insightsFlowFunctionsService.executeWithAsyncFunctions(insightsFunctionInvocation, scriptExecutorOptions)
    }
}
