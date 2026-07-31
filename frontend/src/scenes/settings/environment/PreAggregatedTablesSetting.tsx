import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { Button } from 'lib/elements/Button'
import { Switch } from 'lib/elements/Switch'
import { teamLogic } from 'scenes/teamLogic'

import { AccessControlLevel, AccessControlResourceType } from '~/types'

export function PreAggregatedTablesSetting(): JSX.Element {
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam } = useValues(teamLogic)

    const savedSetting = currentTeam?.modifiers?.useWebAnalyticsPreAggregatedTables
    const [useWebAnalyticsPreAggregatedTables, setUseWebAnalyticsPreAggregatedTables] = useState<boolean>(
        savedSetting ?? false
    )

    const handleChange = (mode: boolean): void => {
        updateCurrentTeam({ modifiers: { ...currentTeam?.modifiers, useWebAnalyticsPreAggregatedTables: mode } })
    }

    return (
        <>
            <AccessControlAction
                resourceType={AccessControlResourceType.WebAnalytics}
                minAccessLevel={AccessControlLevel.Editor}
            >
                <Switch
                    checked={useWebAnalyticsPreAggregatedTables}
                    onChange={(newValue) => setUseWebAnalyticsPreAggregatedTables(newValue)}
                />
            </AccessControlAction>
            <div className="mt-4">
                <AccessControlAction
                    resourceType={AccessControlResourceType.WebAnalytics}
                    minAccessLevel={AccessControlLevel.Editor}
                >
                    <Button
                        type="primary"
                        onClick={() => handleChange(useWebAnalyticsPreAggregatedTables)}
                        disabledReason={
                            useWebAnalyticsPreAggregatedTables === savedSetting ? 'No changes to save' : undefined
                        }
                    >
                        Save
                    </Button>
                </AccessControlAction>
            </div>
        </>
    )
}
