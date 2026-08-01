import { useActions, useValues } from 'kea'

import { IconInfo } from '@hanzo/icons'
import { Input, Select, SelectOption } from '@hanzo/elements'

import { Tooltip } from 'lib/elements/Tooltip'
import { capitalizeFirstLetter, pluralize } from 'lib/utils/strings'
import { funnelDataLogic } from 'scenes/funnels/funnelDataLogic'
import { TIME_INTERVAL_BOUNDS } from 'scenes/funnels/funnelUtils'

import { EditorFilterProps, FunnelConversionWindowTimeUnit } from '~/types'

export function FunnelConversionWindowFilter({ insightProps }: Pick<EditorFilterProps, 'insightProps'>): JSX.Element {
    const { aggregationTargetLabel, querySource, conversionWindow, conversionWindowInterval, conversionWindowUnit } =
        useValues(funnelDataLogic(insightProps))
    const { setConversionWindowInterval, setConversionWindowUnit, commitConversionWindow } = useActions(
        funnelDataLogic(insightProps)
    )

    const hasEdited = conversionWindowInterval !== null
    const displayInterval = hasEdited ? conversionWindowInterval || undefined : conversionWindow.funnelWindowInterval

    const displayUnit = conversionWindowUnit ?? conversionWindow.funnelWindowIntervalUnit
    const intervalBounds = TIME_INTERVAL_BOUNDS[displayUnit]

    const options: SelectOption<FunnelConversionWindowTimeUnit>[] = Object.keys(TIME_INTERVAL_BOUNDS).map(
        (unit) => ({
            label: capitalizeFirstLetter(
                pluralize(conversionWindow.funnelWindowInterval ?? 7, unit, `${unit}s`, false)
            ),
            value: unit as FunnelConversionWindowTimeUnit,
        })
    )

    return (
        <div className="flex items-center gap-2 flex-wrap" data-attr="funnel-conversion-window-filter">
            <span className="flex whitespace-nowrap">
                Conversion window limit
                <Tooltip
                    title={
                        <>
                            Limit to {aggregationTargetLabel.plural}{' '}
                            {querySource?.aggregation_group_type_index != null ? 'that' : 'who'} converted within a
                            specific time frame. {capitalizeFirstLetter(aggregationTargetLabel.plural)}{' '}
                            {querySource?.aggregation_group_type_index != null ? 'that' : 'who'} do not convert in this
                            time frame will be considered as drop-offs.
                        </>
                    }
                >
                    <IconInfo className="w-4 info-indicator" />
                </Tooltip>
            </span>
            <div className="flex items-center gap-2">
                <Input
                    type="number"
                    className="max-w-20"
                    fullWidth={false}
                    min={intervalBounds[0]}
                    max={intervalBounds[1]}
                    value={displayInterval}
                    onChange={(value) => setConversionWindowInterval(value || 0)}
                    onBlur={commitConversionWindow}
                    onPressEnter={commitConversionWindow}
                />
                <Select
                    dropdownMatchSelectWidth={false}
                    value={displayUnit}
                    onChange={(funnelWindowIntervalUnit: FunnelConversionWindowTimeUnit | null) => {
                        if (funnelWindowIntervalUnit) {
                            setConversionWindowUnit(funnelWindowIntervalUnit)
                            commitConversionWindow()
                        }
                    }}
                    options={options}
                    data-attr="funnel-conversion-window-unit"
                />
            </div>
        </div>
    )
}
