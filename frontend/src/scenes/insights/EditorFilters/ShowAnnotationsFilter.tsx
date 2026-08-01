import { useActions, useValues } from 'kea'

import { Checkbox } from '@hanzo/elements'

import { insightLogic } from 'scenes/insights/insightLogic'

import { insightVizDataLogic } from '../insightVizDataLogic'

export function ShowAnnotationsFilter(): JSX.Element | null {
    const { insightProps } = useValues(insightLogic)
    const { showAnnotations } = useValues(insightVizDataLogic(insightProps))
    const { updateInsightFilter } = useActions(insightVizDataLogic(insightProps))

    const checked = showAnnotations !== false

    return (
        <Checkbox
            className="p-1 px-2"
            onChange={(value) => updateInsightFilter({ showAnnotations: value })}
            checked={checked}
            label={<span className="font-normal">Show annotations</span>}
            size="small"
        />
    )
}
