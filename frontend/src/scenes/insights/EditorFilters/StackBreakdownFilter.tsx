import { useActions, useValues } from 'kea'

import { Checkbox } from 'lib/elements/Checkbox'
import { trendsDataLogic } from 'scenes/trends/trendsDataLogic'

import { insightLogic } from '../insightLogic'

export function StackBreakdownFilter(): JSX.Element {
    const { insightProps } = useValues(insightLogic)
    const { trendsFilter } = useValues(trendsDataLogic(insightProps))
    const { updateInsightFilter } = useActions(trendsDataLogic(insightProps))

    return (
        <Checkbox
            className="p-1 px-2"
            checked={!!trendsFilter?.stackBreakdownValues}
            onChange={(checked) => {
                updateInsightFilter({ stackBreakdownValues: checked })
            }}
            label={<span className="font-normal">Stack breakdown values</span>}
            size="small"
        />
    )
}
