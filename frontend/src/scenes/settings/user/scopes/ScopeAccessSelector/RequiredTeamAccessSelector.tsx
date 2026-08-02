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

// A component, not the Field render prop itself, because it holds a hook. A
// render prop is called during the parent's render but is not a component, so
// the hook belonged to RequiredTeamAccessSelector -- and any render where Field
// declined to call its child changed that hook count and crashed the render
// with "rendered more hooks than during the previous render".
type ScopedTeamFieldProps = RequiredTeamAccessSelectorProps & {
    value: unknown
    onChange: (value: TeamOption['id'][]) => void
}

const ScopedTeamField = ({
    value,
    onChange,
    teams,
    organizations,
    autoSelectFirst,
}: ScopedTeamFieldProps): JSX.Element => {
    const arrayValue = Array.isArray(value) ? value : []

    useEffect(() => {
        if (autoSelectFirst && arrayValue.length === 0 && teams && teams.length > 0) {
            onChange([teams[0].id])
        }
    }, [autoSelectFirst, teams, arrayValue.length, onChange])

    return (
        <TeamSelector
            teams={teams || []}
            organizations={organizations}
            mode="single"
            value={arrayValue.length > 0 ? [String(arrayValue[0])] : []}
            onChange={(val: string[]) => onChange(val.length > 0 ? [parseInt(val[0])] : [])}
        />
    )
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
                {({ value, onChange }) => (
                    <ScopedTeamField
                        value={value}
                        onChange={onChange}
                        teams={teams}
                        organizations={organizations}
                        autoSelectFirst={autoSelectFirst}
                    />
                )}
            </Field>
        </div>
    )
}
