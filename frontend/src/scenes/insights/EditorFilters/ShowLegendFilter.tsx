import { useActions, useValues } from 'kea'

import { Checkbox } from '@hanzo/elements'

import { insightLogic } from 'scenes/insights/insightLogic'

import { insightVizDataLogic } from '../insightVizDataLogic'

export function ShowLegendFilter(): JSX.Element | null {
    const { insightProps } = useValues(insightLogic)
    const { showLegend } = useValues(insightVizDataLogic(insightProps))
    const { updateInsightFilter } = useActions(insightVizDataLogic(insightProps))

    const toggleShowLegend = (): void => {
        updateInsightFilter({ showLegend: !showLegend })
    }

    return (
        <Checkbox
            className="p-1 px-2"
            onChange={toggleShowLegend}
            checked={!!showLegend}
            label={<span className="font-normal">Show legend</span>}
            size="small"
        />
    )
}
