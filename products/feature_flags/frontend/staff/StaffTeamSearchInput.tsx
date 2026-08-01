import { useActions, useValues } from 'kea'
import { useMemo } from 'react'

import { InputSelect, InputSelectOption } from 'lib/elements/InputSelect/InputSelect'

import { featureFlagsStaffToolsLogic, StaffTeamResult } from './featureFlagsStaffToolsLogic'

function teamOption(team: StaffTeamResult): InputSelectOption<number> {
    return {
        key: String(team.id),
        value: team.id,
        label: `${team.name} (#${team.id}) - ${team.organization_name}`,
    }
}

export function StaffTeamSearchInput(): JSX.Element {
    const { teamSearchResults, teamSearchResultsLoading, selectedTeamIds, selectedTeams } =
        useValues(featureFlagsStaffToolsLogic)
    const { searchTeams, setSelectedTeamIds } = useActions(featureFlagsStaffToolsLogic)

    // Include already-selected teams so their chips keep a readable label even after the
    // search results that surfaced them are gone.
    const options = useMemo(() => {
        const optionsById = new Map<number, InputSelectOption<number>>()
        for (const team of [...selectedTeams, ...teamSearchResults]) {
            optionsById.set(team.id, teamOption(team))
        }
        return Array.from(optionsById.values())
    }, [selectedTeams, teamSearchResults])

    return (
        <InputSelect<number>
            mode="multiple"
            placeholder="Search teams by name, id, project token, or organization"
            value={selectedTeamIds}
            options={options}
            loading={teamSearchResultsLoading}
            onInputChange={(query) => searchTeams({ query })}
            onChange={(teamIds) => setSelectedTeamIds(teamIds)}
            disableFiltering
        />
    )
}
