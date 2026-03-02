// Hedgehog mode removed — stub kept for import compatibility

import { HedgehogConfig } from '~/types'

export const sanitizeHedgehogConfig = (_config: Record<string, any>): HedgehogConfig => ({
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
