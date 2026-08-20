import type { App } from '@modelcontextprotocol/ext-apps'
import { Maximize2, Minimize2 } from 'lucide-react'
import { type ReactElement, type ReactNode, useCallback, useEffect, useState } from 'react'

import { Button } from '@hanzo/quill'

import { useToolResult, type UseToolResultOptions, type UseToolResultReturn } from '../hooks/useToolResult'

export interface AppWrapperProps<T> extends UseToolResultOptions {
    children: (result: UseToolResultReturn<T>) => ReactNode
}

function InsightsLogo({ size = 16 }: { size?: number }): ReactElement {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 67 67"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Hanzo Insights"
        >
            <path d="M22.21 67V44.6369H0V67H22.21Z" />
            <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" />
            <path d="M22.21 0H0V22.3184H22.21V0Z" />
            <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" />
            <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" />
        </svg>
    )
}

export function AppErrorState({ message }: { message: string }): ReactElement {
    useEffect(() => {
        console.error('[Insights MCP App] AppErrorState:', message)
    }, [message])

    return (
        <div className="flex flex-col items-center justify-center gap-3 h-[200px]">
            <InsightsLogo size={40} />
            <span className="text-xs text-destructive-foreground">{message}</span>
        </div>
    )
}

export function AppLoadingState(): ReactElement {
    return (
        <div className="flex flex-col items-center justify-center h-[200px]">
            <div className="[animation:loading__pulse_2s_ease-in-out_infinite]">
                <InsightsLogo size={40} />
            </div>
        </div>
    )
}

function ExpandButton({
    app,
    onDisplayModeChanged,
}: {
    app: App | null
    onDisplayModeChanged?: () => void
}): ReactElement | null {
    const [supportsFullscreen, setSupportsFullscreen] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        if (!app) {
            return
        }
        const ctx = app.getHostContext()
        const available = ctx?.availableDisplayModes ?? []
        if (available.includes('fullscreen')) {
            setSupportsFullscreen(true)
            setIsFullscreen(ctx?.displayMode === 'fullscreen')
        }
    }, [app])

    const handleToggle = useCallback(() => {
        if (!app) {
            return
        }
        const target = isFullscreen ? 'inline' : 'fullscreen'
        app.requestDisplayMode({ mode: target }).then((result) => {
            setIsFullscreen(result.mode === 'fullscreen')
            // Host needs time to resize the container after the mode switch.
            // Read dimensions immediately, then again after a short delay.
            onDisplayModeChanged?.()
            setTimeout(() => onDisplayModeChanged?.(), 200)
        })
    }, [app, isFullscreen, onDisplayModeChanged])

    if (!supportsFullscreen) {
        return null
    }

    return (
        <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleToggle}
            title={isFullscreen ? 'Exit fullscreen' : 'Expand'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Expand'}
        >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </Button>
    )
}

export function AppWrapper<T>({ children, ...options }: AppWrapperProps<T>): ReactElement {
    const toolResult = useToolResult<T>(options)
    const { data, isConnected, error, isCancelled, openLink, app, containerDimensions, refreshContainerDimensions } =
        toolResult

    const insightsUrl =
        data && typeof data === 'object' && '_insightsUrl' in data
            ? ((data as Record<string, unknown>)._insightsUrl as string | undefined)
            : undefined

    useEffect(() => {
        if (error) {
            console.error('[Insights MCP App] AppWrapper error:', error.message, error)
        }
    }, [error])

    const hasContent = !error && !isCancelled && isConnected && data

    const rootStyle: React.CSSProperties =
        containerDimensions?.height != null
            ? { height: containerDimensions.height }
            : containerDimensions?.maxHeight != null
              ? { maxHeight: containerDimensions.maxHeight }
              : { minHeight: '100%' }

    if (!hasContent) {
        const showError = error || isCancelled

        return (
            <div
                className="mx-auto flex w-full max-w-[960px] flex-col items-center justify-center gap-3"
                style={{
                    ...rootStyle,
                    ...(containerDimensions?.height == null ? { minHeight: 200 } : {}),
                }}
            >
                <div className={showError ? '' : '[animation:loading__pulse_4s_ease-in-out_infinite]'}>
                    <InsightsLogo size={40} />
                </div>
                {isCancelled && <span className="text-xs text-muted-foreground">Tool call was cancelled</span>}
                {error && !isCancelled && <span className="text-xs text-destructive-foreground">{error.message}</span>}
            </div>
        )
    }

    return (
        <div className="mx-auto flex w-full max-w-[960px] flex-col" style={rootStyle}>
            <div className="overflow-auto">{children(toolResult)}</div>
            <footer className="mt-auto flex items-center justify-between border-t px-3 py-1.5">
                <ExpandButton app={app} onDisplayModeChanged={refreshContainerDimensions} />
                <span className="ml-auto">
                    {insightsUrl ? (
                        <a
                            href={insightsUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => {
                                e.preventDefault()
                                openLink(insightsUrl)
                            }}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <InsightsLogo size={16} />
                            <span>View in Insights</span>
                        </a>
                    ) : (
                        <InsightsLogo size={16} />
                    )}
                </span>
            </footer>
        </div>
    )
}
