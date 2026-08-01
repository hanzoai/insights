import { Tag, type TagType } from 'lib/elements/Tag'
import { humanFriendlyDetailedTime } from 'lib/utils/datetime'

import type { ZendeskTicketSignalExtraApi } from 'products/signals/frontend/generated/api.schemas'

import { ExternalSignalCard, type StatePill } from './ExternalSignalCard'
import type { SignalCardEntry, SignalCardProps } from './types'

const MAX_VISIBLE_TAGS = 6

/** Guard for Zendesk ticket extras. Keys on `status` + `tags` so it doesn't collide with Linear, which also carries `url` + `priority`. */
export function isZendeskTicketExtra(value: unknown): value is Record<string, unknown> & ZendeskTicketSignalExtraApi {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    const extra = value as Record<string, unknown>
    return typeof extra.url === 'string' && 'status' in extra && 'tags' in extra
}

/** Map a Zendesk priority to a tag colour. */
function zendeskPriorityTagType(p: string | null): TagType {
    switch (p) {
        case 'urgent':
            return 'danger'
        case 'high':
            return 'warning'
        case 'low':
            return 'muted'
        case 'normal':
        default:
            return 'default'
    }
}

/** Map a Zendesk status to a state-pill tone (constrained to the shell's 5 tones). */
function zendeskStatusTone(s: string): StatePill['tone'] {
    switch (s) {
        case 'solved':
            return 'success'
        case 'open':
        case 'pending':
            return 'warning'
        case 'closed':
            return 'muted'
        case 'new':
        case 'hold':
        default:
            return 'default'
    }
}

/** Sentence-case a lower-case token (e.g. a status or priority). */
function sentenceCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Strip Zendesk API artifacts so a raw API URL resolves to the user-facing ticket URL. */
function cleanZendeskUrl(url: string): string {
    return url.replace('/api/v2', '').replace('.json', '')
}

export function ZendeskTicketSignalCard({ signal }: SignalCardProps): JSX.Element {
    const extra = signal.extra as Record<string, unknown> & ZendeskTicketSignalExtraApi

    const statePill: StatePill = {
        label: sentenceCase(extra.status),
        tone: zendeskStatusTone(extra.status),
    }

    const tags = Array.isArray(extra.tags) ? extra.tags : []
    const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS)
    const overflowCount = tags.length - visibleTags.length

    const metaChips = (
        <>
            {extra.priority !== null && (
                <Tag size="small" type={zendeskPriorityTagType(extra.priority)}>
                    Priority: {sentenceCase(extra.priority)}
                </Tag>
            )}
            {extra.type !== null && (
                <Tag size="small" type="default">
                    {sentenceCase(extra.type)}
                </Tag>
            )}
            {visibleTags.map((tag) => (
                <Tag key={tag} size="small" type="muted">
                    {tag}
                </Tag>
            ))}
            {overflowCount > 0 && (
                <Tag size="small" type="muted">
                    +{overflowCount} more
                </Tag>
            )}
        </>
    )

    return (
        <ExternalSignalCard
            signal={signal}
            statePill={statePill}
            metaChips={metaChips}
            footerLeft={<span>Created {humanFriendlyDetailedTime(extra.created_at)}</span>}
            link={{ to: cleanZendeskUrl(extra.url), label: 'Open in Zendesk' }}
        >
            {signal.content}
        </ExternalSignalCard>
    )
}

export const zendeskTicketSignalCardEntry: SignalCardEntry = {
    key: 'zendesk',
    matches: (signal) => signal.source_product === 'zendesk' && isZendeskTicketExtra(signal.extra),
    Component: ZendeskTicketSignalCard,
}
