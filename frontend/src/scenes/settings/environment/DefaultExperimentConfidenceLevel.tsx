import { useActions, useValues } from 'kea'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { Select } from 'lib/elements/Select'
import { CONFIDENCE_LEVEL_OPTIONS } from 'scenes/experiments/constants'

import { experimentsConfigLogic } from './experimentsConfigLogic'

export function DefaultExperimentConfidenceLevel(): JSX.Element {
    const { experimentsConfig, experimentsConfigLoading } = useValues(experimentsConfigLogic)
    const { updateExperimentsConfig } = useActions(experimentsConfigLogic)

    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    const currentValue = Number(experimentsConfig?.default_experiment_confidence_level ?? 0.95)

    const handleChange = (value: number | null): void => {
        if (value === null) {
            return
        }
        updateExperimentsConfig({ default_experiment_confidence_level: value })
    }

    return (
        <Select
            value={currentValue}
            onChange={handleChange}
            options={CONFIDENCE_LEVEL_OPTIONS}
            disabledReason={experimentsConfigLoading ? 'Loading...' : restrictedReason}
        />
    )
}
