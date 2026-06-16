import { useValues } from 'kea'

import { LemonButton } from '@hanzo/lemon-ui'

import { billingLogic } from './billingLogic'

export const BillingPortalButton = (): JSX.Element | null => {
    const { billing } = useValues(billingLogic)

    if (!billing?.customer_id) {
        return null
    }

    // TODO(stripe-rip): backend should drop `stripe_portal_url` once
    // every environment is migrated to Hanzo Commerce; the field is read
    // here only as a transition fallback.
    const billingUrl = billing.external_billing_provider_invoices_url || billing.stripe_portal_url

    if (!billingUrl) {
        return null
    }

    return (
        <div className="w-fit mt-4">
            <LemonButton
                type="primary"
                htmlType="submit"
                to={billingUrl}
                disableClientSideRouting
                targetBlank
                center
                data-attr="manage-billing"
            >
                {billing.has_active_subscription ? 'Manage card details and invoices' : 'View past invoices'}
            </LemonButton>
        </div>
    )
}
