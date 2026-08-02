import { useActions } from 'kea'

import { IconX } from '@hanzo/icons'

import { ButtonPrimitive } from 'lib/ui/Button/ButtonPrimitives'
import { cn } from 'lib/utils/css-classes'

import { sidePanelStateLogic } from '../sidePanelStateLogic'

export type SidePanelPaneHeaderProps = {
    title?: string | JSX.Element
    children?: React.ReactNode
    className?: string
    onClose?: () => void
    showCloseButton?: boolean
}

export function SidePanelPaneHeader({
    children,
    title,
    className,
    onClose,
    showCloseButton = false,
}: SidePanelPaneHeaderProps): JSX.Element {
    const { closeSidePanel } = useActions(sidePanelStateLogic)

    return (
        <header
            className={cn(
                'scene-panel-pane-header border-b shrink-0 flex items-center justify-end',
                // Sticky mask: this header covers the side panel's own content, so it is
                // painted with the side panel's surface rather than the app ground. The
                // panel is bg-surface-secondary (SidePanel.tsx); bg-primary put a black
                // bar across the top of it in dark mode.
                'sticky top-0 h-[40px] bg-surface-secondary border-b-0 py-0 px-2 pb-px rounded justify-between m-0 mb-5 z-60 border border-primary/30',
                className
            )}
        >
            {title ? (
                <h3 className="flex items-center gap-1 font-semibold mb-0 truncate pr-1 pl-2 flex-none text-sm">
                    {title}
                </h3>
            ) : null}

            {children}

            {showCloseButton && (
                <ButtonPrimitive
                    onClick={() => {
                        closeSidePanel()
                        onClose?.()
                    }}
                >
                    <IconX className="text-tertiary size-3 group-hover:text-primary z-10" />
                </ButtonPrimitive>
            )}
        </header>
    )
}
