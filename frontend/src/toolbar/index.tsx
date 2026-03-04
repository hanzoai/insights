import '~/styles'

import './styles.scss'

import { KeaPlugin, resetContext } from 'kea'
import { formsPlugin } from 'kea-forms'
import { loadersPlugin } from 'kea-loaders'
import { localStoragePlugin } from 'kea-localstorage'
import { routerPlugin } from 'kea-router'
import { subscriptionsPlugin } from 'kea-subscriptions'
import { waitForPlugin } from 'kea-waitfor'
import { windowValuesPlugin } from 'kea-window-values'
import type { Insights } from '~/lib/insights-browser'
import { createRoot } from 'react-dom/client'

import { disposablesPlugin } from '~/kea-disposables'
import { ToolbarApp } from '~/toolbar/ToolbarApp'
import { ToolbarParams } from '~/types'

interface InitKeaProps {
    state?: Record<string, any>
    routerHistory?: any
    routerLocation?: any
    beforePlugins?: KeaPlugin[]
}

const initKeaInToolbar = ({ routerHistory, routerLocation, beforePlugins }: InitKeaProps = {}): void => {
    const plugins = [
        ...(beforePlugins || []),
        disposablesPlugin,
        localStoragePlugin(),
        windowValuesPlugin({ window: window }),
        routerPlugin({
            history: routerHistory,
            location: routerLocation,
            urlPatternOptions: {
                // :TRICKY: What chars to allow in named segment values i.e. ":key"
                // in "/url/:key". Default: "a-zA-Z0-9-_~ %".
                segmentValueCharset: "a-zA-Z0-9-_~ %.@()!'|",
            },
        }),
        formsPlugin,
        loadersPlugin({
            onFailure({ error, reducerKey, actionKey }: { error: any; reducerKey: string; actionKey: string }) {
                console.error('toolbar fetch failed', error, reducerKey, actionKey)
            },
        }),
        subscriptionsPlugin,
        waitForPlugin,
    ]

    resetContext({
        plugins: plugins,
        createStore: {
            compose: (...funcs: any[]) => {
                if (funcs.length === 0) {
                    return <T,>(arg: T) => arg
                }
                if (funcs.length === 1) {
                    return funcs[0]
                }
                return funcs.reduce(
                    (a, b) =>
                        (...args: any) =>
                            a(b(...args))
                )
            },
        },
    })
}

const win = window as any

win['ph_load_toolbar'] = async function (toolbarParams: ToolbarParams, insights?: Insights) {
    // If insights and toolbarFlagsKey is present, fetch the feature flags from the backend
    if (insights && toolbarParams.toolbarFlagsKey) {
        const apiHost = insights.config?.api_host || toolbarParams.apiURL || window.location.origin
        const trimmedHost = apiHost.replace(/\/+$/, '')
        await fetch(`${trimmedHost}/api/user/get_toolbar_preloaded_flags?key=${toolbarParams.toolbarFlagsKey}`, {
            credentials: 'include',
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.featureFlags) {
                    insights.featureFlags.overrideFeatureFlags({ flags: data.featureFlags })
                } else {
                    console.error('[Toolbar Flags] Feature flags not found:', JSON.stringify(data))
                }
            })
            .catch((error) => {
                console.error('[Toolbar Flags] Error fetching toolbar feature flags:', error)
            })
    }

    initKeaInToolbar()
    const container = document.createElement('div')
    const root = createRoot(container)

    document.body.appendChild(container)

    if (!insights) {
        console.warn(
            '⚠️⚠️⚠️ Loaded toolbar via old version of insights-js that does not support feature flags. Please upgrade! ⚠️⚠️⚠️'
        )
    }

    root.render(
        <ToolbarApp
            {...toolbarParams}
            actionId={parseInt(String(toolbarParams.actionId))}
            experimentId={parseInt(String(toolbarParams.experimentId))}
            insights={insights}
        />
    )
}

/** @deprecated, use "ph_load_toolbar" instead */
win['ph_load_editor'] = win['ph_load_toolbar']
