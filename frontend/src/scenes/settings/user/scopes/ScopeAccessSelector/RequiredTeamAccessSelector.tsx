import { useEffect } from 'react'

import { Label } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { TeamSelector } from './TeamSelector'
import type { OrganizationOption, TeamOption } from './types'

type RequiredTeamAccessSelectorProps = {
    teams: TeamOption[]
    organizations: OrganizationOption[]
    autoSelectFirst?: boolean
}

export const RequiredTeamAccessSelector = ({
    teams,
    organizations,
    autoSelectFirst = false,
}: RequiredTeamAccessSelectorProps): JSX.Element => {
    return (
        <div className="flex flex-col gap-2">
            <Label>Select project</Label>
            <p className="text-sm text-muted mb-2">This application requires access to a specific project.</p>
            <Field name="scoped_teams">
                {({ value, onChange }) => {
                    const arrayValue = Array.isArray(value) ? value : []

                    // eslint-disable-next-line react-hooks/rules-of-hooks -- effect lives in a Field render prop, which is always invoked
                    useEffect(() => {
                        if (autoSelectFirst && arrayValue.length === 0 && teams && teams.length > 0) {
                            onChange([teams[0].id])
                        }
                        // eslint-disable-next-line react-hooks/exhaustive-deps -- autoSelectFirst is a reactive prop; keep it so the effect re-runs if it changes
                    }, [autoSelectFirst, arrayValue.length, onChange])

                    return (
                        <TeamSelector
                            teams={teams || []}
                            organizations={organizations}
                            mode="single"
                            value={arrayValue.length > 0 ? [String(arrayValue[0])] : []}
                            onChange={(val: string[]) => onChange(val.length > 0 ? [parseInt(val[0])] : [])}
                        />
                    )
                }}
            </Field>
        </div>
    )
}
