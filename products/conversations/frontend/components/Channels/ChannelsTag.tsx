import { IconComment, IconLetter } from '@hanzo/icons'
import { Tag } from '@hanzo/elements'

import { IconSlack } from 'lib/elements/icons'

import type { TicketChannel } from '../../types'

const channelIcon: Record<TicketChannel, JSX.Element> = {
    widget: <IconComment />,
    slack: <IconSlack />,
    email: <IconLetter />,
}

interface ChannelsTagProps {
    channel: TicketChannel
}

export function ChannelsTag({ channel }: ChannelsTagProps): JSX.Element {
    return (
        <div className="flex items-center gap-1 text-muted-alt text-xs">
            <Tag type="muted">
                <span className="mr-1">{channelIcon[channel]}</span>
                {channel}
            </Tag>
        </div>
    )
}
