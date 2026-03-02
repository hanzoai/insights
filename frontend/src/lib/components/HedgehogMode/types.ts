// Hedgehog mode removed — stub kept for import compatibility

export interface HedgehogModeInterface {
    stateManager?: any
    gameUI?: any
    getAllHedgehogs?: () => any[]
}
export interface HedgehogActor {
    setOnFire?: (v: number) => void
    updateSprite?: (name: string, options?: any) => void
}
export interface HedgehogModeConfig {
    assetsUrl?: string
    platforms?: any
    onQuit?: (game: any) => void
}
export interface HedgehogActorOptions {
    id?: string
    player?: boolean
    color?: string | null
    skin?: string | null
    accessories?: string[]
    ai_enabled?: boolean
    interactions_enabled?: boolean
    controls_enabled?: boolean
}
