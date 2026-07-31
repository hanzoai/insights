import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { Switch } from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { Button } from 'lib/elements/Button'
import { teamLogic } from 'scenes/teamLogic'

import { AccessControlLevel, AccessControlResourceType } from '~/types'

export function WebAnalyticsEnablePreAggregatedTables(): JSX.Element {
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam } = useValues(teamLogic)

    const savedSetting = currentTeam?.web_analytics_pre_aggregated_tables_enabled
    const [enableNewQueryEngine, setEnableNewQueryEngine] = useState<boolean>(savedSetting ?? false)

    const handleSave = (): void => {
        updateCurrentTeam({ web_analytics_pre_aggregated_tables_enabled: enableNewQueryEngine })
    }

    return (
        <>
            <AccessControlAction
                resourceType={AccessControlResourceType.WebAnalytics}
                minAccessLevel={AccessControlLevel.Editor}
            >
                <Switch checked={enableNewQueryEngine} onChange={(enabled) => setEnableNewQueryEngine(enabled)} />
            </AccessControlAction>
            <div className="mt-4">
                <AccessControlAction
                    resourceType={AccessControlResourceType.WebAnalytics}
                    minAccessLevel={AccessControlLevel.Editor}
                >
                    <Button
                        type="primary"
                        onClick={handleSave}
                        disabledReason={enableNewQueryEngine === savedSetting ? 'No changes to save' : undefined}
                    >
                        Save
                    </Button>
                </AccessControlAction>
            </div>
        </>
    )
}
