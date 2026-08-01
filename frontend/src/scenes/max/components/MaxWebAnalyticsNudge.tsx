import { useActions, useValues } from 'kea'

import { Button } from '@hanzo/elements'

import { iconForType } from '~/layout/panel-layout/ProjectTree/defaultTree'

import { MessageTemplate } from 'products/insights_ai/frontend/api/primitives'

import { maxWebAnalyticsNudgeLogic } from '../logics/maxWebAnalyticsNudgeLogic'
import { maxLogic, ThreadMessage } from '../maxLogic'
import { maxThreadLogic } from '../maxThreadLogic'

export interface MaxWebAnalyticsNudgeProps {
    message: ThreadMessage
    messageId: string
}

export function MaxWebAnalyticsNudge({ message, messageId }: MaxWebAnalyticsNudgeProps): JSX.Element | null {
    const { threadGrouped, isSharedThread, threadLoading, conversation } = useValues(maxThreadLogic)
    const { conversationId } = useValues(maxLogic)

    const logic = maxWebAnalyticsNudgeLogic({
        messageId,
        threadGrouped,
        isCompleted: message.status === 'completed' && !threadLoading,
        isSharedThread,
        conversationId,
        conversationTopic: conversation?.topic ?? null,
    })
    const { shouldShowNudge } = useValues(logic)
    const { nudgeClicked, nudgeDismissed } = useActions(logic)

    if (!shouldShowNudge) {
        return null
    }

    return (
        <MessageTemplate type="ai" boxClassName="border-accent">
            <div className="flex items-start gap-2">
                <span className="text-lg shrink-0">{iconForType('web_analytics')}</span>
                <div className="flex flex-col gap-1.5">
                    <span className="text-sm">
                        Want the full picture? Web analytics breaks down pageviews, traffic sources, and more in one
                        place.
                    </span>
                    <div className="flex gap-2">
                        <Button type="primary" size="small" onClick={nudgeClicked}>
                            View in Web analytics
                        </Button>
                        <Button type="tertiary" size="small" onClick={nudgeDismissed}>
                            Dismiss
                        </Button>
                    </div>
                </div>
            </div>
        </MessageTemplate>
    )
}
