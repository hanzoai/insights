import { RadioOption } from 'lib/elements/Radio'

import { InsightsQLQueryModifiers } from '~/queries/schema/schema-general'

import { TeamSettingRadio } from '../components/TeamSettingRadio'

type SessionsV2JoinModeType = NonNullable<InsightsQLQueryModifiers['sessionsV2JoinMode']>

const sessionsV2JoinModeOptions: RadioOption<SessionsV2JoinModeType>[] = [
    { value: 'string', label: 'String' },
    { value: 'uuid', label: 'UUID' },
]

export function SessionsV2JoinModeSettings(): JSX.Element {
    return (
        <TeamSettingRadio
            field="modifiers.sessionsV2JoinMode"
            options={sessionsV2JoinModeOptions}
            defaultValue="string"
        />
    )
}
