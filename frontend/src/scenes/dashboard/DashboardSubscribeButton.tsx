import './DashboardSubscribeButton.scss'

import { useActions, useValues } from 'kea'
import { router } from 'kea-router'
import insights from 'insights-js'

import { IconBell } from '@hanzo/icons'

import { IconWithCount } from 'lib/elements/icons/icons'
import { Button } from 'lib/elements/Button'
import { userLogic } from 'scenes/userLogic'

import { AvailableFeature } from '~/types'

import { subscriptionsLogic } from 'products/subscriptions/frontend/components/Subscriptions/subscriptionsLogic'
import { urlForSubscriptions } from 'products/subscriptions/frontend/components/Subscriptions/utils'

import { dashboardLogic } from './dashboardLogic'

function SubscribeCountIcon({ dashboardId }: { dashboardId: number }): JSX.Element {
    const { subscriptions } = useValues(subscriptionsLogic({ dashboardId }))

    return (
        <IconWithCount count={subscriptions?.length} showZero={false}>
            <IconBell className="DashboardSubscribeBell" fontSize="16" />
        </IconWithCount>
    )
}

function SubscribeIcon({ dashboardId }: { dashboardId: number }): JSX.Element {
    const { hasAvailableFeature } = useValues(userLogic)

    if (!hasAvailableFeature(AvailableFeature.SUBSCRIPTIONS) || !subscriptionsLogic.isMounted({ dashboardId })) {
        return <IconBell className="DashboardSubscribeBell" fontSize="16" />
    }

    return <SubscribeCountIcon dashboardId={dashboardId} />
}

export function DashboardSubscribeButton(): JSX.Element | null {
    const { dashboard, canEditDashboard } = useValues(dashboardLogic)
    const { push } = useActions(router)

    if (!dashboard || !canEditDashboard) {
        return null
    }

    const dashboardId = dashboard.id

    return (
        <Button
            type="tertiary"
            size="small"
            icon={<SubscribeIcon dashboardId={dashboardId} />}
            data-attr="dashboard-subscribe-prominent-button"
            onClick={() => {
                insights.capture('dashboard subscribe clicked', {
                    dashboard_id: dashboardId,
                })
                push(urlForSubscriptions({ dashboardId }))
            }}
        >
            Subscribe
        </Button>
    )
}
