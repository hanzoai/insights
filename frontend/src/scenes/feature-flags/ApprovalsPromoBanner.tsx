import { useActions, useValues } from 'kea'
import insights from 'insights-js'
import { useEffect } from 'react'

import * as judgePng from '@hanzo/brand/hoggies/png/judge'
import { Banner } from '@hanzo/elements'

import { approvalsGateLogic } from 'lib/approvals/approvalsGateLogic'
import { pngHoggie } from 'lib/brand/hoggies'
import { lemonBannerLogic } from 'lib/elements/Banner/lemonBannerLogic'
import { Button } from 'lib/elements/Button'
import { organizationLogic } from 'scenes/organizationLogic'
import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

import { AvailableFeature } from '~/types'

const MascotJudge = pngHoggie(judgePng)

const DISMISS_KEY = 'feature-flags-approvals-promo'

export function ApprovalsPromoBanner(): JSX.Element | null {
    const { hasAvailableFeature } = useValues(userLogic)
    const { isAdminOrOwner } = useValues(organizationLogic)
    const { activePolicies, activePoliciesLoading } = useValues(approvalsGateLogic)
    const bannerLogic = lemonBannerLogic({ dismissKey: DISMISS_KEY })
    const { isDismissed } = useValues(bannerLogic)
    const { dismiss } = useActions(bannerLogic)

    const hasActivePolicies = activePolicies.length > 0
    const shouldShow =
        isAdminOrOwner &&
        hasAvailableFeature(AvailableFeature.APPROVALS) &&
        !hasActivePolicies &&
        !activePoliciesLoading

    useEffect(() => {
        if (shouldShow && !isDismissed) {
            insights.capture('feature flags approvals promo shown')
        }
    }, [shouldShow, isDismissed])

    if (!shouldShow || isDismissed) {
        return null
    }

    return (
        <Banner type="info" hideIcon className="bg-transparent border-dashed border-2">
            <div className="flex items-center gap-8 w-full justify-center p-4">
                <div className="w-30 shrink-0 hidden md:block">
                    <MascotJudge className="w-full h-full" />
                </div>
                <div className="flex-shrink max-w-140">
                    <h2>Stop YOLO-shipping flag changes</h2>
                    <p>
                        Require a second pair of eyes before feature flags go live. Because "I swear I only changed one
                        condition" is not a rollback strategy.
                    </p>
                    <div className="flex items-center gap-x-4 gap-y-2 mt-6 flex-wrap">
                        <Button
                            type="primary"
                            to={urls.approvals()}
                            onClick={() => insights.capture('feature flags approvals promo cta clicked')}
                        >
                            Set up approvals
                        </Button>
                        <Button
                            type="tertiary"
                            onClick={() => {
                                insights.capture('feature flags approvals promo dismissed')
                                dismiss()
                            }}
                        >
                            Not interested
                        </Button>
                    </div>
                </div>
            </div>
        </Banner>
    )
}
