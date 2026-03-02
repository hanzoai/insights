import { Counter } from 'prom-client'

import { QuotaResource } from '../../common/services/quota-limiting.service'
import { CustomFunctionMonitoringService } from '../services/monitoring/custom-function-monitoring.service'
import { CyclotronJobInvocationCustomFunction } from '../types'

const counterQuotaLimited = new Counter({
    name: 'cdp_function_quota_limited',
    help: 'A function invocation was quota limited',
    labelNames: ['team_id'],
})

export interface QuotaLimitingContext {
    hub: {
        quotaLimiting: {
            isTeamQuotaLimited: (teamId: number, resource: QuotaResource) => Promise<boolean>
        }
    }
    customFunctionMonitoringService: CustomFunctionMonitoringService
}

/**
 * Checks if an invocation should be quota limited and handles the appropriate metrics.
 * Returns true if the invocation should be blocked, false otherwise.
 */
export async function shouldBlockInvocationDueToQuota(
    item: CyclotronJobInvocationCustomFunction,
    context: QuotaLimitingContext
): Promise<boolean> {
    const isQuotaLimited = await context.hub.quotaLimiting.isTeamQuotaLimited(item.teamId, 'cdp_trigger_events')

    if (isQuotaLimited) {
        counterQuotaLimited.labels({ team_id: item.teamId }).inc()

        context.customFunctionMonitoringService.queueAppMetric(
            {
                team_id: item.teamId,
                app_source_id: item.functionId,
                metric_kind: 'failure',
                metric_name: 'quota_limited',
                count: 1,
            },
            'custom_function'
        )
        return true
    }

    return false
}
