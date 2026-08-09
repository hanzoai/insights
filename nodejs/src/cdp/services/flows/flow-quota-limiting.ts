import { Counter } from 'prom-client'

import { Flow } from '~/cdp/schema/flow'

import { QuotaLimiting } from '../../../common/services/quota-limiting.service'
import { CyclotronJobInvocationFlow } from '../../types'
import { InsightsFunctionMonitoringService } from '../monitoring/script-function-monitoring.service'

export const counterFlowQuotaLimited = new Counter({
    name: 'cdp_hog_flow_quota_limited',
    help: 'A script flow invocation was quota limited',
    labelNames: ['team_id'],
})

export interface FlowQuotaLimitResult {
    isLimited: boolean
}

/**
 * Checks if a hogflow is quota limited based on its billable action types.
 * Uses the pre-computed billable_action_types field for efficient quota checking.
 */
export async function checkFlowQuotaLimits(
    flow: Flow,
    teamId: number,
    quotaLimiting: QuotaLimiting
): Promise<FlowQuotaLimitResult> {
    // Ensure billable_action_types is an array (handle null, undefined, or non-array values)
    const billableActionTypes = Array.isArray(flow.billable_action_types) ? flow.billable_action_types : []

    // If no billable action types, no need to check quotas
    if (billableActionTypes.length === 0) {
        return { isLimited: false }
    }

    // Check which quotas the team is limited on
    const [isEmailQuotaLimited, isPushQuotaLimited, isDestinationQuotaLimited] = await Promise.all([
        quotaLimiting.isTeamQuotaLimited(teamId, 'workflow_emails'),
        quotaLimiting.isTeamQuotaLimited(teamId, 'workflow_push'),
        quotaLimiting.isTeamQuotaLimited(teamId, 'workflow_destinations_dispatched'),
    ])

    // Check if any billable action type is quota limited
    if (isEmailQuotaLimited && billableActionTypes.includes('function_email')) {
        return { isLimited: true }
    }

    if (isPushQuotaLimited && billableActionTypes.includes('function_push')) {
        return { isLimited: true }
    }

    if (isDestinationQuotaLimited && billableActionTypes.includes('function')) {
        return { isLimited: true }
    }

    return { isLimited: false }
}

export interface FlowQuotaLimitingContext {
    quotaLimiting: QuotaLimiting
    insightsFunctionMonitoringService: InsightsFunctionMonitoringService
}

/**
 * Checks if a script flow invocation should be quota limited and handles the appropriate metrics.
 * Returns true if the invocation should be blocked, false otherwise.
 */
export async function shouldBlockFlowDueToQuota(
    item: CyclotronJobInvocationFlow,
    context: FlowQuotaLimitingContext
): Promise<boolean> {
    const quotaLimitResult = await checkFlowQuotaLimits(item.flow, item.teamId, context.quotaLimiting)

    if (quotaLimitResult.isLimited) {
        counterFlowQuotaLimited.labels({ team_id: item.teamId }).inc()

        context.insightsFunctionMonitoringService.queueAppMetric(
            {
                team_id: item.teamId,
                app_source_id: item.functionId,
                metric_kind: 'failure',
                metric_name: 'quota_limited',
                count: 1,
                app_source_version: { id: item.flow.id, version: item.flow.version },
            },
            'hog_flow'
        )
        return true
    }

    return false
}
