import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { router } from 'kea-router'
import insights from 'insights-js'
import { ReactNode, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Root, createRoot } from 'react-dom/client'

import { ApiError } from 'lib/api-error'
import { Button, ButtonProps } from 'lib/elements/Button'
import { Modal, ModalProps } from 'lib/elements/Modal'
import { uuid } from 'lib/utils/dom'

import { DialogFormPropsType, lemonDialogLogic } from './lemonDialogLogic'

// A rejected await-submit keeps the dialog open so the user can retry. Capture only genuinely
// unexpected failures — not 4xx validation errors the user is expected to cause (e.g. a reserved
// name), which would otherwise flood the exception tracker on every validation failure.
function captureUnexpectedSubmitError(error: unknown): void {
    if (!(error instanceof ApiError) || (error.status ?? 500) >= 500) {
        insights.captureException(error)
    }
}

export type FormDialogProps = DialogFormPropsType &
    Omit<DialogProps, 'primaryButton' | 'secondaryButton' | 'content'> & {
        initialValues: Record<string, any>
        onSubmit: (values: Record<string, any>) => void | Promise<void>
        shouldAwaitSubmit?: boolean
        content?: ((isLoading: boolean) => ReactNode) | ReactNode
        /** Override props on the auto-generated submit button (e.g. status, children) */
        primaryButtonProps?: Partial<Pick<ButtonProps, 'children' | 'status' | 'type' | 'icon'>>
    }

export type DialogProps = Pick<
    ModalProps,
    'title' | 'description' | 'width' | 'maxWidth' | 'inline' | 'footer' | 'zIndex' | 'className'
> & {
    primaryButton?: ButtonProps | null
    secondaryButton?: ButtonProps | null
    tertiaryButton?: ButtonProps | null
    initialFormValues?: Record<string, any>
    content?: ((closeDialog: () => void) => ReactNode) | ReactNode
    onClose?: () => void
    onAfterClose?: () => void
    closeOnNavigate?: boolean
    shouldAwaitSubmit?: boolean
    isLoadingCallback?: (isLoading: boolean) => void
}

type DialogRef = {
    closeDialog: () => void
}

type DialogMethods = {
    open: (props: DialogProps) => void
    openForm: (props: FormDialogProps) => void
}

const DialogComponent = forwardRef<DialogRef, DialogProps>(function Dialog(
    {
        onAfterClose,
        onClose,
        primaryButton,
        tertiaryButton,
        secondaryButton,
        content,
        initialFormValues,
        closeOnNavigate = true,
        shouldAwaitSubmit = false,
        footer,
        isLoadingCallback,
        ...props
    }: DialogProps,
    ref
): JSX.Element {
    const { currentLocation } = useValues(router)
    const lastLocation = useRef(currentLocation.pathname)
    const [isOpen, setIsOpen] = useState(true)
    const [isLoading, setIsLoading] = useState(false)

    useImperativeHandle(
        ref,
        () => ({
            closeDialog: () => {
                setIsOpen(false)
            },
        }),
        []
    )

    primaryButton =
        primaryButton ||
        (primaryButton === null
            ? null
            : {
                  children: 'Okay',
                  disabledReason: shouldAwaitSubmit && isLoading ? 'Please wait...' : undefined,
              })
    if (primaryButton) {
        primaryButton.type = primaryButton.type || 'primary'
    }

    const renderButton = (button: ButtonProps | null | undefined): JSX.Element | null => {
        if (!button) {
            return null
        }

        const { preventClosing, ...buttonProps } = button

        return (
            <Button
                type="secondary"
                {...buttonProps}
                loading={button === primaryButton && shouldAwaitSubmit ? isLoading : undefined}
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onClick={async (e) => {
                    if (button === primaryButton && shouldAwaitSubmit) {
                        setIsLoading(true)
                        isLoadingCallback?.(true)
                        try {
                            // eslint-disable-next-line @typescript-eslint/await-thenable
                            await button.onClick?.(e)
                        } catch (error) {
                            // The submit handler is responsible for surfacing the error to the user
                            // (e.g. via a toast). Keep the dialog open so they can correct and retry,
                            // and capture genuine bugs so they aren't silently swallowed.
                            captureUnexpectedSubmitError(error)
                            return
                        } finally {
                            setIsLoading(false)
                            isLoadingCallback?.(false)
                        }
                    } else {
                        button.onClick?.(e)
                    }

                    if (!preventClosing) {
                        setIsOpen(false)
                    }
                }}
            />
        )
    }

    useEffect(() => {
        if (lastLocation.current !== currentLocation.pathname && closeOnNavigate) {
            setIsOpen(false)
        }
        lastLocation.current = currentLocation.pathname
    }, [currentLocation]) // oxlint-disable-line react-hooks/exhaustive-deps

    const handleClose = (): void => {
        setIsOpen(false)
    }

    // Resolve content, supporting both function and static content
    const resolvedContent = typeof content === 'function' ? content(handleClose) : content

    return (
        <Modal
            {...props}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onAfterClose={() => onAfterClose?.()}
            footer={
                footer ? (
                    footer
                ) : primaryButton || secondaryButton || tertiaryButton ? (
                    <>
                        <div className="flex-1">{renderButton(tertiaryButton)}</div>
                        {renderButton(secondaryButton)}
                        {renderButton(primaryButton)}
                    </>
                ) : null
            }
        >
            {resolvedContent}
        </Modal>
    )
})

export const FormDialog = ({
    initialValues = {},
    onSubmit,
    errors,
    content,
    primaryButtonProps,
    dialogKey,
    showErrorsOnTouch,
    ...props
}: FormDialogProps): JSX.Element => {
    const logicProps = { errors, dialogKey, showErrorsOnTouch }
    const logic = lemonDialogLogic(logicProps)
    const { form, isFormValid, formValidationErrors } = useValues(logic)
    const { setFormValues } = useActions(logic)
    const [isLoading, setIsLoading] = useState(false)

    const firstError = useMemo(
        () => Object.values(formValidationErrors).find((error) => Boolean(error)) as string,
        [formValidationErrors]
    )

    const primaryButton: DialogProps['primaryButton'] = {
        type: 'primary',
        children: 'Submit',
        ...primaryButtonProps,
        htmlType: 'submit',
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick: props.shouldAwaitSubmit ? async () => await onSubmit(form) : () => void onSubmit(form),
        disabledReason: !isFormValid ? firstError : undefined,
    }

    const secondaryButton: DialogProps['secondaryButton'] = {
        type: 'secondary',
        children: 'Cancel',
    }

    // Resolve content, supporting both function and static content
    const resolvedContent = typeof content === 'function' ? content(isLoading) : content

    useEffect(() => {
        setFormValues(initialValues)
    }, [setFormValues, initialValues])

    const ref = useRef<DialogRef>(null)

    return (
        <Form
            logic={lemonDialogLogic}
            props={logicProps}
            formKey="form"
            onKeyDown={
                props.shouldAwaitSubmit
                    ? async (e: React.KeyboardEvent<HTMLFormElement>): Promise<void> => {
                          if (e.key === 'Enter' && primaryButton?.htmlType === 'submit' && isFormValid) {
                              try {
                                  await onSubmit(form)
                              } catch (error) {
                                  // Mirror the button path: keep the dialog open on failure so the
                                  // user can correct and retry, and capture instead of leaking an
                                  // unhandled rejection.
                                  captureUnexpectedSubmitError(error)
                                  return
                              }
                              ref?.current?.closeDialog()
                          }
                      }
                    : (e: React.KeyboardEvent<HTMLFormElement>): void => {
                          if (e.key === 'Enter' && primaryButton?.htmlType === 'submit' && isFormValid) {
                              void onSubmit(form)
                              ref?.current?.closeDialog()
                          }
                      }
            }
        >
            <Dialog
                ref={ref}
                {...props}
                content={resolvedContent}
                primaryButton={primaryButton}
                secondaryButton={secondaryButton}
                isLoadingCallback={setIsLoading}
            />
        </Form>
    )
}

function createAndInsertRoot(): { root: Root; onDestroy: () => void } {
    const div = document.createElement('div')
    const root = createRoot(div)
    function destroy(): void {
        // defer the unmounting to avoid collisions with the rendering cycle
        setTimeout(() => {
            root.unmount()
            if (div.parentNode) {
                div.parentNode.removeChild(div)
            }
        }, 0)
    }

    document.body.appendChild(div)
    return { root, onDestroy: destroy }
}

export const Dialog = DialogComponent as typeof DialogComponent & DialogMethods

Dialog.open = (props: DialogProps) => {
    const { root, onDestroy } = createAndInsertRoot()
    root.render(<Dialog {...props} onAfterClose={onDestroy} />)
}

Dialog.openForm = (props: FormDialogProps) => {
    const { root, onDestroy } = createAndInsertRoot()
    // Each dialog gets a unique key so nested dialogs don't share the same
    // lemonDialogLogic instance and corrupt each other's form state.
    root.render(<FormDialog {...props} dialogKey={uuid()} onAfterClose={onDestroy} />)
}
