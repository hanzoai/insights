import { cn } from 'lib/utils/css-classes'

interface SceneStickyBarProps {
    children: React.ReactNode
    className?: string
    showBorderBottom?: boolean
    hasSceneTitleSection?: boolean
}

export function SceneStickyBar({
    children,
    className,
    showBorderBottom = true,
    hasSceneTitleSection = true,
}: SceneStickyBarProps): JSX.Element {
    return (
        <div
            className={cn(
                // A sticky bar masks the content scrolling under it, so it must be painted
                // with the SAME value as the canvas it sits on. That value is
                // --scene-layout-background (Navigation.tsx): the raised surface by default,
                // dropping to the ground only for a scene with canvasBackground. bg-primary
                // hardcoded the ground branch, so on every scene but Notebook the bar was
                // black on a raised panel. The fallback covers render paths outside the app
                // shell (the exporter), where the var is unset and body is --color-bg-primary.
                'scene-sticky-bar @2xl/main-content:sticky z-20 bg-[var(--scene-layout-background,var(--color-bg-primary))] @2xl/main-content:top-[34px] space-y-2 py-2 -mx-4 px-4 rounded-t-xl',
                !hasSceneTitleSection && '@2xl/main-content:top-0',
                className,
                showBorderBottom && 'border-b'
            )}
        >
            {children}
        </div>
    )
}
