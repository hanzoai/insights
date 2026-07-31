import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { Button } from 'lib/elements/Button'
import { Radio, RadioOption } from 'lib/elements/Radio'
import { teamLogic } from 'scenes/teamLogic'

import { AccessControlLevel, AccessControlResourceType, CookielessServerHashMode } from '~/types'

const options: RadioOption<CookielessServerHashMode>[] = [
    {
        value: CookielessServerHashMode.Stateful,
        label: (
            <>
                <div>Enabled</div>
            </>
        ),
    },
    {
        value: CookielessServerHashMode.Stateless,
        label: (
            <>
                <div>Stateless</div>
            </>
        ),
    },
    {
        value: CookielessServerHashMode.Disabled,
        label: (
            <>
                <div>Disabled</div>
            </>
        ),
    },
]

const optionsToShowByDefault = [CookielessServerHashMode.Stateful, CookielessServerHashMode.Disabled]

export function CookielessServerHashModeSetting(): JSX.Element {
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam } = useValues(teamLogic)

    const savedSetting = currentTeam?.cookieless_server_hash_mode ?? CookielessServerHashMode.Disabled
    const [setting, setSetting] = useState<CookielessServerHashMode>(savedSetting)

    const handleChange = (newSetting: CookielessServerHashMode): void => {
        updateCurrentTeam({ cookieless_server_hash_mode: newSetting })
    }

    const optionsToShow = options.filter(
        (option) => optionsToShowByDefault.includes(option.value) || option.value === setting
    )

    return (
        <>
            <AccessControlAction
                resourceType={AccessControlResourceType.WebAnalytics}
                minAccessLevel={AccessControlLevel.Editor}
            >
                <Radio value={setting} onChange={setSetting} options={optionsToShow} />
            </AccessControlAction>
            <div className="mt-4">
                <AccessControlAction
                    resourceType={AccessControlResourceType.WebAnalytics}
                    minAccessLevel={AccessControlLevel.Editor}
                >
                    <Button
                        type="primary"
                        onClick={() => handleChange(setting)}
                        disabledReason={setting === savedSetting ? 'No changes to save' : undefined}
                    >
                        Save
                    </Button>
                </AccessControlAction>
            </div>
        </>
    )
}
