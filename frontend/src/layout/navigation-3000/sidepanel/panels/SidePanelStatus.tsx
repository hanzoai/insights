import { useActions, useValues } from 'kea'
import { useEffect } from 'react'

import { IconCloud } from '@hanzo/icons'
import { BadgeProps, Tooltip } from '@hanzo/elements'

import { IconWithBadge } from 'lib/elements/icons'

import { sidePanelLogic } from '../sidePanelLogic'
import { STATUS_PAGE_URL, sidePanelStatusIncidentIoLogic } from './sidePanelStatusIncidentIoLogic'

export const SidePanelStatusIcon = (props: { className?: string; size?: BadgeProps['size'] }): JSX.Element => {
    const { status, statusDescription } = useValues(sidePanelStatusIncidentIoLogic)

    return (
        <Tooltip title={statusDescription} placement="left">
            <span {...props}>
                <IconWithBadge
                    content={status !== 'operational' ? '!' : '✓'}
                    size={props.size}
                    status={
                        status.includes('outage')
                            ? 'danger'
                            : status.includes('degraded') || status.includes('monitoring')
                              ? 'warning'
                              : 'success'
                    }
                    className={props.className}
                >
                    <IconCloud />
                </IconWithBadge>
            </span>
        </Tooltip>
    )
}

export const SidePanelStatus = (): JSX.Element => {
    const { closeSidePanel } = useActions(sidePanelLogic)

    useEffect(() => {
        // Send the reader to the human status page, not to the JSON endpoint the
        // panel polls — these are two different addresses on purpose.
        window.open(STATUS_PAGE_URL, '_blank')?.focus()
        closeSidePanel()
    }, [closeSidePanel])

    return <></>
}
