import { useActions, useValues } from 'kea'

import { Checkbox } from 'lib/elements/Checkbox'
import { trendsDataLogic } from 'scenes/trends/trendsDataLogic'

import { insightLogic } from '../insightLogic'

export function PercentStackViewFilter({ disabledReason }: { disabledReason?: string }): JSX.Element {
    const { insightProps } = useValues(insightLogic)
    const { showPercentStackView } = useValues(trendsDataLogic(insightProps))
    const { updateInsightFilter } = useActions(trendsDataLogic(insightProps))

    return (
        <Checkbox
            className="p-1 px-2"
            checked={!!showPercentStackView}
            onChange={(checked) => {
                updateInsightFilter({ showPercentStackView: checked })
            }}
            label={<span className="font-normal">Show as % of total</span>}
            size="small"
            disabledReason={disabledReason}
        />
    )
}
