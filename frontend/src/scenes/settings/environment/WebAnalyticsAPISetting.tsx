import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { Switch } from '@hanzo/elements'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { Button } from 'lib/elements/Button'
import { teamLogic } from 'scenes/teamLogic'

export function WebAnalyticsEnablePreAggregatedTables(): JSX.Element {
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam } = useValues(teamLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    const savedSetting = currentTeam?.web_analytics_pre_aggregated_tables_enabled
    const [enableNewQueryEngine, setEnableNewQueryEngine] = useState<boolean>(savedSetting ?? false)

    const handleSave = (): void => {
        updateCurrentTeam({ web_analytics_pre_aggregated_tables_enabled: enableNewQueryEngine })
    }

    return (
        <>
            <Switch
                checked={enableNewQueryEngine}
                onChange={(enabled) => setEnableNewQueryEngine(enabled)}
                disabledReason={restrictedReason}
            />
            <div className="mt-4">
                <Button
                    type="primary"
                    onClick={handleSave}
                    disabledReason={enableNewQueryEngine === savedSetting ? 'No changes to save' : restrictedReason}
                >
                    Save
                </Button>
            </div>
        </>
    )
}
