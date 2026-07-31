import { Dialog } from 'lib/elements/Dialog'

import { Billing } from './Billing'

export type BillingPopupProps = {
    title?: string
    description?: string
}

export function openBillingPopupModal({
    title = 'Unlock premium features',
    description,
}: BillingPopupProps = {}): void {
    Dialog.open({
        title: title,
        description: description,
        content: <Billing />,
        width: 800,
        primaryButton: {
            children: 'Maybe later...',
            type: 'secondary',
        },
    })
}
