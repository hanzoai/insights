import { useActions, useValues } from 'kea'
import insights from '@hanzo/insights'
import { useState } from 'react'

import { Tag } from '@hanzo/elements'

import { Button } from 'lib/elements/Button'
import { Radio, RadioOption } from 'lib/elements/Radio'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'
import { teamLogic } from 'scenes/teamLogic'

import { InsightsQLQueryModifiers } from '~/queries/schema/schema-general'

type PoEMode = NonNullable<InsightsQLQueryModifiers['personsOnEventsMode']>

const POE_OPTIONS: RadioOption<PoEMode>[] = [
    {
        value: 'person_id_override_properties_on_events',
        label: (
            <span className="inline-flex items-center gap-1.5">
                Use user properties from the time of the event<Tag>RECOMMENDED</Tag>
            </span>
        ),
        description: (
            <>
                Fast queries. If the user property is updated, query results on past data <em>won't</em> change.
            </>
        ),
    },
    {
        value: 'person_id_override_properties_joined',
        label: 'Use user properties as of running the query',
        description: (
            <>
                Slower queries. If the user property is updated, query results on past data <em>will</em> change
                accordingly.
            </>
        ),
    },
    {
        value: 'person_id_no_override_properties_on_events',
        label: 'Use user IDs and user properties from the time of the event',
        description: (
            <>
                Fastest queries,{' '}
                <span className="underline">but funnels and unique user counts will be inaccurate</span>. If the user
                property is updated, query results on past data <em>won't</em> change.
            </>
        ),
    },
]

export function PersonsOnEvents(): JSX.Element {
    const { updateCurrentTeam } = useActions(teamLogic)
    const { reportPoEModeUpdated } = useActions(eventUsageLogic)
    const { currentTeam } = useValues(teamLogic)
    const savedPoEMode: PoEMode =
        currentTeam?.modifiers?.personsOnEventsMode ?? currentTeam?.default_modifiers?.personsOnEventsMode ?? 'disabled'
    const [poeMode, setPoeMode] = useState<PoEMode>(savedPoEMode)

    const handleChange = (mode: PoEMode): void => {
        updateCurrentTeam({ modifiers: { ...currentTeam?.modifiers, personsOnEventsMode: mode } })
        insights.capture('user changed personsOnEventsMode setting', { personsOnEventsMode: mode })
        reportPoEModeUpdated(mode)
    }

    return (
        <>
            <Radio value={poeMode} onChange={setPoeMode} options={POE_OPTIONS} />
            <div className="mt-4">
                <Button
                    type="primary"
                    onClick={() => handleChange(poeMode)}
                    disabledReason={poeMode === savedPoEMode ? 'No changes to save' : undefined}
                >
                    Save
                </Button>
            </div>
        </>
    )
}
