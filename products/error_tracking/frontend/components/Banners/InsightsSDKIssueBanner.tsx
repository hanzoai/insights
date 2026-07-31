import { Banner } from '@hanzo/elements'

import { ErrorEventType } from 'lib/components/Errors/types'

interface InsightsSDKIssueBannerProps {
    event?: ErrorEventType | null
}

export function InsightsSDKIssueBanner({ event }: InsightsSDKIssueBannerProps): JSX.Element | null {
    if (!event) {
        return null
    }

    const isInsightsSDKIssue = event.properties.$exception_values?.some((v: string) =>
        v.includes('persistence.isDisabled is not a function')
    )

    if (!isInsightsSDKIssue) {
        return null
    }

    return (
        <Banner
            type="error"
            action={{ to: 'https://statinsights.hanzo.ai/incidents/l70cgmt7475m', children: 'Read more' }}
            className="mb-4"
        >
            This issue was captured because of a bug in the Insights SDK. We've fixed the issue, and you won't be charged
            for any of these exception events. We recommend setting this issue's status to "Suppressed".
        </Banner>
    )
}
