import { useActions, useValues } from 'kea'
import { useMemo, useState } from 'react'

import { IconPlus } from '@hanzo/icons'
import { Button, Checkbox, Input } from '@hanzo/elements'

import { Dropdown } from 'lib/elements/Dropdown'
import { organizationLogic } from 'scenes/organizationLogic'
import { teamLogic } from 'scenes/teamLogic'

import { projectsGridLogic } from './projectsGridLogic'

export function ProjectsGridPicker(): JSX.Element {
    const { pickedTeamIds } = useValues(projectsGridLogic)
    const { setPickedTeamIds, resetPickedTeamIds } = useActions(projectsGridLogic)
    const { currentOrganization } = useValues(organizationLogic)
    const { currentTeamId } = useValues(teamLogic)

    const [search, setSearch] = useState('')

    const otherProjects = useMemo(
        () => (currentOrganization?.teams ?? []).filter((t) => t.id !== currentTeamId),
        [currentOrganization?.teams, currentTeamId]
    )

    const filteredProjects = useMemo(() => {
        if (!search.trim()) {
            return otherProjects
        }
        const needle = search.trim().toLowerCase()
        return otherProjects.filter((t) => t.name.toLowerCase().includes(needle))
    }, [otherProjects, search])

    const pickedSet = useMemo(() => new Set(pickedTeamIds), [pickedTeamIds])

    const togglePicked = (teamId: number): void => {
        if (pickedSet.has(teamId)) {
            setPickedTeamIds(pickedTeamIds.filter((id) => id !== teamId))
        } else {
            setPickedTeamIds([...pickedTeamIds, teamId])
        }
    }

    return (
        <Dropdown
            closeOnClickInside={false}
            overlay={
                <div className="w-72 flex flex-col gap-2">
                    <div className="-mx-2 px-2 pb-2 border-b border-border">
                        <Input
                            type="search"
                            value={search}
                            onChange={setSearch}
                            placeholder="Search projects"
                            fullWidth
                            autoFocus
                        />
                    </div>
                    <div className="max-h-72 overflow-y-auto -mx-2 px-2 flex flex-col gap-0.5">
                        {filteredProjects.length === 0 ? (
                            <div className="text-tertiary text-center py-4 text-xs">No projects found</div>
                        ) : (
                            filteredProjects.map((team) => (
                                <Checkbox
                                    key={team.id}
                                    checked={pickedSet.has(team.id)}
                                    onChange={() => togglePicked(team.id)}
                                    label={team.name}
                                    fullWidth
                                    className="px-2 py-1 rounded hover:bg-bg-3000"
                                />
                            ))
                        )}
                    </div>
                    {pickedTeamIds.length > 0 && (
                        <>
                            <div className="border-t border-border -mx-2" />
                            <Button
                                size="small"
                                type="tertiary"
                                onClick={() => resetPickedTeamIds()}
                                center
                                fullWidth
                            >
                                Reset
                            </Button>
                        </>
                    )}
                </div>
            }
        >
            <Button type="secondary" icon={<IconPlus />} data-attr="projects-grid-picker">
                Projects
                {pickedTeamIds.length > 0 && <span className="ml-1 text-tertiary">({pickedTeamIds.length})</span>}
            </Button>
        </Dropdown>
    )
}
