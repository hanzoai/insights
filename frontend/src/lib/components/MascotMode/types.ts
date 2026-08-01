import type {
    MascotActor as _MascotActor,
    MascotActorOptions as _MascotActorOptions,
    MascotModeConfig as _MascotModeConfig,
    MascotModeInterface as _MascotModeInterface,
} from '@hanzo/mascot-mode'

// NOTE: For whatever reason, kea-typegen can't navigate the exported class, so we need to do this
export interface MascotModeInterface extends _MascotModeInterface {}
export interface MascotActor extends _MascotActor {}
export interface MascotModeConfig extends _MascotModeConfig {}
export interface MascotActorOptions extends _MascotActorOptions {}
