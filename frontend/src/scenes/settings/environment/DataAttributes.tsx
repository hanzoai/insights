import { useActions, useValues } from 'kea'
import { useEffect, useState } from 'react'

import { Button, Skeleton } from '@hanzo/elements'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { InputSelect } from 'lib/elements/InputSelect/InputSelect'
import { teamLogic } from 'scenes/teamLogic'

export function DataAttributes(): JSX.Element {
    const { currentTeam, currentTeamLoading } = useValues(teamLogic)
    const { updateCurrentTeam } = useActions(teamLogic)
    const [value, setValue] = useState([] as string[])
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    useEffect(() => setValue(currentTeam?.data_attributes || []), [currentTeam])

    if (!currentTeam) {
        return <Skeleton />
    }

    return (
        <>
            <div className="deprecated-space-y-4 max-w-160">
                <InputSelect
                    mode="multiple"
                    allowCustomValues
                    onChange={(values: string[]) => setValue(values || [])}
                    value={value}
                    data-attr="data-attribute-select"
                    placeholder="data-attr, ..."
                    loading={currentTeamLoading}
                    disabled={currentTeamLoading || !!restrictedReason}
                />
                <Button
                    type="primary"
                    onClick={() =>
                        updateCurrentTeam({ data_attributes: value.map((s) => s.trim()).filter((a) => a) || [] })
                    }
                    disabledReason={restrictedReason}
                >
                    Save
                </Button>
            </div>
        </>
    )
}
