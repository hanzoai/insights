import { Checkbox, Input } from '@hanzo/elements'

import { Tag } from 'lib/elements/Tag/Tag'

import { MetricValue } from './RenderMetricValue'

interface MetricValueEditInterface extends MetricValue {
    onValueChanged: (key: string, value: any) => void
}

export function RenderMetricValueEdit({
    key,
    value,
    value_type,
    onValueChanged,
    isSecret,
}: MetricValueEditInterface): JSX.Element | string {
    if (value_type === 'bool') {
        return (
            <Checkbox
                defaultChecked={!!value}
                onChange={(val) => onValueChanged(key, val)}
                label={
                    <Tag type={value ? 'success' : 'danger'} className="uppercase">
                        {value ? 'Yes' : 'No'}
                    </Tag>
                }
            />
        )
    }

    const parsedValue = isSecret && value ? '' : Array.isArray(value) ? value.join(', ') : (value as string | number)

    return (
        <Input
            defaultValue={parsedValue as any}
            type={value_type === 'int' ? 'number' : 'text'}
            placeholder={
                isSecret && value
                    ? 'Keep existing secret value'
                    : value_type === 'list[int]'
                      ? 'e.g. 1, 2, 3'
                      : undefined
            }
            onBlur={(e) => onValueChanged(key, e.target.value)}
        />
    )
}
