import { useActions } from 'kea'

import { RadioOption } from 'lib/elements/Radio'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'

import { InsightsQLQueryModifiers } from '~/queries/schema/schema-general'

import { TeamSettingRadio } from '../components/TeamSettingRadio'

type PersonsJoinModeType = NonNullable<InsightsQLQueryModifiers['personsJoinMode']>

const personsJoinOptions: RadioOption<PersonsJoinModeType>[] = [
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

    return (
        <TeamSettingRadio
            field="modifiers.personsJoinMode"
            options={personsJoinOptions}
            defaultValue="inner"
            onSave={reportPersonsJoinModeUpdated}
        />
    )
}
