import { useActions, useValues } from 'kea'
import { Suspense } from 'react'

import { themeLogic } from 'lib/logic/themeLogic'
import { inStorybook } from 'lib/utils/dom'
import { lazyWithRetry } from 'lib/utils/retryImport'

import { toolbarConfigLogic } from '~/toolbar/toolbarConfigLogic'

import { useShortcut } from '../Shortcuts/useShortcut'
import { mascotModeLogic } from './mascotModeLogic'
import { MascotModeConfig } from './types'

export const MascotModeRenderer =
    typeof window !== 'undefined'
        ? lazyWithRetry(() =>
              import('@hanzo/mascot-mode').then((module) => ({ default: module.MascotModeRenderer }))
          )
        : () => null

export const getMascotModeAssetsUrl = (): string => {
    let path = `/static/mascot-mode`
    const toolbarAPIUrl = toolbarConfigLogic.findMounted()?.values.uiHost

    if (inStorybook()) {
        // Nothing to do
    } else if (toolbarAPIUrl) {
        path = `${toolbarAPIUrl}${path}`
    } else if (window.location.hostname !== 'localhost') {
        path = `${window.location.origin}${path}`
    }

    return path
}

export type MascotModeProps = {
    enabledOverride?: boolean
}

export function MascotMode({ enabledOverride }: MascotModeProps): JSX.Element | null {
    const { mascotModeEnabled, mascotConfig } = useValues(mascotModeLogic)
    const { setMascotMode, setMascotModeEnabled, toggleMascotMode } = useActions(mascotModeLogic)
    const { isDarkModeOn } = useValues(themeLogic)

    const enabled = enabledOverride ?? mascotModeEnabled

    const config: MascotModeConfig = {
        assetsUrl: getMascotModeAssetsUrl(),
        // Seed the actor so it spawns with the user's options (e.g. ai_enabled / "free to roam")
        // already applied, instead of defaulting to roaming until the first syncGame corrects it.
        state: { options: mascotConfig.actor_options },
        platforms: {
            selector:
                '.border, .border-t, .Button--primary, .Button--secondary:not(.Button--status-alt:not(.Button--active)), .Input, .Select, .Table, .Switch--bordered, .Banner',
            viewportPadding: {
                top: 100,
            },
        },
        onQuit: (game) => {
            game.getAllMascots().forEach((mascot) => {
                mascot.updateSprite('wave', {
                    reset: true,
                    loop: false,
                })
            })

            setTimeout(() => {
                setMascotModeEnabled(false)
            }, 1000)
        },
    }

    useShortcut({
        name: 'ToggleMascotMode',
        keybind: [],
        intent: 'Toggle mascot mode',
        interaction: 'function',
        callback: toggleMascotMode,
    })

    return typeof window !== 'undefined' && enabled ? (
        <Suspense fallback={<span>Loading...</span>}>
            <MascotModeRenderer
                config={config}
                onGameReady={(game) => setMascotMode(game)}
                style={{
                    position: 'fixed',
                    zIndex: 999998,
                }}
                theme={isDarkModeOn ? 'dark' : 'light'}
            />
        </Suspense>
    ) : null
}
