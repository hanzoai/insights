import { useActions, useValues } from 'kea'

import { Checkbox } from 'lib/elements/Checkbox'
import { insightVizDataLogic } from 'scenes/insights/insightVizDataLogic'

import { insightLogic } from '../insightLogic'

export function LifecyclePercentagesFilter(): JSX.Element {
    const { insightProps } = useValues(insightLogic)
    const { updateInsightFilter } = useActions(insightVizDataLogic(insightProps))
    const { showPercentagesOnSeries } = useValues(insightVizDataLogic(insightProps))

    return (
        <Checkbox
            className="p-1 px-2"
            checked={!!showPercentagesOnSeries}
            onChange={() => {
                updateInsightFilter({ showPercentagesOnSeries: !showPercentagesOnSeries })
            }}
            label={<span className="font-normal">Show percentages on series</span>}
            size="small"
        />
    )
}
