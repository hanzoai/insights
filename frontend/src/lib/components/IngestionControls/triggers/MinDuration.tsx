import { Select } from '@hanzo/elements'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { SESSION_REPLAY_MINIMUM_DURATION_OPTIONS, TeamMembershipLevel } from 'lib/constants'

export function MinDurationTrigger({
    value,
    onChange,
}: {
    value: number | null | undefined
    onChange: (value: number | null | undefined) => void
}): JSX.Element {
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    return (
        <Select
            dropdownMatchSelectWidth={false}
            onChange={onChange}
            options={SESSION_REPLAY_MINIMUM_DURATION_OPTIONS}
            value={value}
            disabledReason={restrictedReason}
        />
    )
}
