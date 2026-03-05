// Hedgehog mode removed — stub kept for import compatibility
import { actions, kea, path, reducers, selectors } from 'kea'

import { HedgehogConfig, MinimalHedgehogConfig } from '~/types'

import type { hedgehogModeLogicType } from './hedgehogModeLogicType'

export const hedgehogModeLogic = kea<hedgehogModeLogicType>([
    path(['hedgehog', 'hedgehogModeLogic']),
    actions({
        setHedgehogMode: (_hedgeHogMode: any) => ({ hedgeHogMode: _hedgeHogMode }),
        setHedgehogModeEnabled: (_enabled: boolean) => ({ enabled: _enabled }),
        toggleHedgehogMode: true,
        loadRemoteConfig: true,
        loadRemoteConfigSuccess: (_config: any) => ({ remoteConfig: _config }),
        updateRemoteConfig: (_config: Partial<HedgehogConfig>) => ({ config: _config }),
        setRemoteConfigUpdateDisabled: (_disabled: boolean) => ({ disabled: _disabled }),
        syncGame: true,
        syncFromState: true,
    }),
    reducers(() => ({
        hedgehogMode: [
            null as any,
            {
                setHedgehogMode: (_, { hedgeHogMode }: any) => hedgeHogMode,
            },
        ],
        remoteConfig: [
            null as Partial<HedgehogConfig> | null,
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
        hedgehogConfig: [
            (s) => [s.remoteConfig],
            (_remoteConfig): HedgehogConfig => ({
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
        hedgehogModeEnabled: [
            (s) => [s.hedgehogConfig],
            (_hedgehogConfig): boolean => false,
        ],
        minimalHedgehogConfig: [
            (s) => [s.hedgehogConfig],
            (_hedgehogConfig): MinimalHedgehogConfig => ({
                use_as_profile: false,
                color: null,
                skin: undefined,
                accessories: [],
            }),
        ],
    }),
])
