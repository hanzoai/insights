import { useActions, useValues } from 'kea'

import { SegmentedButton } from '@hanzo/elements'

import { insightLogic } from 'scenes/insights/insightLogic'
import { insightVizDataLogic } from 'scenes/insights/insightVizDataLogic'

export function RetentionCohortLabelStartIndexPicker(): JSX.Element | null {
    const { insightProps, canEditInsight } = useValues(insightLogic)

    const { retentionFilter } = useValues(insightVizDataLogic(insightProps))
    const { updateInsightFilter } = useActions(insightVizDataLogic(insightProps))

    if (!canEditInsight) {
        return null
    }

    const period = retentionFilter?.period || 'Day'

    return (
        <SegmentedButton
            className="pb-2 px-2"
            value={retentionFilter?.cohortLabelStartIndex ?? 0}
            onChange={(value: number) => {
                updateInsightFilter({ cohortLabelStartIndex: value })
            }}
            options={[
                {
                    value: 0,
                    label: `${period} 0`,
                },
                {
                    value: 1,
                    label: `${period} 1`,
                },
            ]}
            size="small"
            fullWidth
        />
    )
}
