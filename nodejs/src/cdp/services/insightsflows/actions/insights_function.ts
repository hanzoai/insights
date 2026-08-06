import { DateTime } from 'luxon'

import { InsightsFlowAction } from '~/cdp/schema/hogflow'
import { instrumentFn } from '~/common/tracing/tracing-utils'

import {
    CyclotronJobInvocationInsightsFlow,
    CyclotronJobInvocationInsightsFunction,
    CyclotronJobInvocationResult,
    MinimalLogEntry,
} from '../../../types'
import { HogExecutorExecuteAsyncOptions } from '../../script-executor.service'
import { EmailValidationService } from '../../messaging/email-validation.service'
import { RecipientPreferencesService } from '../../messaging/recipient-preferences.service'
import { trackInsightsFlowBillableInvocation } from '../billing-utils'
import { InsightsFlowFunctionsService } from '../hogflow-functions.service'
import { actionIdForLogging, findContinueAction } from '../hogflow-utils'
import { observeMissingVariableReferences } from '../hogflow-variable-usage'
import { ActionHandler, ActionHandlerOptions, ActionHandlerResult } from './action.interface'

type FunctionActionType = 'function' | 'function_email' | 'function_sms'

type Action = Extract<InsightsFlowAction, { type: FunctionActionType }>

export class InsightsFunctionHandler implements ActionHandler {
    constructor(
        private hogFlowFunctionsService: InsightsFlowFunctionsService,
        private recipientPreferencesService: RecipientPreferencesService,
        private emailValidationService: EmailValidationService,
        private hogFlowActionBillingType: 'fetch' | 'email' | 'push'
    ) {}

    async execute({
        invocation,
        action,
        result,
        hogExecutorOptions,
    }: ActionHandlerOptions<Action>): Promise<ActionHandlerResult> {
        // Inputs are rendered once, on fresh entry into the action (continuations reuse the
        // rendered state in insightsFunctionState) - so this also fires at most once per step per run
        if (!invocation.state.currentAction?.insightsFunctionState) {
            observeMissingVariableReferences(invocation, action, result)
        }

        const functionResult = await this.executeInsightsFunction(invocation, action, hogExecutorOptions)

        // Add all logs
        functionResult.logs.forEach((log: MinimalLogEntry) => {
            result.logs.push({
                level: log.level,
                timestamp: log.timestamp,
                message: `${actionIdForLogging(action)} ${log.message}`,
            })
        })

        // Collect captured Insights events and metrics from the function execution
        result.capturedInsightsEvents = [...result.capturedInsightsEvents, ...functionResult.capturedInsightsEvents]
        // Collect warehouse webhook payloads
        result.warehouseWebhookPayloads = [
            ...result.warehouseWebhookPayloads,
            ...functionResult.warehouseWebhookPayloads,
        ]
        result.metrics = [...result.metrics, ...functionResult.metrics]
        result.emailAssets = [...result.emailAssets, ...functionResult.emailAssets]

        if (!functionResult.finished) {
            // Set the state of the function result on the substate of the flow for the next execution
            result.invocation.state.currentAction!.insightsFunctionState = functionResult.invocation.state
            // Preserve queue routing and parameters from the function result
            result.invocation.queue = functionResult.invocation.queue
            result.invocation.queueParameters = functionResult.invocation.queueParameters
            result.invocation.queueMetadata = functionResult.invocation.queueMetadata
            // Routing-only reschedule signature: the queue changed AND no explicit
            // `queueScheduledAt` was set. That's the shape produced by `routeEmailToQueue`
            // and `routeToQueue` in script-executor.service.ts when moving a job between the
            // hogflow and email queues — the next dequeue continues the same action on the
            // new queue. Tag the action state so the executor can suppress the redundant
            // "Resuming..." / "Workflow will pause until..." pair on the next dequeue.
            //
            // The queue-changed check is what keeps async pauses (fetches, SES throttle
            // retries) out of this branch: both keep `queueScheduledAt` set OR leave the
            // queue unchanged, so they don't satisfy both halves of the condition.
            const queueChanged = functionResult.invocation.queue !== invocation.queue
            if (queueChanged && !functionResult.invocation.queueScheduledAt) {
                result.invocation.state.currentAction!.routingOnlyReschedule = true
            }
            return {
                scheduledAt: functionResult.invocation.queueScheduledAt ?? DateTime.now(),
            }
        }

        // Add billable_invocation metric only if the function actually executed (not skipped)
        if (!functionResult.skipped) {
            trackInsightsFlowBillableInvocation(result, {
                invocation: functionResult.invocation,
                billingMetricType: this.hogFlowActionBillingType,
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
        hogExecutorOptions?: HogExecutorExecuteAsyncOptions
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction> & { skipped?: boolean }> {
        const insightsFunction = await instrumentFn(
            { key: 'hogFlow.action.insightsFunction.buildInsightsFunction', sendException: false },
            () => this.hogFlowFunctionsService.buildInsightsFunction(invocation.hogFlow, action.config)
        )
        const insightsFunctionInvocation = await instrumentFn(
            { key: 'hogFlow.action.insightsFunction.buildInvocation', sendException: false },
            () =>
                this.hogFlowFunctionsService.buildInsightsFunctionInvocation(invocation, insightsFunction, {
                    event: invocation.state.event,
                    person: invocation.person,
                    groups: invocation.groups,
                    variables: invocation.state.variables,
                })
        )

        const skipReason = await instrumentFn(
            { key: 'hogFlow.action.insightsFunction.recipientPreferences', sendException: false },
            () => this.recipientPreferencesService.shouldSkipAction(insightsFunctionInvocation, action)
        )
        if (skipReason) {
            // Suppression and opt-out both short-circuit the send, but a customer reading the run
            // log needs to know which one — the operator response is different (fix the recipient
            // list vs. respect the unsubscribe). `email_suppressed` mirrors the metric name the
            // send-time choke point in email.service.ts emits, so both entry points aggregate.
            const message =
                skipReason === 'suppressed'
                    ? `Skipping send: recipient is on the suppression list.`
                    : `Recipient has opted out, skipping message delivery.`
            const metrics =
                skipReason === 'suppressed'
                    ? [
                          {
                              team_id: insightsFunctionInvocation.teamId,
                              app_source_id: insightsFunctionInvocation.functionId,
                              instance_id: action.id,
                              metric_kind: 'email' as const,
                              metric_name: 'email_suppressed' as const,
                              count: 1,
                          },
                      ]
                    : []
            return {
                finished: true,
                skipped: true,
                invocation: insightsFunctionInvocation,
                logs: [{ level: 'info', timestamp: DateTime.now(), message }],
                metrics,
                capturedInsightsEvents: [],
                warehouseWebhookPayloads: [],
                emailAssets: [],
            }
        }

        // Predicted hard bounce (bad syntax / dead domain): skip before the send reaches
        // SES so it never counts against our bounce rate. Runs after the opt-out check so
        // an opted-out recipient never triggers a DNS lookup.
        const emailSkipReason = await instrumentFn(
            { key: 'hogFlow.action.insightsFunction.emailValidation', sendException: false },
            () => this.emailValidationService.getSkipReason(insightsFunctionInvocation, action)
        )
        if (emailSkipReason) {
            return {
                finished: true,
                skipped: true,
                invocation: insightsFunctionInvocation,
                logs: [{ level: 'info', timestamp: DateTime.now(), message: emailSkipReason }],
                metrics: [
                    {
                        team_id: insightsFunctionInvocation.teamId,
                        app_source_id: insightsFunctionInvocation.functionId,
                        instance_id: action.id,
                        metric_kind: 'email',
                        metric_name: 'email_bounce_prevented',
                        count: 1,
                    },
                ],
                capturedInsightsEvents: [],
                warehouseWebhookPayloads: [],
                emailAssets: [],
            }
        }

        return instrumentFn({ key: 'hogFlow.action.insightsFunction.executeWithAsyncFunctions', sendException: false }, () =>
            this.hogFlowFunctionsService.executeWithAsyncFunctions(insightsFunctionInvocation, hogExecutorOptions)
        )
    }
}
