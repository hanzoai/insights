import './Drawer.scss'

import clsx from 'clsx'
import { useValues } from 'kea'
import { useCallback, useId, useRef } from 'react'
import Modal from 'react-modal'

import { IconX } from '@hanzo/icons'

import { KeyboardShortcut } from 'lib/components/KeyboardShortcut/KeyboardShortcut'
import { Resizer } from 'lib/components/Resizer/Resizer'
import { ResizerLogicProps, resizerLogic } from 'lib/components/Resizer/resizerLogic'
import { useFloatingContainer } from 'lib/hooks/useFloatingContainerContext'
import { Button } from 'lib/elements/Button'

import { Tooltip } from '../Tooltip'

interface DrawerInnerProps {
    children?: React.ReactNode
    className?: string
}

interface DrawerBaseProps {
    children?: React.ReactNode
    isOpen?: boolean
    onClose?: () => void
    onAfterClose?: () => void
    width?: number | string
    /** Enable drag-to-resize on the left edge of the drawer */
    resizable?: boolean
    description?: React.ReactNode
    footer?: React.ReactNode
    hideCloseButton?: boolean
    /** Disables the backdrop blur and darkening on the overlay */
    overlayTransparent?: boolean
    forceAbovePopovers?: boolean
    contentRef?: React.RefCallback<HTMLDivElement>
    overlayRef?: React.RefCallback<HTMLDivElement>
    'data-attr'?: string
    className?: string
    overlayClassName?: string
}

/** Standard mode: title provides the accessible name via aria-labelledby */
interface DrawerWithTitle extends DrawerBaseProps {
    title: React.ReactNode
    simple?: false
    'aria-label'?: string
}

/** Simple mode: aria-label is required since there is no built-in title */
interface DrawerSimple extends DrawerBaseProps {
    title?: never
    simple: true
    'aria-label': string
}

export type DrawerProps = DrawerWithTitle | DrawerSimple

const DrawerHeader = ({ children, className }: DrawerInnerProps): JSX.Element => {
    return <header className={clsx('Drawer__header', className)}>{children}</header>
}

const DrawerFooter = ({ children, className }: DrawerInnerProps): JSX.Element => {
    return <footer className={clsx('Drawer__footer', className)}>{children}</footer>
}

const DrawerContent = ({ children, className }: DrawerInnerProps): JSX.Element => {
    return <section className={clsx('Drawer__content', className)}>{children}</section>
}

export function Drawer({
    width,
    children,
    isOpen = true,
    onClose,
    onAfterClose,
    title,
    description,
    footer,
    simple,
    hideCloseButton = false,
    resizable = false,
    overlayTransparent = false,
    forceAbovePopovers = false,
    contentRef,
    overlayRef,
    'aria-label': ariaLabel,
    'data-attr': dataAttr,
    className,
    overlayClassName,
}: DrawerProps): JSX.Element {
    const floatingContainer = useFloatingContainer()
    const titleId = useId()
    const descriptionId = useId()
    const hasVisibleTitle = !simple && !!title

    const containerRef = useRef<HTMLDivElement>(null)
    const resizerLogicProps: ResizerLogicProps = {
        containerRef,
        logicKey: 'lemon-drawer',
        persistent: false,
        placement: 'left',
    }
    const { desiredSize } = useValues(resizerLogic(resizerLogicProps))

    const effectiveWidth = resizable && desiredSize ? desiredSize : width

    const mergedContentRef = useCallback(
        (el: HTMLDivElement) => {
            ;(containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
            contentRef?.(el)
        },
        [contentRef]
    )

    const drawerContent = (
        <div className="Drawer__container" data-attr={dataAttr}>
            {!hideCloseButton && (
                <div className="Drawer__close">
                    <Tooltip
                        title={
                            <>
                                Close <KeyboardShortcut escape />
                            </>
                        }
                    >
                        <Button icon={<IconX />} size="small" onClick={onClose} aria-label="Close" />
                    </Tooltip>
                </div>
            )}

            <div className="Drawer__layout">
                {simple ? (
                    children
                ) : (
                    <>
                        {title ? (
                            <DrawerHeader>
                                <h3 id={titleId}>{title}</h3>
                                {description ? (
                                    typeof description === 'string' ? (
                                        <p id={descriptionId}>{description}</p>
                                    ) : (
                                        <div id={descriptionId}>{description}</div>
                                    )
                                ) : null}
                            </DrawerHeader>
                        ) : null}

                        {children ? <DrawerContent>{children}</DrawerContent> : null}
                        {footer ? <DrawerFooter>{footer}</DrawerFooter> : null}
                    </>
                )}
            </div>

            {resizable && <Resizer {...resizerLogicProps} />}
        </div>
    )

    return (
        // eslint-disable-next-line react/forbid-elements
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick
            shouldCloseOnEsc
            onAfterClose={onAfterClose}
            closeTimeoutMS={250}
            className={clsx('Drawer', className)}
            overlayClassName={clsx(
                'Drawer__overlay',
                overlayTransparent && 'Drawer__overlay--transparent',
                forceAbovePopovers && 'Drawer__overlay--force-above-popovers',
                overlayClassName
            )}
            style={{
                content: {
                    width: effectiveWidth,
                },
            }}
            contentLabel={!hasVisibleTitle ? ariaLabel : undefined}
            aria={{
                labelledby: hasVisibleTitle ? titleId : undefined,
                describedby: hasVisibleTitle && description ? descriptionId : undefined,
            }}
            appElement={document.getElementById('root') as HTMLElement}
            contentRef={mergedContentRef}
            overlayRef={overlayRef}
            parentSelector={floatingContainer ? () => floatingContainer : undefined}
        >
            {drawerContent}
        </Modal>
    )
}

Drawer.Header = DrawerHeader
Drawer.Footer = DrawerFooter
Drawer.Content = DrawerContent
