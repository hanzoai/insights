import clsx from 'clsx'
import { useRef, useState } from 'react'

import { IconX } from '@hanzo/icons'

import { dayjs } from 'lib/dayjs'
import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { Button, ButtonProps, ButtonWithSideActionProps, SideAction } from 'lib/elements/Button'
import {
    GetButtonTimePropsOpts,
    Calendar,
    CalendarProps,
} from 'lib/elements/Calendar/Calendar'

import { Switch } from '../Switch'
import { Popover } from '../Popover'

function timeDataAttr({ unit, value }: GetButtonTimePropsOpts): string {
    return `${value}-${unit}`
}

export function getTimeElement(
    parent: HTMLElement | null,
    props: GetButtonTimePropsOpts
): HTMLDivElement | undefined | null {
    return parent?.querySelector(`[data-attr="${timeDataAttr(props)}"]`)
}
function scrollToTimeElement(
    calendarEl: HTMLDivElement | null,
    props: GetButtonTimePropsOpts,
    skipAnimation: boolean
): void {
    getTimeElement(calendarEl, props)?.scrollIntoView({
        block: 'start',
        inline: 'nearest',
        behavior: skipAnimation ? ('instant' as ScrollBehavior) : 'smooth',
    })
}

function proposedDate(
    target: dayjs.Dayjs | null,
    { value, unit }: GetButtonTimePropsOpts,
    use24HourFormat: boolean = false
): dayjs.Dayjs {
    let date = target || dayjs().startOf('day')
    if (value != date.format(unit)) {
        if (unit === 'h') {
            if (use24HourFormat) {
                date = date.hour(Number(value))
            } else {
                date = date.hour(date.format('a') === 'am' || value === 12 ? Number(value) : Number(value) + 12)
            }
        } else if (unit === 'm') {
            date = date.minute(Number(value))
        } else if (unit === 'a') {
            date = value === 'am' ? date.subtract(12, 'hour') : date.add(12, 'hour')
        }
    }
    return date
}

function cloneTimeToDate(targetDate: dayjs.Dayjs, timeSource: dayjs.Dayjs): dayjs.Dayjs {
    return targetDate.clone().hour(timeSource.hour()).minute(timeSource.minute())
}

function getDateDisabledReason(
    selectionPeriod: 'past' | 'upcoming',
    date: dayjs.Dayjs,
    today: dayjs.Dayjs,
    selectionPeriodLimit?: dayjs.Dayjs | null
): string | undefined {
    if (!selectionPeriod) {
        return undefined
    }

    // select future dates
    if (selectionPeriod === 'upcoming' && date.isBefore(today)) {
        return 'Cannot select dates in the past'
    }

    // select future dates after a limit
    if (selectionPeriod === 'upcoming' && selectionPeriodLimit && date.isAfter(selectionPeriodLimit, 'day')) {
        return 'Cannot select dates after the limit'
    }

    if (selectionPeriod === 'past' && date.isAfter(today)) {
        return 'Cannot select dates in the future'
    }

    // select past dates before a limit
    if (selectionPeriod === 'past' && selectionPeriodLimit && date.isBefore(selectionPeriodLimit, 'day')) {
        return 'Cannot select dates before the limit'
    }

    return undefined
}

export interface CalendarSelectProps {
    value?: dayjs.Dayjs | null
    onChange?: (date: dayjs.Dayjs) => void
    months?: number
    onClose?: () => void
    granularity?: CalendarProps['granularity']
    selectionPeriod?: 'past' | 'upcoming'
    selectionPeriodLimit?: dayjs.Dayjs | null
    showTimeToggle?: boolean
    onToggleTime?: (value: boolean) => void
    /** Use 24-hour format instead of 12-hour with AM/PM */
    use24HourFormat?: boolean
}

export function CalendarSelect({
    value,
    onChange,
    months,
    onClose,
    granularity = 'day',
    selectionPeriod,
    selectionPeriodLimit,
    showTimeToggle,
    onToggleTime,
    use24HourFormat = false,
}: CalendarSelectProps): JSX.Element {
    const calendarRef = useRef<HTMLDivElement | null>(null)
    const [selectValue, setSelectValue] = useState<dayjs.Dayjs | null>(value ? value.startOf(granularity) : null)

    const now = dayjs()
    const today = now.startOf('day')

    const scrollToTime = (date: dayjs.Dayjs, skipAnimation: boolean): void => {
        const calendarEl = calendarRef.current
        if (calendarEl && date) {
            const hour = use24HourFormat ? date.hour() : date.hour() % 12 || 12
            scrollToTimeElement(calendarEl, { unit: 'h', value: hour }, skipAnimation)
            scrollToTimeElement(calendarEl, { unit: 'm', value: date.minute() }, skipAnimation)
        }
    }

    const onDateClick = (date: dayjs.Dayjs | null): void => {
        if (date) {
            date =
                granularity === 'minute'
                    ? date.minute(selectValue === null ? now.minute() : selectValue.minute())
                    : date.startOf('minute')

            date = ['hour', 'minute'].includes(granularity)
                ? date.hour(selectValue === null ? now.hour() : selectValue.hour())
                : date.startOf('hour')

            scrollToTime(date, true)
        }

        setSelectValue(date)
    }

    useOnMountEffect(() => {
        if (selectValue) {
            scrollToTime(selectValue, true)
        }
    })

    const onTimeClick = (props: GetButtonTimePropsOpts): void => {
        const date = proposedDate(selectValue, props, use24HourFormat)
        scrollToTime(date, false)
        setSelectValue(date)
    }

    return (
        <div className="CalendarSelect" data-attr="calendar-select">
            <div className="flex justify-between border-b p-2 pb-4">
                <h3 className="text-base mb-0">Select a date</h3>
                {onClose && (
                    <Button icon={<IconX />} size="small" onClick={onClose} aria-label="close" noPadding />
                )}
            </div>
            <Calendar
                ref={calendarRef}
                onDateClick={onDateClick}
                leftmostMonth={selectValue?.startOf('month')}
                months={months}
                getButtonProps={({ date, props }) => {
                    const modifiedProps: ButtonProps = { ...props }

                    if (selectionPeriod) {
                        const isToday = date.isSame(today, 'date')

                        modifiedProps.disabledReason = getDateDisabledReason(
                            selectionPeriod,
                            date,
                            today,
                            selectionPeriodLimit
                        )

                        // select date disabled reason
                        if (selectValue && isToday) {
                            // select time disabled reason
                            const selectedTimeOnDate = cloneTimeToDate(date, selectValue)

                            if (selectionPeriod === 'upcoming' && selectedTimeOnDate.isBefore(now)) {
                                modifiedProps.disabledReason = 'Pick a time in the future first'
                            } else if (selectionPeriod === 'past' && selectedTimeOnDate.isAfter(now)) {
                                modifiedProps.disabledReason = 'Pick a time in the past first'
                            }
                        }
                    }

                    if (date.isSame(selectValue, 'd')) {
                        return { ...modifiedProps, status: 'default', type: 'primary' }
                    }
                    return modifiedProps
                }}
                getButtonTimeProps={(props) => {
                    const selected = selectValue
                        ? props.unit === 'h' && use24HourFormat
                            ? String(selectValue.hour())
                            : selectValue.format(props.unit)
                        : null
                    const newDate = proposedDate(selectValue, props, use24HourFormat)

                    const periodValidityDisabledReason =
                        selectionPeriod === 'upcoming' && newDate.isBefore(now)
                            ? 'Cannot choose a time in the past'
                            : selectionPeriod === 'past' && newDate.isAfter(now)
                              ? 'Cannot choose a time in the future'
                              : undefined
                    const disabledReason = selectValue ? periodValidityDisabledReason : 'Choose a date first'

                    return {
                        active: selected === String(props.value),
                        className: 'rounded-none',
                        'data-attr': timeDataAttr(props),
                        disabledReason: disabledReason,
                        onClick: () => {
                            if (selected != props.value) {
                                onTimeClick(props)
                            }
                        },
                    }
                }}
                granularity={granularity}
                use24HourFormat={use24HourFormat}
            />
            <div
                className={clsx(
                    'flex deprecated-space-x-2 items-center border-t p-2 pt-4',
                    showTimeToggle ? 'justify-between' : 'justify-end'
                )}
            >
                {showTimeToggle && (
                    <Switch
                        label="Include time?"
                        checked={granularity != 'day'}
                        onChange={onToggleTime}
                        bordered
                    />
                )}
                <div className="flex deprecated-space-x-2">
                    {onClose && (
                        <Button type="secondary" onClick={onClose} data-attr="calendar-select-cancel">
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="primary"
                        disabled={!selectValue}
                        onClick={() => selectValue && onChange && onChange(selectValue)}
                        data-attr="calendar-select-apply"
                    >
                        Apply
                    </Button>
                </div>
            </div>
        </div>
    )
}

export type CalendarSelectInputProps = CalendarSelectProps & {
    onChange?: (date: dayjs.Dayjs | null) => void
    onClickOutside?: () => void
    buttonProps?: Omit<ButtonWithSideActionProps, 'sideAction'> & { sideAction?: SideAction }
    placeholder?: string
    clearable?: boolean
    visible?: boolean
    format?: string
}

export function CalendarSelectInput(props: CalendarSelectInputProps): JSX.Element {
    const { buttonProps, placeholder, clearable, visible: controlledVisible, ...calendarProps } = props
    const [uncontrolledVisible, setUncontrolledVisible] = useState(false)

    const visible = controlledVisible ?? uncontrolledVisible

    const showClear = props.value && clearable

    return (
        <Popover
            actionable
            onClickOutside={() => {
                setUncontrolledVisible(false)
                props.onClickOutside?.()
            }}
            visible={visible}
            overlay={
                <CalendarSelect
                    {...calendarProps}
                    onChange={(value) => {
                        props.onChange?.(value)
                        setUncontrolledVisible(false)
                    }}
                    onClose={() => {
                        setUncontrolledVisible(false)
                        props.onClose?.()
                    }}
                />
            }
        >
            <Button
                onClick={() => setUncontrolledVisible(true)}
                type="secondary"
                fullWidth
                sideAction={
                    showClear
                        ? {
                              icon: <IconX />,
                              onClick: () => props.onChange?.(null),
                          }
                        : (undefined as unknown as SideAction) // We know it will be a normal button if not clearable
                }
                {...props.buttonProps}
            >
                {props.value?.format(
                    props.format ??
                        `MMMM D, YYYY${
                            props.granularity === 'minute'
                                ? props.use24HourFormat
                                    ? ' HH:mm'
                                    : ' h:mm A'
                                : props.granularity === 'hour'
                                  ? props.use24HourFormat
                                      ? ' HH:00'
                                      : ' h A'
                                  : ''
                        }`
                ) ??
                    placeholder ??
                    'Select date'}
            </Button>
        </Popover>
    )
}
