import { useActions, useValues } from 'kea'

import { Checkbox } from '@hanzo/elements'

import { insightLogic } from 'scenes/insights/insightLogic'

import { insightVizDataLogic } from '../insightVizDataLogic'

export function HideWeekendsFilter(): JSX.Element | null {
    const { insightProps } = useValues(insightLogic)
    const { trendsFilter } = useValues(insightVizDataLogic(insightProps))
    const { updateInsightFilter } = useActions(insightVizDataLogic(insightProps))

    const toggleHideWeekends = (): void => {
        updateInsightFilter({ hideWeekends: !trendsFilter?.hideWeekends })
    }

    return (
        <Checkbox
            className="p-1 px-2"
            onChange={toggleHideWeekends}
            checked={!!trendsFilter?.hideWeekends}
            label={<span className="font-normal">Hide weekend data</span>}
            size="small"
        />
    )
}
