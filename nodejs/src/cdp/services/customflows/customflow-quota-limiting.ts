import { Counter } from 'prom-client'

import { QuotaLimiting } from '../../../common/services/quota-limiting.service'
import { CustomFlow } from '../../../schema/customflow'
import { CyclotronJobInvocationCustomFlow } from '../../types'
import { CustomFunctionMonitoringService } from '../monitoring/custom-function-monitoring.service'

export const counterCustomFlowQuotaLimited = new Counter({
    name: 'cdp_custom_flow_quota_limited',
    help: 'A custom flow invocation was quota limited',
    labelNames: ['team_id'],
})

export interface CustomFlowQuotaLimitResult {
    isLimited: boolean
}

/**
 * Checks if a customflow is quota limited based on its billable action types.
 * Uses the pre-computed billable_action_types field for efficient quota checking.
 */
export async function checkCustomFlowQuotaLimits(
    customFlow: CustomFlow,
    teamId: number,
    quotaLimiting: QuotaLimiting
): Promise<CustomFlowQuotaLimitResult> {
    // Ensure billable_action_types is an array (handle null, undefined, or non-array values)
    const billableActionTypes = Array.isArray(customFlow.billable_action_types) ? customFlow.billable_action_types : []

    // If no billable action types, no need to check quotas
    if (billableActionTypes.length === 0) {
        return { isLimited: false }
    }

    // Check which quotas the team is limited on
    const [isEmailQuotaLimited, isDestinationQuotaLimited] = await Promise.all([
        quotaLimiting.isTeamQuotaLimited(teamId, 'workflow_emails'),
        quotaLimiting.isTeamQuotaLimited(teamId, 'workflow_destinations_dispatched'),
    ])

    // Check if any billable action type is quota limited
    if (isEmailQuotaLimited && billableActionTypes.includes('function_email')) {
        return { isLimited: true }
    }

    if (isDestinationQuotaLimited && billableActionTypes.includes('function')) {
        return { isLimited: true }
    }

    return { isLimited: false }
}

export interface CustomFlowQuotaLimitingContext {
    hub: {
        quotaLimiting: QuotaLimiting
    }
    customFunctionMonitoringService: CustomFunctionMonitoringService
}

/**
 * Checks if a custom flow invocation should be quota limited and handles the appropriate metrics.
 * Returns true if the invocation should be blocked, false otherwise.
 */
export async function shouldBlockCustomFlowDueToQuota(
    item: CyclotronJobInvocationCustomFlow,
    context: CustomFlowQuotaLimitingContext
): Promise<boolean> {
    const quotaLimitResult = await checkCustomFlowQuotaLimits(item.customFlow, item.teamId, context.hub.quotaLimiting)

    if (quotaLimitResult.isLimited) {
        counterCustomFlowQuotaLimited.labels({ team_id: item.teamId }).inc()

        context.customFunctionMonitoringService.queueAppMetric(
            {
                team_id: item.teamId,
                app_source_id: item.functionId,
                metric_kind: 'failure',
                metric_name: 'quota_limited',
                count: 1,
            },
            'custom_flow'
        )
        return true
    }

    return false
}
