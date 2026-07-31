import clsx from 'clsx'
import { useActions, useValues } from 'kea'
import { useEffect, useRef } from 'react'

import { IconHome } from '@hanzo/icons'
import { Button, Select, Skeleton } from '@hanzo/elements'

import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'

import { themeLogic } from '../../themeLogic'
import { SidePanelPaneHeader } from '../components/SidePanelPaneHeader'
import { sidePanelDocsLogic } from './sidePanelDocsLogic'

export function SidePanelDocsSkeleton(): JSX.Element {
    return (
        <div className="absolute inset-0 p-4 deprecated-space-y-2">
            <Skeleton className="w-full h-10 mb-12" />
            <Skeleton className="w-1/3 h-8" />
            <Skeleton className="w-1/2 h-4 mb-10" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4 opacity-80" />
            <Skeleton className="w-full h-4 opacity-60" />
            <Skeleton className="w-full h-4 opacity-40" />
            <Skeleton className="w-1/2 h-4 opacity-20" />
        </div>
    )
}

export const SidePanelDocs = (): JSX.Element => {
    const ref = useRef<HTMLIFrameElement | null>(null)
    const logic = sidePanelDocsLogic({ iframeRef: ref })

    const { iframeSrc, iframeReady, currentUrl, activeMenuName, menuOptions } = useValues(logic)
    const { navigateToPage, unmountIframe, closeSidePanel } = useActions(logic)
    const { isDarkModeOn } = useValues(themeLogic)

    useEffect(() => {
        // it's ok to use we use a wildcard for the origin bc data isn't sensitive
        // nosemgrep: javascript.browser.security.wildcard-postmessage-configuration.wildcard-postmessage-configuration
        ref.current?.contentWindow?.postMessage(
            {
                type: 'theme-toggle',
                isDarkModeOn,
            },
            '*'
        )
    }, [isDarkModeOn, ref.current])

    useOnMountEffect(() => {
        window.addEventListener('beforeunload', unmountIframe)

        return () => {
            window.removeEventListener('beforeunload', unmountIframe)
            unmountIframe()
        }
    })

    return (
        <>
            <SidePanelPaneHeader>
                <Button
                    size="small"
                    sideIcon={<IconHome />}
                    type="secondary"
                    onClick={() => {
                        // it's ok to use we use a wildcard for the origin bc data isn't sensitive
                        // nosemgrep: javascript.browser.security.wildcard-postmessage-configuration.wildcard-postmessage-configuration
                        ref.current?.contentWindow?.postMessage(
                            {
                                type: 'navigate',
                                url: '/docs',
                            },
                            '*'
                        )
                    }}
                />

                {menuOptions && (
                    <Select
                        placeholder="Navigate"
                        dropdownMatchSelectWidth={false}
                        onChange={navigateToPage}
                        size="small"
                        value={activeMenuName ?? ''}
                        options={menuOptions.map(({ name, url }) => ({ label: name, value: url }))}
                        className="ml-1 shrink whitespace-nowrap overflow-hidden"
                    />
                )}

                <div className="flex-1" />
                <Button
                    size="small"
                    targetBlank
                    // We can't use the normal `to` property as that is intercepted to open this panel :D
                    onClick={() => {
                        window.open(currentUrl, '_blank')?.focus()
                        closeSidePanel()
                    }}
                >
                    Open in new tab
                </Button>
            </SidePanelPaneHeader>
            <div className="relative flex-1 overflow-hidden">
                <iframe
                    src={iframeSrc}
                    title="Docs"
                    className={clsx('w-full h-full', !iframeReady && 'hidden')}
                    ref={ref}
                    sandbox="allow-scripts allow-same-origin"
                />

                {!iframeReady && <SidePanelDocsSkeleton />}
            </div>
        </>
    )
}
