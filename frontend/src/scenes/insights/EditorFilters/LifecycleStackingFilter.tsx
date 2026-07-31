import { useActions, useValues } from 'kea'

import { Checkbox } from 'lib/elements/Checkbox'
import { insightLogic } from 'scenes/insights/insightLogic'
import { insightVizDataLogic } from 'scenes/insights/insightVizDataLogic'

export function LifecycleStackingFilter(): JSX.Element {
    const { insightProps } = useValues(insightLogic)
    const { lifecycleFilter } = useValues(insightVizDataLogic(insightProps))
    const { updateInsightFilter } = useActions(insightVizDataLogic(insightProps))

    return (
        <Checkbox
            className="p-1 px-2"
            checked={lifecycleFilter?.stacked ?? true}
            onChange={(checked) => {
                updateInsightFilter({ stacked: checked })
            }}
            label={<span className="font-normal">Stack bars</span>}
            size="small"
        />
    )
}
