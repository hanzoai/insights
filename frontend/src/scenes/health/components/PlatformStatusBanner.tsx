import { useValues } from 'kea'

import * as drivingHogzillaPng from '@hanzo/brand/hoggies/png/driving-hogzilla'
import { Banner } from '@hanzo/elements'
import type { BannerProps } from '@hanzo/elements'

import { pngHoggie } from 'lib/brand/hoggies'
import { HeartHog, WarningHog } from 'lib/components/mascots'
import { insightsStatusLogic } from 'lib/components/HelpMenu/insightsStatusLogic'
import type { InsightsStatusBadgeStatus, InsightsStatusType } from 'lib/components/HelpMenu/insightsStatusLogic'

const MascotDrivingHogzilla = pngHoggie(drivingHogzillaPng)

const STATUS_CONFIG: Record<
    InsightsStatusBadgeStatus,
    {
        bannerType: BannerProps['type']
        Script: React.ComponentType<{ className?: string }>
    }
> = {
    success: { bannerType: 'success', Script: HeartHog },
    warning: { bannerType: 'warning', Script: WarningHog },
    danger: { bannerType: 'error', Script: MascotDrivingHogzilla },
}

const STATUS_LABELS: Record<InsightsStatusType, string> = {
    operational: 'Operational',
    degraded_performance: 'Degraded performance',
    partial_outage: 'Partial outage',
    major_outage: 'Major outage',
}

export const PlatformStatusBanner = (): JSX.Element => {
    const { insightsStatusTooltip, insightsStatusBadgeStatus, insightsStatus, statusPageUrl } =
        useValues(insightsStatusLogic)
    const { bannerType, Script } = STATUS_CONFIG[insightsStatusBadgeStatus]
    const statusLabel = STATUS_LABELS[insightsStatus]
    const statusMessage = insightsStatusTooltip ?? 'Checking for active incidents...'

    return (
        <Banner
            type={bannerType}
            icon={<Script className="size-10 shrink-0" />}
            hideIcon={false}
            action={{
                children: 'View status page',
                to: statusPageUrl,
                targetBlank: true,
            }}
        >
            <div>
                <div className="font-semibold">Platform status: {statusLabel}</div>
                <div className="text-sm mt-0.5">{statusMessage}</div>
            </div>
        </Banner>
    )
}
