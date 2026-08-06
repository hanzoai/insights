import { useValues } from 'kea'

import { IconQuestion } from '@hanzo/icons'

import { IconWithCount } from 'lib/elements/icons'

import { sidepanelTicketsLogic } from './sidepanelTicketsLogic'

export const SidePanelQuestionIcon = (props: { className?: string }): JSX.Element => {
    const { totalUnreadCount } = useValues(sidepanelTicketsLogic)
    return (
        <IconWithCount count={totalUnreadCount} size="xsmall" {...props}>
            <IconQuestion />
        </IconWithCount>
    )
}
