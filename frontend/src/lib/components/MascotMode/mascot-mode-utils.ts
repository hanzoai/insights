// Mascot mode removed — stub kept for import compatibility

import { MascotConfig } from '~/types'

export const sanitizeMascotConfig = (_config: Record<string, any>): MascotConfig => ({
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
})
