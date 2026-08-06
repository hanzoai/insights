import { IconLock } from '@hanzo/icons'

import { TZLabel } from 'lib/components/TZLabel'
import { Tag } from 'lib/elements/Tag/Tag'

import { InstanceSetting, SystemStatusRow } from '~/types'

const TIMESTAMP_VALUES = new Set(['last_event_ingested_timestamp'])

export interface MetricValue {
    key: SystemStatusRow['key']
    value?: SystemStatusRow['value'] | number[]
    value_type?: InstanceSetting['value_type']
    emptyNullLabel?: string
    isSecret?: boolean
}

export function RenderMetricValue(
    _: any,
    { key, value, value_type, emptyNullLabel, isSecret }: MetricValue
): JSX.Element | string {
    if (value && isSecret) {
        return (
            <Tag
                className="uppercase text-secondary bg-mark"
                icon={isSecret ? <IconLock className="text-warning" /> : undefined}
            >
                Secret
            </Tag>
        )
    }

    if (key && TIMESTAMP_VALUES.has(key) && typeof value === 'string') {
        if (new Date(value).getTime() === new Date('1970-01-01T00:00:00').getTime()) {
            return 'Never'
        }
        return <TZLabel time={value} />
    }

    if (value_type === 'bool' || typeof value === 'boolean') {
        return (
            <Tag className="uppercase" type={value ? 'success' : 'danger'}>
                {value ? 'Yes' : 'No'}
            </Tag>
        )
    }

    if (value === null || value === undefined || value === '') {
        return <Tag className="uppercase text-secondary">{emptyNullLabel ?? 'Unknown'}</Tag>
    }

    if (value_type === 'int' || typeof value === 'number') {
        return value.toLocaleString('en-US')
    }

    if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : <Tag className="uppercase text-secondary">Empty</Tag>
    }

    return value.toString()
}
