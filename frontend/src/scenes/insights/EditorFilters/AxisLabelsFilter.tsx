import { useActions, useValues } from 'kea'
import { useEffect, useState } from 'react'

import { Input, Label } from '@hanzo/elements'
import { normalizeAxisLabel } from '@hanzo/quill-charts'

import { insightVizDataLogic } from 'scenes/insights/insightVizDataLogic'

import { insightLogic } from '../insightLogic'

export function AxisLabelsFilter(): JSX.Element {
    const { insightProps } = useValues(insightLogic)
    const { trendsFilter } = useValues(insightVizDataLogic(insightProps))
    const { updateInsightFilter } = useActions(insightVizDataLogic(insightProps))
    const [xAxisLabelDraft, setXAxisLabelDraft] = useState(trendsFilter?.xAxisLabel ?? '')
    const [yAxisLabelDraft, setYAxisLabelDraft] = useState(trendsFilter?.yAxisLabel ?? '')

    useEffect(() => {
        setXAxisLabelDraft(trendsFilter?.xAxisLabel ?? '')
    }, [trendsFilter?.xAxisLabel])

    useEffect(() => {
        setYAxisLabelDraft(trendsFilter?.yAxisLabel ?? '')
    }, [trendsFilter?.yAxisLabel])

    const commitXAxisLabel = (): void => {
        const normalized = normalizeAxisLabel(xAxisLabelDraft)
        setXAxisLabelDraft(normalized ?? '')
        updateInsightFilter({ xAxisLabel: normalized })
    }

    const commitYAxisLabel = (): void => {
        const normalized = normalizeAxisLabel(yAxisLabelDraft)
        setYAxisLabelDraft(normalized ?? '')
        updateInsightFilter({ yAxisLabel: normalized })
    }

    return (
        <div className="p-1 px-2 flex flex-col gap-2 w-64">
            <div className="flex flex-col gap-1">
                <Label>X-axis label</Label>
                <Input
                    size="small"
                    data-attr="trends-x-axis-label-input"
                    value={xAxisLabelDraft}
                    placeholder="X-axis label"
                    onChange={setXAxisLabelDraft}
                    onBlur={commitXAxisLabel}
                    onPressEnter={commitXAxisLabel}
                />
            </div>
            <div className="flex flex-col gap-1">
                <Label>Y-axis label</Label>
                <Input
                    size="small"
                    data-attr="trends-y-axis-label-input"
                    value={yAxisLabelDraft}
                    placeholder="Y-axis label"
                    onChange={setYAxisLabelDraft}
                    onBlur={commitYAxisLabel}
                    onPressEnter={commitYAxisLabel}
                />
            </div>
        </div>
    )
}
