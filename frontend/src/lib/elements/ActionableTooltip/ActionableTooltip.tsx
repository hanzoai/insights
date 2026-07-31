import './ActionableTooltip.scss'

import { Placement } from '@floating-ui/react'

import { IconChevronLeft, IconChevronRight, IconX } from '@hanzo/icons'
import { Button } from '@hanzo/elements'

import { Popover } from 'lib/elements/Popover/Popover'
import { IconOpenInNew } from 'lib/elements/icons'

export type ActionableTooltipProps = {
    title?: string
    text: string
    placement: Placement
    step: number
    maxSteps: number
    visible: boolean
    close: () => void
    element?: HTMLElement
    next?: () => void
    previous?: () => void
    buttons?: { label: string; url?: string; action?: () => void }[]
    icon?: JSX.Element
}

export const ActionableTooltip = ({
    title,
    text,
    element,
    placement,
    visible,
    close,
    previous,
    next,
    step,
    maxSteps,
    buttons,
    icon,
}: ActionableTooltipProps): JSX.Element | null => {
    const actionButtons = buttons?.filter((button) => button.action) ?? []
    const urlButtons = buttons?.filter((button) => button.url) ?? []
    return (
        <Popover
            visible={visible}
            referenceElement={element}
            placement={placement}
            overlay={
                <div className="ActionableTooltip">
                    <div className="ActionableTooltip__header">
                        {maxSteps === 1 && (
                            <div className="flex deprecated-space-x-4">
                                {icon && <div className="ActionableTooltip__icon">{icon}</div>}
                                <div className="ActionableTooltip__title">{title ?? ''}</div>
                            </div>
                        )}
                        <div className="ActionableTooltip__navigation">
                            {maxSteps > 1 && (
                                <>
                                    <Button
                                        className="ActionableTooltip__navigation--left"
                                        onClick={previous}
                                        disabled={step === 0}
                                        size="small"
                                        type="secondary"
                                        icon={<IconChevronLeft />}
                                    />
                                    <div>
                                        Tip {step + 1} of {maxSteps}
                                    </div>
                                    <Button
                                        className="ActionableTooltip__navigation--right"
                                        onClick={next}
                                        disabled={step === maxSteps - 1}
                                        size="small"
                                        type="secondary"
                                        icon={<IconChevronRight />}
                                    />
                                </>
                            )}
                        </div>
                        <div>
                            <Button size="small" onClick={close}>
                                <IconX />
                            </Button>
                        </div>
                    </div>
                    <div className="ActionableTooltip__body">
                        {maxSteps > 1 && (
                            <div className="flex deprecated-space-x-4">
                                {icon && <div className="ActionableTooltip__icon">{icon}</div>}
                                <div className="ActionableTooltip__title">{title ?? ''}</div>
                            </div>
                        )}
                        <div>{text}</div>
                    </div>
                    <div className="ActionableTooltip__footer">
                        {urlButtons.length > 0 && (
                            <div className="ActionableTooltip__url-buttons">
                                {urlButtons.map((button, index) => (
                                    <Button
                                        key={index}
                                        type="secondary"
                                        icon={<IconOpenInNew />}
                                        onClick={() => window.open(button.url, '_noblank')}
                                        className="max-w-full"
                                        fullWidth
                                        center
                                    >
                                        {button.label}
                                    </Button>
                                ))}
                            </div>
                        )}
                        {actionButtons.length > 0 && (
                            <div className="ActionableTooltip__action-buttons">
                                {actionButtons.map((button, index) => {
                                    return (
                                        <Button
                                            key={index}
                                            type="primary"
                                            onClick={button.action}
                                            fullWidth
                                            center
                                        >
                                            {button.label}
                                        </Button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            }
            actionable
            showArrow
        />
    )
}
