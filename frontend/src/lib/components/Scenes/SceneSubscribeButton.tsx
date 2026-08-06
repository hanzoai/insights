import { useActions } from 'kea'
import { router } from 'kea-router'

import { IconBell } from '@hanzo/icons'

import { CAPABILITIES } from 'lib/capabilities'
import { ButtonPrimitive } from 'lib/ui/Button/ButtonPrimitives'

import { QueryBasedInsightModel } from '~/types'

import {
    SubscriptionBaseProps,
    urlForSubscriptions,
} from 'products/subscriptions/frontend/components/Subscriptions/utils'

import { SceneDataAttrKeyProps } from './utils'

interface SceneSubscribeButtonProps extends SubscriptionBaseProps, SceneDataAttrKeyProps {
    insight?: Partial<QueryBasedInsightModel>
    dashboardId?: number
}

export function SceneSubscribeButton({
    dataAttrKey,
    insight,
    dashboardId,
    disabledReasons,
}: SceneSubscribeButtonProps): JSX.Element | null {
    const { push } = useActions(router)

    // A menu item on every insight and dashboard, opening a modal that can only report the
    // capability is absent. An entry point that leads nowhere is better not drawn.
    if (!CAPABILITIES.subscriptions.available) {
        return null
    }

    return (
        <ButtonPrimitive
            menuItem
            onClick={() => {
                push(urlForSubscriptions({ insightShortId: insight?.short_id, dashboardId }))
            }}
            data-attr={`${dataAttrKey}-subscribe-dropdown-menu-item`}
            disabledReasons={disabledReasons}
        >
            <IconBell />
            Subscribe
        </ButtonPrimitive>
    )
}
