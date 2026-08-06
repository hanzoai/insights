import { Box } from '@stripe/ui-extension-sdk/ui'

import type { InsightsClient } from '../insights/client'
import PromoBanner, { PromoBannerPrimaryLink, PromoBannerText, PromoBannerTitle } from './components/PromoBanner'

interface Props {
    client: InsightsClient | null
    projectId: string | null
}

const SupportTab = ({ client, projectId }: Props): JSX.Element => {
    const insightsBase = client ? `${client.baseUrl}/project/${projectId}` : null

    return (
        <Box css={{ width: 'fill', padding: 'large' }}>
            <PromoBanner hero>
                <PromoBannerTitle>Support is coming to Insights</PromoBannerTitle>
                <PromoBannerText>
                    Soon you'll be able to correlate your Insights users with Stripe customers and respond to support
                    tickets directly from Insights — with full context from session replays, feature flags, and product
                    analytics already attached.
                </PromoBannerText>
                {insightsBase && (
                    <PromoBannerPrimaryLink href={`${insightsBase}/support`}>
                        Learn more about Insights Support
                    </PromoBannerPrimaryLink>
                )}
            </PromoBanner>
        </Box>
    )
}

export default SupportTab
