import { useActions, useValues } from 'kea'

import { Select, SelectOption } from '@hanzo/elements'

import { insightLogic } from 'scenes/insights/insightLogic'

import { retentionLogic } from './retentionLogic'

export function RetentionBreakdownFilter(): JSX.Element | null {
    const { insightProps, editingDisabledReason } = useValues(insightLogic)
    const { breakdownValues, selectedBreakdownValue, breakdownDisplayNames } = useValues(retentionLogic(insightProps))
    const { setSelectedBreakdownValue } = useActions(retentionLogic(insightProps))

    if (!breakdownValues || breakdownValues.length === 0) {
        return null
    }

    const options = [
        { value: null, label: 'All breakdown values' },
        ...breakdownValues.map((value) => ({
            value: value as string | number | boolean,
            label:
                breakdownDisplayNames[String(value ?? '')] ||
                (value === null || value === '' ? '(empty)' : String(value)),
        })),
    ]

    return (
        <Select
            value={selectedBreakdownValue}
            onChange={(value) => setSelectedBreakdownValue(value)}
            options={options as SelectOption<string | number | boolean | null>[]}
            placeholder="Select breakdown value"
            size="small"
            data-attr="retention-breakdown-filter"
            disabledReason={editingDisabledReason}
        />
    )
}
