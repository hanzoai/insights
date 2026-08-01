import { useValues } from 'kea'

import { MascotMode } from 'lib/components/MascotMode/MascotMode'

import { toolbarLogic } from '~/toolbar/bar/toolbarLogic'

export function MascotButton(): JSX.Element | null {
    const { mascotModeEnabled, mascotModeAvailable } = useValues(toolbarLogic)

    if (!mascotModeAvailable) {
        return null
    }

    return <MascotMode enabledOverride={mascotModeEnabled} />
}
