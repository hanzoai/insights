import { useActions, useValues } from 'kea'

import { Select } from '@hanzo/elements'

import { type Density, TYPE_STEPS, appearanceLogic } from './appearanceLogic'

const TYPE_LABELS: Record<number, string> = {
    0.85: 'Small',
    1: 'Default',
    1.15: 'Large',
    1.3: 'Larger',
}

const DENSITY_LABELS: Record<Density, string> = {
    compact: 'Compact',
    default: 'Default',
    comfortable: 'Comfortable',
}

export function TextSize(): JSX.Element {
    const { preference } = useValues(appearanceLogic)
    const { setType } = useActions(appearanceLogic)

    return (
        <Select
            options={[{ options: TYPE_STEPS.map((value) => ({ value, label: TYPE_LABELS[value] })) }]}
            value={preference.type ?? 1}
            onChange={setType}
        />
    )
}

export function Density(): JSX.Element {
    const { preference } = useValues(appearanceLogic)
    const { setDensity } = useActions(appearanceLogic)

    return (
        <Select
            options={[
                {
                    options: (Object.keys(DENSITY_LABELS) as Density[]).map((value) => ({
                        value,
                        label: DENSITY_LABELS[value],
                    })),
                },
            ]}
            value={preference.density ?? 'default'}
            onChange={setDensity}
        />
    )
}
