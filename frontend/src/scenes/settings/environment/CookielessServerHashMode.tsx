import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { Banner } from '@hanzo/elements'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { Button } from 'lib/elements/Button'
import { Radio, RadioOption } from 'lib/elements/Radio'
import { teamLogic } from 'scenes/teamLogic'

import { CookielessServerHashMode } from '~/types'

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
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    const savedSetting = currentTeam?.cookieless_server_hash_mode ?? CookielessServerHashMode.Disabled
    const [setting, setSetting] = useState<CookielessServerHashMode>(savedSetting)

    const handleChange = (newSetting: CookielessServerHashMode): void => {
        updateCurrentTeam({ cookieless_server_hash_mode: newSetting })
    }

    const optionsToShow = options
        .filter((option) => optionsToShowByDefault.includes(option.value) || option.value === setting)
        .map((option) => ({ ...option, disabledReason: restrictedReason ?? undefined }))

    return (
        <>
            <Banner type="info" className="mb-4">
                When Cookieless server hash mode is enabled, IP-based transformations like GeoIP enrichment and bot
                detection will not enrich events. The IP is hashed into the distinct ID and stripped before
                transformations run.
            </Banner>
            <Radio value={setting} onChange={setSetting} options={optionsToShow} />
            <div className="mt-4">
                <Button
                    type="primary"
                    onClick={() => handleChange(setting)}
                    disabledReason={setting === savedSetting ? 'No changes to save' : restrictedReason}
                >
                    Save
                </Button>
            </div>
        </>
    )
}
