import { Button } from '@hanzo/elements'

import { IconOpenInNew } from 'lib/elements/icons'

import { IntegrationType } from '~/types'

export function VercelIntegrationSuffix({ integration }: { integration: IntegrationType }): JSX.Element {
    const accountUrl = integration.config?.account?.url
    const accountName = integration.config?.account?.name

    if (!accountUrl) {
        return <></>
    }

    return (
        <Button
            type="secondary"
            to={accountUrl}
            targetBlank
            sideIcon={<IconOpenInNew />}
            tooltip={accountName ? `Open ${accountName} in Vercel` : 'Open in Vercel'}
        >
            View in Vercel
        </Button>
    )
}
