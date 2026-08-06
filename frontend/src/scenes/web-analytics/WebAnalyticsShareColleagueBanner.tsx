import { useActions, useValues } from 'kea'
import insights from 'insights-js'

import { Banner } from 'lib/elements/Banner'
import { copyToClipboard } from 'lib/utils/copyToClipboard'
import { shareNudgeLogic } from 'scenes/web-analytics/shareNudgeLogic'

export function WebAnalyticsShareColleagueBanner(): JSX.Element | null {
    const { showBanner } = useValues(shareNudgeLogic)
    const { dismissForSession } = useActions(shareNudgeLogic)

    if (!showBanner) {
        return null
    }

    return (
        <Banner
            type="info"
            dismissKey="web-analytics-share-colleague"
            action={{
                children: 'Copy link to share',
                onClick: () => {
                    void copyToClipboard(window.location.href, 'link to share')
                    insights.capture('web analytics share link copied', { source: 'banner' })
                    dismissForSession()
                },
            }}
        >
            Web analytics is better with your team. Send this view to a colleague.
        </Banner>
    )
}
