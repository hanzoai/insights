import { useValues } from 'kea'

import { IconSupport } from '@hanzo/icons'

import { IconWithCount } from 'lib/elements/icons'

import { sidepanelTicketsLogic } from './sidepanelTicketsLogic'

export const SidePanelSupportIcon = (props: { className?: string }): JSX.Element => {
    const { totalUnreadCount } = useValues(sidepanelTicketsLogic)
    return (
        <IconWithCount count={totalUnreadCount} {...props}>
            <IconSupport />
        </IconWithCount>
    )
}
