import type { ExtensionContextValue } from '@stripe/ui-extension-sdk/context'
import { SettingsView } from '@stripe/ui-extension-sdk/ui'

import InsightsConnect from '../components/InsightsConnect'
import { getConstants } from '../constants'

const Settings = ({ environment }: ExtensionContextValue): JSX.Element => {
    return (
        <SettingsView>
            <InsightsConnect constants={getConstants(environment)} mode={environment.mode} />
        </SettingsView>
    )
}

export default Settings
