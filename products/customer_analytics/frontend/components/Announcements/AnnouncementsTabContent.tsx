import { useActions, useValues } from 'kea'

import {
    Banner,
    Button,
    InputSelect,
    Table,
    TableColumns,
    Tag,
    TextArea,
    Link,
} from '@hanzo/elements'

import { TZLabel } from 'lib/components/TZLabel'
import { urls } from 'scenes/urls'

import type { AnnouncementApi, AnnouncementDeliveryApi } from '../../generated/api.schemas'
import { AnnouncementAccountFilters } from './AnnouncementAccountFilters'
import { announcementsLogic } from './announcementsLogic'

type TagType = 'success' | 'primary' | 'warning' | 'danger' | 'default'

function announcementStatusTag(status: AnnouncementApi['status']): { type: TagType; label: string } {
    switch (status) {
        case 'sent':
            return { type: 'success', label: 'Sent' }
        case 'sending':
            return { type: 'primary', label: 'Sending' }
        case 'partially_failed':
            return { type: 'warning', label: 'Partially failed' }
        case 'failed':
            return { type: 'danger', label: 'Failed' }
        default:
            return { type: 'default', label: 'Pending' }
    }
}

function AnnouncementComposer(): JSX.Element {
    const {
        messageDraft,
        selectedChannelIds,
        channelOptions,
        memberChannelsLoading,
        submitting,
        submitDisabledReason,
    } = useValues(announcementsLogic)
    const { setMessage, setSelectedChannelIds, submitAnnouncement, loadMemberChannels } = useActions(announcementsLogic)

    return (
        <div className="flex flex-col gap-2 max-w-[800px]">
            <TextArea
                value={messageDraft}
                onChange={setMessage}
                placeholder="Write a message to send to the selected customer channels…"
                minRows={4}
            />
            <AnnouncementAccountFilters />
            <div className="flex gap-2 items-center">
                <InputSelect
                    mode="multiple"
                    value={selectedChannelIds}
                    options={channelOptions}
                    onChange={setSelectedChannelIds}
                    loading={memberChannelsLoading}
                    placeholder="Select customer channels"
                    className="flex-1"
                />
                <Button
                    type="secondary"
                    size="small"
                    onClick={loadMemberChannels}
                    disabledReason={memberChannelsLoading ? 'Loading channels…' : undefined}
                >
                    Refresh
                </Button>
            </div>
            <div>
                <Button
                    type="primary"
                    onClick={submitAnnouncement}
                    loading={submitting}
                    disabledReason={submitDisabledReason}
                    data-attr="send-announcement"
                >
                    Send announcement
                </Button>
            </div>
        </div>
    )
}

function DeliveriesTable({ deliveries }: { deliveries: readonly AnnouncementDeliveryApi[] }): JSX.Element {
    const columns: TableColumns<AnnouncementDeliveryApi> = [
        {
            title: 'Channel',
            key: 'channel',
            render: (_, delivery) =>
                delivery.slack_channel_name ? `#${delivery.slack_channel_name}` : delivery.slack_channel_id,
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, delivery) => (
                <Tag
                    type={delivery.status === 'sent' ? 'success' : delivery.status === 'failed' ? 'danger' : 'default'}
                >
                    {delivery.status}
                </Tag>
            ),
        },
        {
            title: 'Error',
            key: 'error',
            render: (_, delivery) =>
                delivery.error ? <span className="text-danger text-xs">{delivery.error}</span> : '—',
        },
    ]
    return <Table embedded dataSource={[...deliveries]} rowKey="id" columns={columns} />
}

function AnnouncementHistory(): JSX.Element {
    const { announcements, announcementsLoading } = useValues(announcementsLogic)
    const { loadAnnouncements } = useActions(announcementsLogic)

    const columns: TableColumns<AnnouncementApi> = [
        {
            title: 'Message',
            key: 'message',
            render: (_, announcement) => <span className="truncate max-w-md inline-block">{announcement.message}</span>,
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, announcement) => {
                const tag = announcementStatusTag(announcement.status)
                return <Tag type={tag.type}>{tag.label}</Tag>
            },
        },
        {
            title: 'Delivered',
            key: 'sent_count',
            render: (_, announcement) => `${announcement.sent_count}/${announcement.total_channels}`,
        },
        {
            title: 'Failed',
            key: 'failed_count',
            render: (_, announcement) => announcement.failed_count || '—',
        },
        {
            title: 'Created',
            key: 'created_at',
            render: (_, announcement) => <TZLabel time={announcement.created_at} />,
        },
        {
            title: 'By',
            key: 'created_by',
            render: (_, announcement) => announcement.created_by?.first_name || announcement.created_by?.email || '—',
        },
    ]

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h3 className="m-0">Sent announcements</h3>
                <Button type="secondary" size="small" onClick={loadAnnouncements} loading={announcementsLoading}>
                    Refresh
                </Button>
            </div>
            <Table<AnnouncementApi>
                dataSource={announcements}
                loading={announcementsLoading}
                rowKey="id"
                columns={columns}
                expandable={{
                    expandedRowRender: (announcement) => <DeliveriesTable deliveries={announcement.deliveries} />,
                    rowExpandable: (announcement) => announcement.deliveries.length > 0,
                }}
                emptyState="No announcements sent yet"
            />
        </div>
    )
}

export function AnnouncementsTabContent(): JSX.Element {
    const { slackConnected } = useValues(announcementsLogic)

    if (!slackConnected) {
        return (
            <Banner type="warning">
                Connect the SupportHog Slack bot in <Link to={urls.supportSettings()}>Support settings</Link> to send
                announcements to customer channels.
            </Banner>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <AnnouncementComposer />
            <AnnouncementHistory />
        </div>
    )
}
