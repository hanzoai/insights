// Mascot mode removed — stub kept for import compatibility

export interface MascotModeInterface {
    stateManager?: any
    gameUI?: any
    getAllMascots?: () => any[]
}
export interface MascotActor {
    setOnFire?: (v: number) => void
    updateSprite?: (name: string, options?: any) => void
}
export interface MascotModeConfig {
    assetsUrl?: string
    platforms?: any
    onQuit?: (game: any) => void
}
export interface MascotActorOptions {
    id?: string
    player?: boolean
    color?: string | null
    skin?: string | null
    accessories?: string[]
    ai_enabled?: boolean
    interactions_enabled?: boolean
    controls_enabled?: boolean
}
