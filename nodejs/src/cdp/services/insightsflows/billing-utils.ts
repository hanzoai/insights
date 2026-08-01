import { CyclotronJobInvocationInsightsFunction, CyclotronJobInvocationResult } from '~/cdp/types'

type InsightsFlowBillingMetricData = {
    invocation: CyclotronJobInvocationInsightsFunction
    billingMetricType: 'fetch' | 'email' | 'sms' | 'push'
}

/**
 * In workflows, we bill per-function-invocation so that pricing is equivalent to Script Functions.
 *
 * For certain native functions like email sending, we instead bill per email sent as these
 * have a slight upcharge associated with them.
 */
export const trackInsightsFlowBillableInvocation = (
    result: CyclotronJobInvocationResult,
    data: InsightsFlowBillingMetricData
) => {
    result.metrics.push({
        team_id: data.invocation.teamId,
        app_source_id: data.invocation.functionId,
        instance_id: data.invocation.state.actionId || data.invocation.id,
        metric_kind: data.billingMetricType,
        metric_name: 'billable_invocation',
        count: 1,
    })
}
