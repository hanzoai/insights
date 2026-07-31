import { IconChevronDown, IconChevronRight } from '@hanzo/icons'
import { Tag } from '@hanzo/elements'

import { EventDetails } from '~/scenes/activity/explore/EventDetails'
import { EventType } from '~/types'

import { formatLLMCost } from '../utils'

interface LLMAnalyticsEventCardProps {
    event: {
        id: string
        event: string
        createdAt: string
        properties: Record<string, any>
    }
    isExpanded: boolean
    onToggleExpand: () => void
}

export function LLMAnalyticsEventCard({ event, isExpanded, onToggleExpand }: LLMAnalyticsEventCardProps): JSX.Element {
    const isGeneration = event.event === '$ai_generation'
    const isEmbedding = event.event === '$ai_embedding'
    const eventForDetails: EventType = {
        id: event.id,
        distinct_id: '',
        properties: event.properties,
        event: event.event,
        timestamp: event.createdAt,
        elements: [],
    }
    const latency = event.properties.$ai_latency
    const hasError = event.properties.$ai_error || event.properties.$ai_is_error

    // Generation-specific properties
    const model = event.properties.$ai_model || 'Unknown model'
    const cost = event.properties.$ai_total_cost_usd

    // Span-specific properties
    const spanName = event.properties.$ai_span_name || 'Unnamed span'

    return (
        <div className="border rounded bg-bg-3000">
            <div className="p-2 hover:bg-side-light cursor-pointer flex items-center gap-2" onClick={onToggleExpand}>
                <div className="flex-shrink-0">
                    {isExpanded ? (
                        <IconChevronDown className="text-base" />
                    ) : (
                        <IconChevronRight className="text-base" />
                    )}
                </div>
                <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
                    <Tag
                        type={isGeneration ? 'success' : isEmbedding ? 'warning' : 'default'}
                        size="small"
                        className="uppercase"
                    >
                        {isGeneration ? 'Generation' : isEmbedding ? 'Embedding' : 'Span'}
                    </Tag>
                    {hasError && (
                        <Tag type="danger" size="small">
                            Error
                        </Tag>
                    )}
                    <span className="text-xs truncate">{isGeneration || isEmbedding ? model : spanName}</span>
                    {typeof latency === 'number' && (
                        <Tag type="muted" size="small">
                            {latency.toFixed(2)}s
                            {event.properties.$ai_stream &&
                                typeof event.properties.$ai_time_to_first_token === 'number' && (
                                    <span className="ml-1 opacity-75">
                                        (TTFT:{' '}
                                        {event.properties.$ai_time_to_first_token < 0.001
                                            ? `${(event.properties.$ai_time_to_first_token * 1000).toFixed(2)}ms`
                                            : `${Math.round(event.properties.$ai_time_to_first_token * 1000)}ms`}
                                        )
                                    </span>
                                )}
                        </Tag>
                    )}
                    {(isGeneration || isEmbedding) && typeof cost === 'number' && (
                        <Tag type="muted" size="small">
                            {formatLLMCost(cost)}
                        </Tag>
                    )}
                </div>
            </div>
            {isExpanded && (
                <div className="border-t">
                    <EventDetails event={eventForDetails} />
                </div>
            )}
        </div>
    )
}
