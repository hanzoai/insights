import { useValues } from 'kea'

import { IconSupport } from '@hanzo/icons'

import { IconWithCount } from 'lib/elements/icons'

import { supportTicketCounterLogic } from '../../supportTicketCounterLogic'

export interface SupportNavBadgeProps {
    className?: string
}

export function SupportNavBadge({ className }: SupportNavBadgeProps): JSX.Element {
    const { unreadCount } = useValues(supportTicketCounterLogic)

    return (
        <IconWithCount count={unreadCount} showZero={false} className={className}>
            <IconSupport />
        </IconWithCount>
    )
}
