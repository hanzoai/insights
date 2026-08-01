import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { Button } from 'lib/elements/Button'
import { Switch } from 'lib/elements/Switch'
import { teamLogic } from 'scenes/teamLogic'

export function PreAggregatedTablesSetting(): JSX.Element {
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam } = useValues(teamLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    const savedSetting = currentTeam?.modifiers?.useWebAnalyticsPreAggregatedTables
    const [useWebAnalyticsPreAggregatedTables, setUseWebAnalyticsPreAggregatedTables] = useState<boolean>(
        savedSetting ?? false
    )

    const handleChange = (mode: boolean): void => {
        updateCurrentTeam({ modifiers: { ...currentTeam?.modifiers, useWebAnalyticsPreAggregatedTables: mode } })
    }

    return (
        <>
            <Switch
                checked={useWebAnalyticsPreAggregatedTables}
                onChange={(newValue) => setUseWebAnalyticsPreAggregatedTables(newValue)}
                disabledReason={restrictedReason}
            />
            <div className="mt-4">
                <Button
                    type="primary"
                    onClick={() => handleChange(useWebAnalyticsPreAggregatedTables)}
                    disabledReason={
                        useWebAnalyticsPreAggregatedTables === savedSetting ? 'No changes to save' : restrictedReason
                    }
                >
                    Save
                </Button>
            </div>
        </>
    )
}
