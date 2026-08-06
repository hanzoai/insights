import { useValues } from 'kea'

import { Banner, Link } from '@hanzo/elements'
import { InsightsCaptureOnViewed } from '@hanzo/react'

import { billingLogic } from 'scenes/billing/billingLogic'
import { urls } from 'scenes/urls'

import { ProductKey } from '~/queries/schema/schema-general'

export function ProductAnalyticsOverLimitBanner(): JSX.Element | null {
    const { isProductOverUsageLimit } = useValues(billingLogic)

    if (!isProductOverUsageLimit(ProductKey.PRODUCT_ANALYTICS)) {
        return null
    }

    return (
        <InsightsCaptureOnViewed name="replay-filters-pa-over-limit-banner-shown">
            <Banner
                type="warning"
                className="mx-2 mt-2"
                action={{
                    children: 'Increase billing limit',
                    to: urls.organizationBilling([ProductKey.PRODUCT_ANALYTICS]),
                    'data-attr': 'replay-filters-pa-over-limit-banner-cta',
                }}
            >
                Session recordings are filtered using your events. While you're over the Product analytics limit, new
                events aren't processed — so recent recordings may not show up when you filter.{' '}
                <Link
                    to="https://hanzo.ai/docs/session-replay/troubleshooting#unable-to-filter-by-user-or-page-properties"
                    target="_blank"
                >
                    Learn more
                </Link>
                .
            </Banner>
        </InsightsCaptureOnViewed>
    )
}
