import { toast } from 'lib/elements/Toast'
import { getCurrentTeamId } from 'lib/utils/getAppContext'

import { subscriptionsPartialUpdate } from 'products/subscriptions/frontend/generated/api'

export async function toggleSubscriptionEnabled(id: number, enabled: boolean): Promise<boolean> {
    try {
        await subscriptionsPartialUpdate(String(getCurrentTeamId()), id, { enabled })
        toast.success(enabled ? 'Subscription enabled' : 'Subscription disabled')
        return true
    } catch (e: any) {
        const detail = typeof e?.detail === 'string' ? e.detail : null
        toast.error(detail ?? 'Could not update subscription')
        return false
    }
}
