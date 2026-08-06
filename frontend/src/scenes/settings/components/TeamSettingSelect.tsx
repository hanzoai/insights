import { useActions, useValues } from 'kea'

import { Select, SelectOption } from 'lib/elements/Select'
import { teamLogic } from 'scenes/teamLogic'

import { TeamType } from '~/types'

export function TeamSettingSelect<T extends string | number>({
    field,
    options,
    defaultValue,
    disabledReason,
}: {
    field: keyof TeamType
    options: SelectOption<T>[]
    defaultValue: T
    disabledReason?: string | null
}): JSX.Element {
    const { currentTeam, currentTeamLoading } = useValues(teamLogic)
    const { updateCurrentTeam } = useActions(teamLogic)

    const currentValue = currentTeam?.[field] != null ? (currentTeam[field] as T) : defaultValue

    const handleChange = (value: T | null): void => {
        if (value === null) {
            return
        }
        updateCurrentTeam({ [field]: value } as Partial<TeamType>)
    }

    return (
        <Select
            value={currentValue}
            onChange={handleChange}
            options={options}
            disabledReason={currentTeamLoading ? 'Loading...' : disabledReason}
        />
    )
}
