import { IconInfo } from '@hanzo/icons'
import type { SelectOption } from '@hanzo/elements'
import { Input, Select } from '@hanzo/elements'

import { Tooltip } from 'lib/elements/Tooltip'
import { capitalizeFirstLetter, pluralize } from 'lib/utils/strings'
import { TIME_INTERVAL_BOUNDS } from 'scenes/funnels/funnelUtils'

import { FunnelConversionWindowTimeUnit } from '~/types'

/**
 * @deprecated
 * Legacy funnel conversion window filter for ExperimentView.
 * Frozen copy for legacy experiments - do not modify.
 * Forked from https://github.com/Insights/insights/blob/master/frontend/src/scenes/insights/views/Funnels/FunnelConversionWindowFilter.tsx
 */
export function LegacyFunnelConversionWindowFilter({
    funnelWindowInterval,
    funnelWindowIntervalUnit,
    onFunnelWindowIntervalChange,
    onFunnelWindowIntervalUnitChange,
}: {
    funnelWindowInterval: number | undefined
    funnelWindowIntervalUnit: FunnelConversionWindowTimeUnit | undefined
    onFunnelWindowIntervalChange: (funnelWindowInterval: number | undefined) => void
    onFunnelWindowIntervalUnitChange: (funnelWindowIntervalUnit: FunnelConversionWindowTimeUnit) => void
}): JSX.Element {
    const options: SelectOption<FunnelConversionWindowTimeUnit>[] = Object.keys(TIME_INTERVAL_BOUNDS).map(
        (unit) => ({
            label: capitalizeFirstLetter(pluralize(funnelWindowInterval ?? 7, unit, `${unit}s`, false)),
            value: unit as FunnelConversionWindowTimeUnit,
        })
    )
    const intervalBounds = TIME_INTERVAL_BOUNDS[funnelWindowIntervalUnit ?? FunnelConversionWindowTimeUnit.Day]

    return (
        <div className="flex items-center gap-2">
            <span className="flex whitespace-nowrap">
                Conversion window limit
                <Tooltip
                    title={
                        <>
                            <b>Recommended!</b> Limit to participants that converted within a specific time frame.
                            Participants that do not convert in this time frame will be considered as drop-offs.
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
                    value={funnelWindowInterval}
                    onChange={onFunnelWindowIntervalChange}
                />
                <Select
                    dropdownMatchSelectWidth={false}
                    value={funnelWindowIntervalUnit}
                    onChange={onFunnelWindowIntervalUnitChange}
                    options={options}
                />
            </div>
        </div>
    )
}
