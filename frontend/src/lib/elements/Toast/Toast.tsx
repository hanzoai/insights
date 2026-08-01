// react-toastify's `toast` is aliased because this file exports its own: the
// debrand renamed lemonToast onto that name, so every unaliased call below bound
// to the object being defined and called itself.
import { ToastOptions, ToastContentProps as ToastifyRenderProps, toast as toastify } from 'react-toastify'

import { IconCheckCircle, IconInfo, IconWarning, IconX } from '@hanzo/icons'
import insights from '@hanzo/insights'

import { isChristmas } from 'lib/holidays'
import { hashCodeForString } from 'lib/utils'

import { Button } from '../Button'
import { Spinner } from '../Spinner'
import { IconErrorOutline, IconGift } from '../icons'

export function ToastCloseButton({ closeToast }: { closeToast?: () => void }): JSX.Element {
    return <Button type="tertiary" size="small" icon={<IconX />} onClick={closeToast} data-attr="toast-close-button" />
}

interface ToastButton {
    label: string
    action: (() => void) | (() => Promise<void>)
    dataAttr?: string
    className?: string
}

interface ToastOptionsWithButton extends ToastOptions {
    button?: ToastButton
    hideButton?: boolean
}

export const GET_HELP_BUTTON: ToastButton = {
    label: 'Get help',
    action: () => {
        window.open('https://hanzo.ai/support?utm_medium=in-product&utm_campaign=error-toast', '_blank')
    },
}

export interface ToastContentProps {
    type: 'info' | 'success' | 'warning' | 'error'
    message: string | JSX.Element
    button?: ToastButton
    id?: number | string
}

export function ToastContent({ type, message, button, id }: ToastContentProps): JSX.Element {
    return (
        <div className="flex items-center" data-attr={`${type}-toast`}>
            <span className="grow overflow-hidden text-ellipsis">{message}</span>
            {button && (
                <Button
                    onClick={() => {
                        void button.action()
                        toastify.dismiss(id)
                    }}
                    type="secondary"
                    size="small"
                    data-attr={button.dataAttr}
                    className={button.className}
                >
                    {button.label}
                </Button>
            )}
        </div>
    )
}

function ensureToastId(toastOptions: ToastOptions, type: string, message?: string | JSX.Element): ToastOptions {
    if (toastOptions.toastId) {
        return toastOptions
    }
    // Use a deterministic ID based on type + message so that react-toastify
    // will skip showing a duplicate toast if one with the same type and message is already visible.
    const toastId =
        typeof message === 'string'
            ? `${type}-${hashCodeForString(message)}`
            : `${Math.round(Math.random() * 10000000)}`
    return { ...toastOptions, toastId }
}

export const toast = {
    info(message: string | JSX.Element, { button, ...toastOptions }: ToastOptionsWithButton = {}): void {
        toastOptions = ensureToastId(toastOptions, 'info', message)
        toastify.info(<ToastContent type="info" message={message} button={button} id={toastOptions.toastId} />, {
            icon: <IconInfo />,
            ...toastOptions,
        })
    },
    success(message: string | JSX.Element, { button, ...toastOptions }: ToastOptionsWithButton = {}): void {
        toastOptions = ensureToastId(toastOptions, 'success', message)
        toastify.success(<ToastContent type="success" message={message} button={button} id={toastOptions.toastId} />, {
            icon: isChristmas() ? <IconGift className="text-green-600" /> : <IconCheckCircle />,
            ...toastOptions,
        })
    },
    warning(message: string | JSX.Element, { button, ...toastOptions }: ToastOptionsWithButton = {}): void {
        insights.capture('toast warning', {
            message: String(message),
            button: button?.label,
            toastId: toastOptions.toastId,
        })
        toastOptions = ensureToastId(toastOptions, 'warning', message)
        toastify.warning(<ToastContent type="warning" message={message} button={button} id={toastOptions.toastId} />, {
            icon: <IconWarning />,
            ...toastOptions,
        })
    },
    error(message: string | JSX.Element, { button, hideButton, ...toastOptions }: ToastOptionsWithButton = {}): void {
        // when used inside the insights toolbar, `insights.capture` isn't loaded
        // check if the function is available before calling it.
        if (insights.capture) {
            insights.capture('toast error', {
                message: String(message),
                button: button?.label,
                toastId: toastOptions.toastId,
            })
        }

        toastOptions = ensureToastId(toastOptions, 'error', message)
        toastify.error(
            <ToastContent
                type="error"
                message={message}
                // Show button if explicitly provided, or show GET_HELP_BUTTON unless hideButton is true
                button={button !== undefined ? button : hideButton ? undefined : GET_HELP_BUTTON}
                id={toastOptions.toastId}
            />,
            {
                icon: <IconErrorOutline />,
                ...toastOptions,
            }
        )
    },
    promise(
        promise: Promise<any>,
        messages: { pending: string | JSX.Element; success: string | JSX.Element; error: string | JSX.Element },
        { button, ...toastOptions }: ToastOptionsWithButton = {}
    ): Promise<any> {
        // Promise toasts always get random IDs (unless explicitly provided) because
        // different operations often share identical pending text like "Saving..."
        toastOptions = ensureToastId(toastOptions, 'promise')
        // see https://fkhadra.github.io/react-toastify/promise
        return toastify.promise(
            promise,
            {
                pending: {
                    render: <ToastContent type="info" message={messages.pending} button={button} />,
                    icon: <Spinner />,
                },
                success: {
                    render: (({ data }: ToastifyRenderProps<string>) => {
                        return <ToastContent type="success" message={data || messages.success} button={button} />
                    }) as (props: ToastifyRenderProps<unknown>) => React.ReactNode,
                    icon: isChristmas() ? <IconGift className="text-green-600" /> : <IconCheckCircle />,
                },
                error: {
                    render: (({ data }: ToastifyRenderProps<Error>) => {
                        return <ToastContent type="error" message={data?.message || messages.error} button={button} />
                    }) as (props: ToastifyRenderProps<unknown>) => React.ReactNode,
                    icon: <IconErrorOutline />,
                },
            },
            toastOptions
        )
    },
    dismiss(id?: number | string): void {
        toastify.dismiss(id)
    },
}
