import { useEffect } from 'react'

import { Label } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { OrganizationSelector } from './OrganizationSelector'
import type { OrganizationOption } from './types'

type RequiredOrganizationAccessSelectorProps = {
    organizations: OrganizationOption[]
    autoSelectFirst?: boolean
}

export const RequiredOrganizationAccessSelector = ({
    organizations,
    autoSelectFirst = false,
}: RequiredOrganizationAccessSelectorProps): JSX.Element => {
    return (
        <div className="flex flex-col gap-2">
            <Label>Select organization</Label>
            <p className="text-sm text-muted mb-2">This application requires access to a specific organization.</p>
            <Field name="scoped_organizations">
                {({ value, onChange }) => {
                    const arrayValue = Array.isArray(value) ? value : []

                    // eslint-disable-next-line react-hooks/rules-of-hooks -- effect lives in a Field render prop, which is always invoked
                    useEffect(() => {
                        if (autoSelectFirst && arrayValue.length === 0 && organizations.length > 0) {
                            onChange([organizations[0].id])
                        }
                        // eslint-disable-next-line react-hooks/exhaustive-deps -- autoSelectFirst is a reactive prop; keep it so the effect re-runs if it changes
                    }, [autoSelectFirst, arrayValue.length, onChange])

                    return (
                        <OrganizationSelector
                            organizations={organizations}
                            mode="single"
                            value={arrayValue.length > 0 ? [arrayValue[0]] : []}
                            onChange={(val: string[]) => onChange(val.length > 0 ? [val[0]] : [])}
                        />
                    )
                }}
            </Field>
        </div>
    )
}
