import { useActions, useValues } from 'kea'

import { Banner, Button } from '@hanzo/elements'

import { DashboardEventSource } from 'lib/utils/eventUsageLogic'

import { DashboardMode } from '~/types'

import { dashboardLogic } from './dashboardLogic'

export const DashboardOverridesBanner = (): JSX.Element | null => {
    const { dashboardMode, urlFilters, cancellingPreview } = useValues(dashboardLogic)
    const { setDashboardMode } = useActions(dashboardLogic)

    if (dashboardMode === DashboardMode.Edit || Object.keys(urlFilters).length === 0) {
        return null
    }

    return (
        <Banner type="info" className="mt-4 mb-2">
            <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <span>You are viewing this dashboard with filter overrides.</span>

                <div className="flex gap-2">
                    <Button
                        type="primary"
                        onClick={() =>
                            setDashboardMode(DashboardMode.Edit, DashboardEventSource.DashboardHeaderOverridesBanner)
                        }
                    >
                        Edit dashboard
                    </Button>
                    <Button
                        type="secondary"
                        onClick={() => setDashboardMode(null, DashboardEventSource.DashboardHeaderOverridesBanner)}
                        loading={cancellingPreview}
                    >
                        Discard overrides
                    </Button>
                </div>
            </div>
        </Banner>
    )
}
