// Mascot mode removed — stub kept for import compatibility
import { actions, kea, path, reducers, selectors } from 'kea'

import { MascotConfig, MinimalMascotConfig } from '~/types'

import type { mascotModeLogicType } from './mascotModeLogicType'

export const mascotModeLogic = kea<mascotModeLogicType>([
    path(['mascot', 'mascotModeLogic']),
    actions({
        setMascotMode: (_mascotModeConfig: any) => ({ mascotModeConfig: _mascotModeConfig }),
        setMascotModeEnabled: (_enabled: boolean) => ({ enabled: _enabled }),
        toggleMascotMode: true,
        loadRemoteConfig: true,
        loadRemoteConfigSuccess: (_config: any) => ({ remoteConfig: _config }),
        updateRemoteConfig: (_config: Partial<MascotConfig>) => ({ config: _config }),
        setRemoteConfigUpdateDisabled: (_disabled: boolean) => ({ disabled: _disabled }),
        syncGame: true,
        syncFromState: true,
    }),
    reducers(() => ({
        mascotMode: [
            null as any,
            {
                setMascotMode: (_, { mascotModeConfig }: any) => mascotModeConfig,
            },
        ],
        remoteConfig: [
            null as Partial<MascotConfig> | null,
            {
                loadRemoteConfigSuccess: (_, { remoteConfig }: any) => remoteConfig,
            },
        ],
        remoteConfigUpdateDisabled: [
            false,
            {
                setRemoteConfigUpdateDisabled: (_, { disabled }: any) => disabled,
            },
        ],
    })),
    selectors({
        mascotConfig: [
            (s) => [s.remoteConfig],
            (_remoteConfig): MascotConfig => ({
                version: 2,
                enabled: false,
                use_as_profile: false,
                party_mode_enabled: false,
                actor_options: {
                    color: null,
                    accessories: [],
                    ai_enabled: false,
                    interactions_enabled: false,
                    controls_enabled: false,
                    id: 'player',
                    player: true,
                },
            }),
        ],
        mascotModeEnabled: [
            (s) => [s.mascotConfig],
            (_mascotConfig): boolean => false,
        ],
        minimalMascotConfig: [
            (s) => [s.mascotConfig],
            (_mascotConfig): MinimalMascotConfig => ({
                use_as_profile: false,
                color: null,
                skin: undefined,
                accessories: [],
            }),
        ],
    }),
])
