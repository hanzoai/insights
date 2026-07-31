import { InputSelect } from '@hanzo/elements'

import type { OrganizationSelectorProps } from './types'
import { createOrganizationOption } from './utils'

export const OrganizationSelector = ({
    organizations,
    mode,
    value,
    onChange,
}: OrganizationSelectorProps): JSX.Element => (
    <InputSelect
        mode={mode}
        data-attr="organizations"
        value={value}
        onChange={onChange}
        options={organizations.map((org) => createOrganizationOption(org)) ?? []}
        loading={organizations === undefined}
        placeholder={mode === 'single' ? 'Select an organization...' : 'Select organizations...'}
    />
)
