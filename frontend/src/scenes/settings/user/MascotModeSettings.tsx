import { useActions, useValues } from 'kea'
import { Suspense, useEffect, useState } from 'react'

import { Skeleton, Switch } from '@hanzo/elements'

import { getMascotModeAssetsUrl } from 'lib/components/MascotMode/MascotMode'
import { mascotModeLogic } from 'lib/components/MascotMode/mascotModeLogic'
import { lazyWithRetry } from 'lib/utils/retryImport'

const LazyMascotCustomization =
    typeof window !== 'undefined'
        ? lazyWithRetry(() =>
              import('@hanzo/mascot-mode').then((module) => ({ default: module.MascotCustomization }))
          )
        : () => null

const LazyMascotModeRendererContent =
    typeof window !== 'undefined'
        ? lazyWithRetry(() =>
              import('@hanzo/mascot-mode').then((module) => ({ default: module.MascotModeRendererContent }))
          )
        : () => null

let MascotModeClass: any = null

const getMascotMode = async (): Promise<any> => {
    if (!MascotModeClass && typeof window !== 'undefined') {
        const module = await import('@hanzo/mascot-mode')
        MascotModeClass = module.MascotMode
    }
    return MascotModeClass
}

export function MascotModeSettings(): JSX.Element {
    const { mascotConfig } = useValues(mascotModeLogic)
    const { updateRemoteConfig } = useActions(mascotModeLogic)

    if (typeof window === 'undefined') {
        return <Skeleton />
    }

    return (
        <>
            <div className="flex gap-2">
                <Switch
                    label="Enable mascot mode"
                    data-attr="mascot-mode-switch"
                    onChange={(checked) => updateRemoteConfig({ enabled: checked })}
                    checked={mascotConfig.enabled}
                    bordered
                />
                <Switch
                    label="Use as profile picture"
                    data-attr="mascot-profile-picture"
                    onChange={(checked) => updateRemoteConfig({ use_as_profile: checked })}
                    checked={mascotConfig.use_as_profile}
                    bordered
                />
            </div>

            <div className="border rounded mt-2 bg-surface-primary p-3">
                <Suspense fallback={<Skeleton className="w-full h-64" />}>
                    <LazyMascotModeRendererContent id="mascot-customization">
                        <MascotCustomizationWrapper
                            config={mascotConfig.actor_options}
                            setConfig={(config) => updateRemoteConfig({ actor_options: config })}
                        />
                    </LazyMascotModeRendererContent>
                </Suspense>
            </div>
        </>
    )
}

function MascotCustomizationWrapper({
    config,
    setConfig,
}: {
    config: any
    setConfig: (config: any) => void
}): JSX.Element {
    const [game, setGame] = useState<any>(null)

    useEffect(() => {
        void getMascotMode().then((MascotModeClass) => {
            if (MascotModeClass) {
                setGame(
                    new MascotModeClass({
                        assetsUrl: getMascotModeAssetsUrl(),
                    })
                )
            }
        })
    }, [])

    if (!game) {
        return <Skeleton className="w-full h-64" />
    }

    return (
        <Suspense fallback={<Skeleton className="w-full h-64" />}>
            <LazyMascotCustomization config={config} setConfig={setConfig} game={game} />
        </Suspense>
    )
}
