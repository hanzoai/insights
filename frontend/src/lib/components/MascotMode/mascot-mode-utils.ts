import { MascotConfig } from '~/types'

type MascotModeConfigV1 = {
    use_as_profile: boolean
    accessories: string[]
    enabled: boolean
    color: string | null
    skin?: string
    walking_enabled: boolean
    interactions_enabled: boolean
    controls_enabled: boolean
    party_mode_enabled: boolean
    fixed_direction?: 'left' | 'right'
}

const defaultConfig = (): MascotConfig => ({
    version: 2,
    enabled: false,
    use_as_profile: false,
    party_mode_enabled: false,
    actor_options: {
        color: null,
        accessories: [],
        ai_enabled: true,
        interactions_enabled: true,
        controls_enabled: true,
        id: 'player',
        player: true,
    },
})

export const sanitizeMascotConfig = (config: Record<string, any>): MascotConfig => {
    if (!config || typeof config !== 'object') {
        return defaultConfig()
    }

    if (config['version'] === 2) {
        return config as MascotConfig
    }

    // Otherwise we assume v1 and migrate
    const v1Config = config as MascotModeConfigV1

    return {
        version: 2,
        enabled: v1Config.enabled,
        use_as_profile: v1Config.use_as_profile,
        party_mode_enabled: v1Config.party_mode_enabled,
        actor_options: {
            id: 'player',
            player: true,
            color: v1Config.color as MascotConfig['actor_options']['color'] | null,
            skin: v1Config.skin as MascotConfig['actor_options']['skin'] | null,
            accessories: v1Config.accessories as MascotConfig['actor_options']['accessories'] | [],
            ai_enabled: v1Config.walking_enabled ?? true,
            interactions_enabled: v1Config.interactions_enabled ?? true,
            controls_enabled: v1Config.controls_enabled ?? true,
        },
    }
}
