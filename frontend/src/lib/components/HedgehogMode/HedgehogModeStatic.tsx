// Hedgehog mode removed — stub kept for import compatibility

import { HedgehogConfig, MinimalHedgehogConfig } from '~/types'

export type HedgehogModeStaticProps = {
    size?: number | string
    config: HedgehogConfig | MinimalHedgehogConfig
    direction?: 'left' | 'right'
}

export function HedgehogModeStatic(_props: HedgehogModeStaticProps): JSX.Element | null {
    return null
}

export function HedgehogModeProfile(_props: HedgehogModeStaticProps): JSX.Element {
    return <></>
}
