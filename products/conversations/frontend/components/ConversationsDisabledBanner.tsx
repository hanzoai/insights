import { IconOpenSidebar } from '@hanzo/icons'
import { Banner, Button } from '@hanzo/elements'

import { SupportHeroHog } from 'lib/components/mascots'
import { urls } from 'scenes/urls'

export function ConversationsDisabledBanner(): JSX.Element {
    return (
        <Banner type="info" hideIcon={true}>
            <div className="flex gap-8 p-8 lg:flex-row justify-center flex-wrap">
                <div className="hidden lg:flex justify-center items-center w-full lg:w-50">
                    <SupportHeroHog className="h-[200px] w-[200px]" />
                </div>
                <div className="flex flex-col gap-2 flex-shrink max-w-180">
                    <h2 className="text-lg font-semibold">Welcome to Support</h2>
                    <p className="font-normal">
                        Support lets you manage customer conversations directly inside Insights. Enable the conversations
                        API to get started.
                    </p>
                    <ul className="list-disc list-inside font-normal space-y-2">
                        <li>
                            <strong>Centralized inbox:</strong> Receive and reply to customer messages from an in-app
                            widget, Slack, Email or the API — all in one place.
                        </li>
                        <li>
                            <strong>Ticket management:</strong> Track, prioritize, and assign tickets with SLAs so
                            nothing falls through the cracks.
                        </li>
                        <li>
                            <strong>Deep product context:</strong> See session recordings, events, error tracking, and
                            previous tickets for each person behind every ticket.
                        </li>
                        <li>
                            <strong>Workflow automation:</strong> Trigger workflows on ticket events like creation,
                            status changes, or new messages to automate assignments, notifications, and more.
                        </li>
                    </ul>
                    <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
                        <Button className="hidden @md:flex" type="primary" to={urls.supportSettings()}>
                            Enable
                        </Button>
                        <Button
                            type="tertiary"
                            sideIcon={<IconOpenSidebar className="w-4 h-4" />}
                            to="https://hanzo.ai/docs/support?utm_medium=in-product&utm_campaign=support-empty-state-docs-link"
                            data-attr="support-introduction-docs-link"
                            targetBlank
                        >
                            Learn more
                        </Button>
                    </div>
                </div>
            </div>
        </Banner>
    )
}
