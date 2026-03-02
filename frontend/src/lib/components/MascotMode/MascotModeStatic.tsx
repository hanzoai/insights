// Mascot mode removed — stub kept for import compatibility

import { MascotConfig, MinimalMascotConfig } from '~/types'

export type MascotModeStaticProps = {
    size?: number | string
    config: MascotConfig | MinimalMascotConfig
    direction?: 'left' | 'right'
}

export function MascotModeStatic(_props: MascotModeStaticProps): JSX.Element | null {
    return null
}

export function MascotModeProfile(_props: MascotModeStaticProps): JSX.Element {
    return <></>
}
