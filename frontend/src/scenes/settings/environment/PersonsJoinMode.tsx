import { useActions } from 'kea'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { RadioOption } from 'lib/elements/Radio'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'

import { InsightsQLQueryModifiers } from '~/queries/schema/schema-general'

import { TeamSettingRadio } from '../components/TeamSettingRadio'

type PersonsJoinModeType = NonNullable<InsightsQLQueryModifiers['personsJoinMode']>

const PERSONS_JOIN_OPTIONS: RadioOption<PersonsJoinModeType>[] = [
    {
        value: 'inner',
        label: (
            <>
                <div>Does an inner join</div>
                <div className="text-secondary">
                    This is the default. You want this one unless you know what you are doing.
                </div>
            </>
        ),
    },
    {
        value: 'left',
        label: (
            <>
                <div>Does a left join.</div>
                <div className="text-secondary">Experimental mode for personless events </div>
            </>
        ),
    },
]

export function PersonsJoinMode(): JSX.Element {
    const { reportPersonsJoinModeUpdated } = useActions(eventUsageLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })
    const personsJoinOptions = PERSONS_JOIN_OPTIONS.map((o) => ({
        ...o,
        disabledReason: restrictedReason ?? undefined,
    }))

    return (
        <TeamSettingRadio
            field="modifiers.personsJoinMode"
            options={personsJoinOptions}
            defaultValue="inner"
            onSave={reportPersonsJoinModeUpdated}
        />
    )
}
