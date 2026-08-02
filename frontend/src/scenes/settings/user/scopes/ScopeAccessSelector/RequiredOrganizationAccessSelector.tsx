import { useEffect } from 'react'

import { Label } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { OrganizationSelector } from './OrganizationSelector'
import type { OrganizationOption } from './types'

type RequiredOrganizationAccessSelectorProps = {
    organizations: OrganizationOption[]
    autoSelectFirst?: boolean
}

type ScopedOrganizationFieldProps = RequiredOrganizationAccessSelectorProps & {
    value: unknown
    onChange: (value: OrganizationOption['id'][]) => void
}

// A component, not the Field render prop itself, because it holds a hook. A
// render prop is called during the parent's render but is not a component, so
// the hook belonged to RequiredOrganizationAccessSelector -- and any render
// where Field declined to call its child changed that hook count and crashed
// the render with "rendered more hooks than during the previous render".
const ScopedOrganizationField = ({
    value,
    onChange,
    organizations,
    autoSelectFirst,
}: ScopedOrganizationFieldProps): JSX.Element => {
    const arrayValue = Array.isArray(value) ? value : []

    useEffect(() => {
        if (autoSelectFirst && arrayValue.length === 0 && organizations.length > 0) {
            onChange([organizations[0].id])
        }
    }, [autoSelectFirst, organizations, arrayValue.length, onChange])

    return (
        <OrganizationSelector
            organizations={organizations}
            mode="single"
            value={arrayValue.length > 0 ? [arrayValue[0]] : []}
            onChange={(val: string[]) => onChange(val.length > 0 ? [val[0]] : [])}
        />
    )
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
                {({ value, onChange }) => (
                    <ScopedOrganizationField
                        value={value}
                        onChange={onChange}
                        organizations={organizations}
                        autoSelectFirst={autoSelectFirst}
                    />
                )}
            </Field>
        </div>
    )
}
