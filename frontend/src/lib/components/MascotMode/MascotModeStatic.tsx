import clsx from 'clsx'
import { Suspense, useMemo } from 'react'

import type { MascotActorOptions } from '@hanzo/mascot-mode'

import { lazyWithRetry } from 'lib/utils/retryImport'

import { MascotConfig, MinimalMascotConfig } from '~/types'

import { getMascotModeAssetsUrl } from './MascotMode'

const StaticMascot = lazyWithRetry(() =>
    import('@hanzo/mascot-mode').then((m) => ({ default: m.StaticMascot }))
)

export type MascotModeStaticProps = {
    size?: number | string
    config: MascotConfig | MinimalMascotConfig
    direction?: 'left' | 'right'
}

// Takes a range of options and renders a static mascot
export function MascotModeStatic({ config, size, direction = 'right' }: MascotModeStaticProps): JSX.Element | null {
    // TRICKY: The minimal version of the config on an org member has a smaller footprint so we need to parse the right ones here
    const actorOptions = useMemo((): MascotActorOptions => {
        if ('actor_options' in config) {
            return config.actor_options
        }
        return {
            id: JSON.stringify({ skin: config.skin, color: config.color, accessories: config.accessories }),
            skin: config.skin,
            color: config.color,
            accessories: config.accessories,
        }
    }, [config])

    return (
        <Suspense fallback={null}>
            <StaticMascot
                options={actorOptions}
                size={size}
                assetsUrl={getMascotModeAssetsUrl()}
                className={clsx('relative rendering-pixelated', direction === 'left' && '-scale-x-100')}
            />
        </Suspense>
    )
}

export function MascotModeProfile({ size, config }: MascotModeStaticProps): JSX.Element {
    return (
        <div
            className="overflow-hidden relative rounded-full"
            // eslint-disable-next-line react/forbid-dom-props
            style={{
                width: size,
                height: size,
            }}
        >
            <div className="absolute top-0 left-0 w-full h-full transform translate-x-[-15%] scale-[1.8]">
                <MascotModeStatic config={config} size="100%" />
            </div>
        </div>
    )
}
