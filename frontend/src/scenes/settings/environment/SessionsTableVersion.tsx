import { useActions } from 'kea'

import { RadioOption } from 'lib/elements/Radio'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'

import { InsightsQLQueryModifiers } from '~/queries/schema/schema-general'

import { TeamSettingRadio } from '../components/TeamSettingRadio'

type SessionTableVersionType = NonNullable<InsightsQLQueryModifiers['sessionTableVersion']>

const sessionTableVersionOptions: RadioOption<SessionTableVersionType>[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'v1', label: 'Version 1' },
    { value: 'v2', label: 'Version 2' },
    { value: 'v3', label: 'Version 3' },
]

export function SessionsTableVersion(): JSX.Element {
    const { reportSessionTableVersionUpdated } = useActions(eventUsageLogic)

    return (
        <TeamSettingRadio
            field="modifiers.sessionTableVersion"
            options={sessionTableVersionOptions}
            defaultValue="auto"
            onSave={reportSessionTableVersionUpdated}
        />
    )
}
