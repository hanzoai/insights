import { Banner, Button } from '@hanzo/elements'

import { urls } from 'scenes/urls'

interface BillingNoAccessProps {
    title?: string
    reason: string
}

export function BillingNoAccess({ title = 'Billing', reason }: BillingNoAccessProps): JSX.Element {
    return (
        <div className="deprecated-space-y-4">
            <h1>{title}</h1>
            <Banner type="warning">{reason}</Banner>
            <div className="flex">
                <Button type="primary" to={urls.default()}>
                    Go back home
                </Button>
            </div>
        </div>
    )
}
