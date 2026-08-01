import { useActions, useValues } from 'kea'

import { Checkbox } from '@hanzo/elements'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'

import { experimentsConfigLogic } from './experimentsConfigLogic'

export function DefaultCupedEnabled(): JSX.Element | null {
    const { experimentsConfig, experimentsConfigLoading } = useValues(experimentsConfigLogic)
    const { updateExperimentsConfig } = useActions(experimentsConfigLogic)

    const restrictionReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    return (
        <Checkbox
            label="Enable CUPED by default"
            checked={experimentsConfig?.default_cuped_enabled ?? false}
            onChange={(checked) => {
                updateExperimentsConfig({ default_cuped_enabled: checked })
            }}
            disabled={!!restrictionReason || experimentsConfigLoading}
        />
    )
}
