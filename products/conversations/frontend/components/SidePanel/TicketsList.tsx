import { useActions, useValues } from 'kea'
import insights from '@hanzo/insights'

import { IconChevronRight } from '@hanzo/icons'
import { Badge, Button, Tag, Spinner } from '@hanzo/elements'
import { Link } from '@hanzo/elements'

import { TZLabel } from 'lib/components/TZLabel'
import { stripMarkdown } from 'lib/utils/stripMarkdown'

import type { ConversationTicket } from '../../types'
import { sidepanelTicketsLogic } from './sidepanelTicketsLogic'

export function TicketsList(): JSX.Element {
    const { tickets, ticketsLoading } = useValues(sidepanelTicketsLogic)
    const { setCurrentTicket, setView } = useActions(sidepanelTicketsLogic)

    if (!insights.conversations || !insights.conversations.isAvailable()) {
        return (
            <div className="text-center text-muted-alt py-8">
                <p>Conversations are not available for this team.</p>
            </div>
        )
    }

    if (ticketsLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <Spinner />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            <Button
                type="primary"
                fullWidth
                center
                onClick={() => setView('new')}
                data-attr="sidebar-create-new-ticket"
            >
                Create new ticket
            </Button>
            <p className="text-center text-xs text-muted-alt m-0">
                Switched browsers?{' '}
                <Link className="cursor-pointer" onClick={() => setView('restore')} data-attr="sidebar-recover-tickets">
                    Recover your tickets
                </Link>
            </p>
            {tickets.length === 0 ? (
                <div className="text-center text-muted-alt py-8">
                    <p>No tickets yet.</p>
                    <p className="text-sm">Create a new ticket to get help from our team.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-1 mt-2">
                    {tickets.map((ticket: ConversationTicket) => (
                        <div
                            key={ticket.id}
                            className={`flex items-center justify-between p-3 rounded border cursor-pointer hover:bg-surface-light transition-colors ${
                                (ticket.unread_count ?? 0) > 0 ? 'bg-primary-alt-highlight' : 'bg-white'
                            }`}
                            onClick={() => {
                                setCurrentTicket(ticket)
                            }}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    {ticket.ticket_number && (
                                        <span className="text-xs font-mono text-muted-alt">
                                            #{ticket.ticket_number}
                                        </span>
                                    )}
                                    <Tag
                                        type={
                                            ticket.status === 'resolved'
                                                ? 'success'
                                                : ticket.status === 'new'
                                                  ? 'primary'
                                                  : 'default'
                                        }
                                        size="small"
                                    >
                                        {ticket.status === 'on_hold' ? 'On hold' : ticket.status}
                                    </Tag>
                                    {(ticket.unread_count ?? 0) > 0 && (
                                        <Badge.Number
                                            count={ticket.unread_count ?? 0}
                                            size="small"
                                            status="primary"
                                        />
                                    )}
                                </div>
                                {ticket.last_message && (
                                    <p className="text-sm text-primary truncate m-0">
                                        {stripMarkdown(ticket.last_message)}
                                    </p>
                                )}
                                <p className="text-xs text-muted-alt m-0 mt-1">
                                    <TZLabel time={ticket.created_at} />
                                </p>
                            </div>
                            <IconChevronRight className="text-muted-alt" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
