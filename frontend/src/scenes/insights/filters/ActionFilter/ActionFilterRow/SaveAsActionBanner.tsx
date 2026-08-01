import { Banner } from '@hanzo/elements'
import { InsightsCaptureOnViewed } from '@hanzo/react'

import { saveActionFromFilter } from '~/models/saveAsActionDialog'

import { LocalFilter } from '../entityFilterLogic'
import { isAutocaptureFilterWithElements } from './saveAsActionUtils'

interface SaveAsActionBannerProps {
    filter: LocalFilter
}

export function SaveAsActionBanner({ filter }: SaveAsActionBannerProps): JSX.Element | null {
    if (!isAutocaptureFilterWithElements(filter)) {
        return null
    }

    return (
        <InsightsCaptureOnViewed name="autocapture-series-save-as-action-banner-shown">
            <Banner
                type="info"
                className="mt-2"
                dismissKey="autocapture-save-as-action-nudge"
                action={{
                    children: 'Save as action',
                    onClick: () => saveActionFromFilter(filter),
                    'data-attr': 'autocapture-save-as-action',
                }}
            >
                Save this autocapture filter as a reusable action.
            </Banner>
        </InsightsCaptureOnViewed>
    )
}
