// @ts-nocheck
import { Counter } from 'prom-client'

import { QuotaLimiting } from '../../../common/services/quota-limiting.service'
import { InsightsFlow } from '../../../schema/insightsflow'
import { CyclotronJobInvocationInsightsFlow } from '../../types'
import { InsightsFunctionMonitoringService } from '../monitoring/insights-function-monitoring.service'

export const counterInsightsFlowQuotaLimited = new Counter({
    name: 'cdp_insights_flow_quota_limited',
    help: 'A custom flow invocation was quota limited',
    labelNames: ['team_id'],
})

export interface InsightsFlowQuotaLimitResult {
    isLimited: boolean
}

/**
 * Checks if a customflow is quota limited based on its billable action types.
 * Uses the pre-computed billable_action_types field for efficient quota checking.
 */
export async function checkInsightsFlowQuotaLimits(
    insightsFlow: InsightsFlow,
    teamId: number,
    quotaLimiting: QuotaLimiting
): Promise<InsightsFlowQuotaLimitResult> {
    // Ensure billable_action_types is an array (handle null, undefined, or non-array values)
    const billableActionTypes = Array.isArray(insightsFlow.billable_action_types) ? insightsFlow.billable_action_types : []

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

export interface InsightsFlowQuotaLimitingContext {
    hub: {
        quotaLimiting: QuotaLimiting
    }
    insightsFunctionMonitoringService: InsightsFunctionMonitoringService
}

/**
 * Checks if a custom flow invocation should be quota limited and handles the appropriate metrics.
 * Returns true if the invocation should be blocked, false otherwise.
 */
export async function shouldBlockInsightsFlowDueToQuota(
    item: CyclotronJobInvocationInsightsFlow,
    context: InsightsFlowQuotaLimitingContext
): Promise<boolean> {
    const quotaLimitResult = await checkInsightsFlowQuotaLimits(item.insightsFlow, item.teamId, context.hub.quotaLimiting)

    if (quotaLimitResult.isLimited) {
        counterInsightsFlowQuotaLimited.labels({ team_id: item.teamId }).inc()

        context.insightsFunctionMonitoringService.queueAppMetric(
            {
                team_id: item.teamId,
                app_source_id: item.functionId,
                metric_kind: 'failure',
                metric_name: 'quota_limited',
                count: 1,
            },
            'insights_flow'
        )
        return true
    }

    return false
}
