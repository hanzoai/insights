import { IconInfo } from '@hanzo/icons'
import { Tooltip } from '@hanzo/lemon-ui'

import { LinkedInsightsFunctions } from 'scenes/insights-functions/list/LinkedInsightsFunctions'
import { urls } from 'scenes/urls'

export function DiscussionMentionNotifications(): JSX.Element {
    return (
        <div>
            <p className="flex items-center gap-1">
                Get notified when someone mentions you in a discussion.
                <Tooltip
                    title={
                        <>
                            Configure destination integrations (e.g., Slack, Discord, Microsoft Teams) to receive
                            notifications when you are mentioned in discussions on replays, notebooks, insights, and
                            other items.
                        </>
                    }
                >
                    <IconInfo className="text-lg" />
                </Tooltip>
            </p>

            <LinkedInsightsFunctions
                type="internal_destination"
                subTemplateIds={['discussion-mention']}
                emptyText="No notifications configured"
                queryParams={{
                    returnTo: urls.settings('environment-discussions', 'discussion-mention-integrations'),
                }}
            />
        </div>
    )
}
