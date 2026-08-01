import { IconClock, IconLive } from '@hanzo/icons'
import { SelectOptions, Tag } from '@hanzo/elements'

import { InsightsFunctionDeliveryType, getInsightsFunctionDeliveryType } from '../script-function-utils'

// Batch exports vs realtime destinations (script functions). Shared by the destinations list and the
// new-destination picker so the colour/icon/label stay in one place.
export function DeliveryTypeTag({ item }: { item: { id: string } }): JSX.Element {
    return getInsightsFunctionDeliveryType(item) === 'batch' ? (
        <Tag type="completion" icon={<IconClock />} className="text-xs">
            Batch
        </Tag>
    ) : (
        <Tag type="highlight" icon={<IconLive />} className="text-xs">
            Realtime
        </Tag>
    )
}

export const DELIVERY_TYPE_FILTER_OPTIONS: SelectOptions<InsightsFunctionDeliveryType | null> = [
    { label: 'All types', value: null },
    { label: 'Realtime', value: 'realtime' },
    { label: 'Batch', value: 'batch' },
]
