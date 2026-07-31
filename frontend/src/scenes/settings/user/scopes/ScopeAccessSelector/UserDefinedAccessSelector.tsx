import { Label } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { SegmentedButton } from 'lib/elements/SegmentedButton'

import { OrganizationSelector } from './OrganizationSelector'
import { TeamSelector } from './TeamSelector'
import type { AccessType, OrganizationOption, TeamOption } from './types'

type UserDefinedAccessSelectorProps = {
    accessType?: AccessType
    organizations: OrganizationOption[]
    teams?: TeamOption[]
}

export const UserDefinedAccessSelector = ({
    accessType,
    organizations,
    teams,
}: UserDefinedAccessSelectorProps): JSX.Element => {
    return (
        <div className="flex flex-col gap-2">
            <Field name="access_type" className="mt-4 mb-2">
                {({ value, onChange }) => (
                    <div className="flex flex-col gap-2 md:flex-row items-start md:items-center justify-between">
                        <Label>Organization & project access</Label>
                        <SegmentedButton
                            onChange={onChange}
                            value={value}
                            options={[
                                { label: 'All access', value: 'all' },
                                {
                                    label: 'Organizations',
                                    value: 'organizations',
                                },
                                {
                                    label: 'Projects',
                                    value: 'teams',
                                },
                            ]}
                            size="small"
                        />
                    </div>
                )}
            </Field>

            {accessType === 'all' ? (
                <p className="mb-0">This will allow access to all organizations and projects you're in.</p>
            ) : accessType === 'organizations' ? (
                <>
                    <p className="mb-2">
                        This will only allow access to selected organizations and all projects within them.
                    </p>

                    <Field name="scoped_organizations">
                        <OrganizationSelector organizations={organizations} mode="multiple" />
                    </Field>
                </>
            ) : accessType === 'teams' ? (
                <>
                    <p className="mb-2">This will only allow access to selected projects.</p>
                    <Field name="scoped_teams">
                        {({ value, onChange }) => (
                            <TeamSelector
                                teams={teams || []}
                                organizations={organizations}
                                mode="multiple"
                                value={value.map((x: number) => String(x))}
                                onChange={(val: string[]) => onChange(val.map((x) => parseInt(x)))}
                            />
                        )}
                    </Field>
                </>
            ) : null}
        </div>
    )
}
