import './Modal.scss'

import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import Modal from 'react-modal'

import { IconX } from '@hanzo/icons'

import { KeyboardShortcut } from 'lib/components/KeyboardShortcut/KeyboardShortcut'
import { useFloatingContainer } from 'lib/hooks/useFloatingContainerContext'
import { Button } from 'lib/elements/Button'

import { Tooltip } from '../Tooltip'

interface ModalInnerProps {
    children?: React.ReactNode
    className?: string
}

export interface ModalContentProps extends ModalInnerProps {
    embedded?: boolean
}

export interface ModalProps {
    children?: React.ReactNode
    isOpen?: boolean
    onClose?: () => void
    onAfterClose?: () => void
    width?: number | string
    maxWidth?: number | string
    inline?: boolean
    title?: React.ReactNode
    description?: React.ReactNode
    footer?: React.ReactNode
    /** When enabled, the modal content will only include children allowing greater customisation */
    simple?: boolean
    closable?: boolean
    hideCloseButton?: boolean
    /** If there is unsaved input that's not persisted, the modal can't be closed closed on overlay click. */
    hasUnsavedInput?: boolean
    /** Expands the modal to fill the entire screen */
    fullScreen?: boolean
    /**
     * A modal launched from a popover can appear behind the popover. This allows you to force the modal to appear above the popover.
     * */
    forceAbovePopovers?: boolean
    contentRef?: React.RefCallback<HTMLDivElement>
    overlayRef?: React.RefCallback<HTMLDivElement>
    'data-attr'?: string
    /**
     * some components need more fine control of the z-index
     * they can push a specific value to control their position in the stacking order
     */
    zIndex?: '1161' | '1162' | '1166' | '1167' | '1168' | '1169'
    className?: string
    overlayClassName?: string
}

export const ModalHeader = ({ children, className }: ModalInnerProps): JSX.Element => {
    return <header className={clsx('Modal__header', className)}>{children}</header>
}

export const ModalFooter = ({ children, className }: ModalInnerProps): JSX.Element => {
    return <footer className={clsx('Modal__footer', className)}>{children}</footer>
}

export const ModalContent = ({ children, className, embedded = false }: ModalContentProps): JSX.Element => {
    return (
        <section className={clsx('Modal__content', embedded && 'Modal__content--embedded', className)}>
            {children}
        </section>
    )
}

export function Modal({
    width,
    maxWidth,
    children,
    isOpen = true,
    onClose,
    onAfterClose,
    title,
    description,
    footer,
    inline,
    simple,
    closable = true,
    hasUnsavedInput,
    fullScreen = false,
    forceAbovePopovers = false,
    contentRef,
    overlayRef,
    hideCloseButton = false,
    'data-attr': dataAttr,
    zIndex,
    className,
    overlayClassName,
}: ModalProps): JSX.Element {
    const nodeRef = useRef(null)
    const [ignoredOverlayClickCount, setIgnoredOverlayClickCount] = useState(0)

    useEffect(() => setIgnoredOverlayClickCount(0), [hasUnsavedInput]) // Reset when there no longer is unsaved input

    const modalContent = (
        <div ref={nodeRef} className="Modal__container" data-attr={dataAttr}>
            {closable &&
                !hideCloseButton && (
                    // The key causes the div to be re-rendered, which restarts the animation,
                    // providing immediate visual feedback on click
                    <div
                        key={ignoredOverlayClickCount}
                        className={clsx(
                            'Modal__close',
                            ignoredOverlayClickCount > 0 && 'Modal__close--highlighted'
                        )}
                    >
                        <Tooltip
                            visible={!!ignoredOverlayClickCount || undefined}
                            title={
                                ignoredOverlayClickCount ? (
                                    <>
                                        You have unsaved input that will be discarded.
                                        <br />
                                        Use the <IconX /> button to close explicitly.
                                    </>
                                ) : (
                                    <>
                                        Close <KeyboardShortcut escape />
                                    </>
                                )
                            }
                        >
                            <Button
                                icon={<IconX />}
                                size="small"
                                onClick={onClose}
                                aria-label="close"
                                onMouseEnter={() => setIgnoredOverlayClickCount(0)}
                            />
                        </Tooltip>
                    </div>
                )}

            <div className="Modal__layout">
                {simple ? (
                    children
                ) : (
                    <>
                        {title ? (
                            <ModalHeader>
                                <h3>{title}</h3>
                                {description ? (
                                    typeof description === 'string' ? (
                                        <p>{description}</p>
                                    ) : (
                                        description
                                    )
                                ) : null}
                            </ModalHeader>
                        ) : null}

                        {children ? <ModalContent>{children}</ModalContent> : null}
                        {footer ? <ModalFooter>{footer}</ModalFooter> : null}
                    </>
                )}
            </div>
        </div>
    )

    width = !fullScreen ? width : undefined
    maxWidth = !fullScreen ? maxWidth : undefined
    const floatingContainer = useFloatingContainer()

    return inline ? (
        // eslint-disable-next-line react/forbid-dom-props
        <div className="Modal ReactModal__Content--after-open" style={{ width, maxWidth }}>
            {modalContent}
        </div>
    ) : (
        // eslint-disable-next-line react/forbid-elements
        <Modal
            isOpen={isOpen}
            onRequestClose={(e) => {
                if (hasUnsavedInput && e.type === 'click') {
                    // Only ignore clicks, not Esc
                    setIgnoredOverlayClickCount(ignoredOverlayClickCount + 1)
                } else {
                    onClose?.()
                }
            }}
            shouldCloseOnOverlayClick={closable}
            shouldCloseOnEsc={closable}
            onAfterClose={onAfterClose}
            closeTimeoutMS={250}
            className={clsx('Modal', fullScreen && 'Modal--fullscreen', className)}
            overlayClassName={clsx(
                'Modal__overlay',
                zIndex && `Modal__overlay--z-${zIndex}`,
                forceAbovePopovers && 'Modal__overlay--force-modal-above-popovers',
                overlayClassName
            )}
            style={{
                content: {
                    width: width,
                    maxWidth,
                },
            }}
            // Aria-hide the app behind the modal only when the app root exists. Without it
            // (jsdom tests, embedded contexts) there is nothing to hide that doesn't also
            // contain the modal portal itself — hiding `document.body` would remove the modal
            // from the accessibility tree too.
            appElement={document.getElementById('root') ?? document.body}
            ariaHideApp={document.getElementById('root') !== null}
            contentRef={contentRef}
            overlayRef={overlayRef}
            parentSelector={floatingContainer ? () => floatingContainer : undefined}
        >
            {modalContent}
        </Modal>
    )
}

Modal.Header = ModalHeader
Modal.Footer = ModalFooter
Modal.Content = ModalContent
