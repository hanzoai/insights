import { Select } from '@hanzo/elements'

import { apiValueToMathType } from 'scenes/trends/mathsLogic'

import type { MathSelectorProps } from './types'
import { useMathSelectorOptions } from './useMathSelectorOptions'

export function MathSelector(props: MathSelectorProps): JSX.Element {
    const options = useMathSelectorOptions(props)
    const { math, mathGroupTypeIndex, index, onMathSelect, disabled, disabledReason, size, fullWidth, truncateText } =
        props

    const mathType = apiValueToMathType(math, mathGroupTypeIndex)

    return (
        <Select
            value={mathType}
            options={options}
            onChange={(value) => onMathSelect(index, value)}
            data-attr={`math-selector-${index}`}
            disabled={disabled}
            disabledReason={disabledReason}
            optionTooltipPlacement="right"
            dropdownMatchSelectWidth={false}
            dropdownPlacement="bottom-start"
            size={size}
            fullWidth={fullWidth}
            truncateText={truncateText}
        />
    )
}
