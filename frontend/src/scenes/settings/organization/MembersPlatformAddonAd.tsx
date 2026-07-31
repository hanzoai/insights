import clsx from 'clsx'
import { useActions, useValues } from 'kea'
import { useEffect } from 'react'

import insights from '@hanzo/insights'
import { Banner } from '@hanzo/elements'

import { DetectiveMascot, JudgeMascot, SpaceMascot, ThreeBearsMascots } from 'lib/components/mascots'
import { bannerLogic } from 'lib/elements/Banner/bannerLogic'
import { Button } from 'lib/elements/Button'
import { membersPlatformAddonAdLogic } from 'scenes/settings/organization/membersPlatformAddonAdLogic'
import { urls } from 'scenes/urls'

import { ProductKey } from '~/queries/schema/schema-general'

import { MembersPagePlatformAddonAdKey } from './membersPlatformAddonAdLogic'

const platformAddonAdIllustrations: Record<MembersPagePlatformAddonAdKey, typeof DetectiveMascot> = {
    'test-audit-trail': DetectiveMascot,
    'test-paper-trail': JudgeMascot,
    'test-space-scale': SpaceMascot,
    'test-big-village': ThreeBearsMascots,
}

const dismissKey = 'organization-members-platform-addon-ad-3'

export function MembersPlatformAddonAd(): JSX.Element | null {
    const bannerLogic = bannerLogic({ dismissKey })
    const { shouldShowPlatformAddonAd, platformAddonAdConfig } = useValues(membersPlatformAddonAdLogic)
    const { isDismissed } = useValues(bannerLogic)
    const { dismiss } = useActions(bannerLogic)

    useEffect(() => {
        if (shouldShowPlatformAddonAd && !isDismissed) {
            insights.capture('members page platform addon ad shown', {
                ad_key: platformAddonAdConfig.key,
            })
        }
    }, [shouldShowPlatformAddonAd, isDismissed, platformAddonAdConfig.key])

    if (!shouldShowPlatformAddonAd || isDismissed) {
        return null
    }

    const PlatformAddonAdIllustration = platformAddonAdIllustrations[platformAddonAdConfig.key]

    const handleCtaClick = (): void => {
        insights.capture('members page platform addon ad cta clicked', {
            ad_key: platformAddonAdConfig.key,
        })
    }

    const handleDismiss = (): void => {
        insights.capture('members page platform addon ad dismissed', {
            ad_key: platformAddonAdConfig.key,
        })
        dismiss()
    }

    return (
        <Banner type="info" hideIcon>
            <div className="flex flex-row gap-8 px-8 items-center justify-evenly">
                <div>
                    <h3 className="mb-1 text-lg font-semibold">{platformAddonAdConfig.title}</h3>
                    <p className="mb-3">{platformAddonAdConfig.description}</p>
                    <div className="flex flex-row gap-2">
                        <Button
                            type="primary"
                            className="w-fit"
                            to={urls.organizationBilling([ProductKey.PLATFORM_AND_SUPPORT])}
                            onClick={handleCtaClick}
                        >
                            {platformAddonAdConfig.cta}
                        </Button>
                        <Button type="tertiary" onClick={handleDismiss}>
                            I'm not interested
                        </Button>
                    </div>
                </div>
                <PlatformAddonAdIllustration
                    className={clsx('h-52 w-fit', platformAddonAdConfig.key === 'test-paper-trail' && 'p-4')}
                    alt={platformAddonAdConfig.alt}
                />
            </div>
        </Banner>
    )
}
