import { render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { dayjs } from 'lib/dayjs'
import {
    CalendarSelect,
    CalendarSelectProps,
    getTimeElement,
} from 'lib/elements/Calendar/CalendarSelect'

import { getByDataAttr } from '~/test/byDataAttr'

import { GetButtonTimePropsOpts } from './Calendar'

const createClickHelpers = (
    container: HTMLElement
): {
    clickOnDate: (day: string) => Promise<void>
    clickOnTime: (props: GetButtonTimePropsOpts) => Promise<void>
} => ({
    clickOnDate: async (day: string): Promise<void> => {
        const element = container.querySelector('.Calendar__month') as HTMLElement
        if (element) {
            userEvent.click(await within(element).findByText(day))
            userEvent.click(getByDataAttr(container, 'calendar-select-apply'))
        }
    },
    clickOnTime: async (props: GetButtonTimePropsOpts): Promise<void> => {
        const element = getTimeElement(container.querySelector('.Calendar__time'), props)
        if (element) {
            userEvent.click(element)
            userEvent.click(getByDataAttr(container, 'calendar-select-apply'))
        }
    },
})

const renderCalendarSelect = (
    selectedDate: dayjs.Dayjs | null = null,
    props: Partial<CalendarSelectProps> = {}
): {
    container: HTMLElement
    onClose: jest.Mock
    onChange: jest.Mock
    clickOnDate: (day: string) => Promise<void>
    clickOnTime: (props: GetButtonTimePropsOpts) => Promise<void>
} => {
    const onClose = jest.fn()
    const onChange = jest.fn()

    function TestSelect(): JSX.Element {
        const [value, setValue] = useState<dayjs.Dayjs | null>(selectedDate)
        return (
            <CalendarSelect
                months={1}
                value={value}
                onClose={onClose}
                onChange={(value) => {
                    setValue(value)
                    onChange(value)
                }}
                {...props}
            />
        )
    }

    const { container } = render(<TestSelect />)
    return { container, onClose, onChange, ...createClickHelpers(container) }
}

describe('CalendarSelect', () => {
    beforeEach(() => {
        window.HTMLElement.prototype.scrollIntoView = jest.fn()

        jest.useFakeTimers().setSystemTime(new Date('2023-01-10 17:22:08'))
    })

    afterEach(() => {
        jest.restoreAllMocks()
        jest.useRealTimers()
    })

    test('select various dates', async () => {
        const { container, onClose, onChange, clickOnDate } = renderCalendarSelect(dayjs('2022-02-10'))

        // find just one month
        const calendar = getByDataAttr(container, 'calendar')
        expect(calendar).toBeTruthy()

        // find February 2022
        expect(await within(calendar).findByText('February 2022')).toBeTruthy()

        // click on 15
        await clickOnDate('15')
        expect(onChange).toHaveBeenCalledWith(dayjs('2022-02-15'))

        // click on 27
        await clickOnDate('27')
        expect(onChange).toHaveBeenCalledWith(dayjs('2022-02-27'))

        userEvent.click(getByDataAttr(container, 'calendar-select-cancel'))
        expect(onClose).toHaveBeenCalled()
    })

    test('select various times', async () => {
        const { onChange, clickOnDate, clickOnTime } = renderCalendarSelect(null, {
            granularity: 'minute',
        })

        // click on hour 8
        await clickOnDate('15')
        // sets the date to 15, hour and minutes to current time, and seconds to 0
        expect(onChange).toHaveBeenCalledWith(dayjs('2023-01-15T17:22:00.000Z'))

        // click on minute 42
        await clickOnTime({ unit: 'm', value: 42 })
        // sets the minutes but leaves all other values unchanged
        expect(onChange).toHaveBeenCalledWith(dayjs('2023-01-15T17:42:00.000Z'))

        // click on 'am'
        await clickOnTime({ unit: 'a', value: 'am' })
        // subtracts 12 hours from the time
        expect(onChange).toHaveBeenCalledWith(dayjs('2023-01-15T05:42:00.000Z'))

        // click on hour 8
        await clickOnTime({ unit: 'h', value: 8 })
        // only changes the hour
        expect(onChange).toHaveBeenCalledWith(dayjs('2023-01-15T08:42:00.000Z'))
    })

    test('only allow upcoming selection', async () => {
        const { onChange, clickOnDate, clickOnTime } = renderCalendarSelect(null, {
            granularity: 'minute',
            selectionPeriod: 'upcoming',
        })

        // click on minute
        await clickOnTime({ unit: 'm', value: 42 })
        // time is disabled until a date is clicked
        expect(onChange).not.toHaveBeenCalled()

        // click on past date
        await clickOnDate('9')
        // cannot select a date in the past
        expect(onChange).not.toHaveBeenCalled()

        // click on current date
        await clickOnDate('10')
        // chooses the current date and sets the time to the current hour and minute
        expect(onChange).toHaveBeenCalledWith(dayjs('2023-01-10T17:22:00.000Z'))

        // click on an earlier hour
        await clickOnTime({ unit: 'a', value: 'am' })
        // does not update the date because it is in the past
        expect(onChange).toHaveBeenLastCalledWith(dayjs('2023-01-10T17:22:00.000Z'))

        // click on a later hour
        await clickOnTime({ unit: 'h', value: '8' })
        // updates the hour to 8pm (later than 5pm)
        expect(onChange).toHaveBeenLastCalledWith(dayjs('2023-01-10T20:22:00.000Z'))
    })

    test('allow only upcoming selection after a limit (one day in the future)', async () => {
        const { onChange, clickOnDate, clickOnTime } = renderCalendarSelect(null, {
            granularity: 'minute',
            selectionPeriod: 'upcoming',
            selectionPeriodLimit: dayjs('2023-01-11'),
        })

        // click on minute
        await clickOnTime({ unit: 'm', value: 42 })
        // time is disabled until a date is clicked
        expect(onChange).not.toHaveBeenCalled()

        // click on past date
        await clickOnDate('9')
        // cannot select a date in the past
        expect(onChange).not.toHaveBeenCalled()

        // click on future date beyond the limit
        await clickOnDate('12')
        // cannot select a date in the future
        expect(onChange).not.toHaveBeenCalled()

        // click on current date
        await clickOnDate('10')
        // chooses the current date and sets the time to the current hour and minute
        expect(onChange).toHaveBeenCalledWith(dayjs('2023-01-10T17:22:00.000Z'))

        // click on an earlier hour
        await clickOnTime({ unit: 'a', value: 'am' })
        // does not update the date because it is in the past
        expect(onChange).toHaveBeenLastCalledWith(dayjs('2023-01-10T17:22:00.000Z'))

        // click on a later hour
        await clickOnTime({ unit: 'h', value: '8' })
        // updates the hour to 8pm (later than 5pm)
        expect(onChange).toHaveBeenLastCalledWith(dayjs('2023-01-10T20:22:00.000Z'))
    })

    test('only allow past selection', async () => {
        const { onChange, clickOnDate, clickOnTime } = renderCalendarSelect(null, {
            granularity: 'minute',
            selectionPeriod: 'past',
        })

        // click on minute
        await clickOnTime({ unit: 'm', value: 12 })
        // time is disabled until a date is clicked
        expect(onChange).not.toHaveBeenCalled()

        // click on future date
        await clickOnDate('11')
        // cannot select a date in the future
        expect(onChange).not.toHaveBeenCalled()

        // click on current date
        await clickOnDate('10')
        // chooses the current date and sets the time to the current hour and minute
        expect(onChange).toHaveBeenCalledWith(dayjs('2023-01-10T17:22:00.000Z'))

        // click on an later hour
        await clickOnTime({ unit: 'h', value: '18' })
        // does not update the date because it is in the future
        expect(onChange).toHaveBeenLastCalledWith(dayjs('2023-01-10T17:22:00.000Z'))

        // click on an earlier hour
        await clickOnTime({ unit: 'h', value: '2' })
        // updates the hour to 2pm (earlier than 5pm)
        expect(onChange).toHaveBeenLastCalledWith(dayjs('2023-01-10T14:22:00.000Z'))
    })

    test('allow only past selection after a limit (one day in the past)', async () => {
        const { onChange, clickOnDate, clickOnTime } = renderCalendarSelect(null, {
            granularity: 'minute',
            selectionPeriod: 'past',
            selectionPeriodLimit: dayjs('2023-01-09'),
        })

        // click on minute
        await clickOnTime({ unit: 'm', value: 12 })
        // time is disabled until a date is clicked
        expect(onChange).not.toHaveBeenCalled()

        // click on future date
        await clickOnDate('11')
        // cannot select a date in the future
        expect(onChange).not.toHaveBeenCalled()

        // click on a date in the past
        await clickOnDate('8')
        // chooses the date in the past and sets the time to the current hour and minute
        expect(onChange).not.toHaveBeenCalled()

        // click on past date within the limit
        await clickOnDate('9')
        // chooses the current date and sets the time to the current hour and minute
        expect(onChange).toHaveBeenCalledWith(dayjs('2023-01-09T17:22:00.000Z'))
    })

    test('select times with use24HourFormat', async () => {
        const { onChange, clickOnDate, clickOnTime } = renderCalendarSelect(null, {
            granularity: 'minute',
            use24HourFormat: true,
        })

        // click on a date first
        await clickOnDate('15')
        // sets the date to 15, hour and minutes to current time, and seconds to 0
        expect(onChange).toHaveBeenCalledWith(dayjs('2023-01-15T17:22:00.000Z'))

        // click on hour 8 (should be 08:00, not adjusted for AM/PM)
        await clickOnTime({ unit: 'h', value: 8 })
        expect(onChange).toHaveBeenCalledWith(dayjs('2023-01-15T08:22:00.000Z'))

        // click on hour 20 (should be 20:00, only possible in 24h mode)
        await clickOnTime({ unit: 'h', value: 20 })
        expect(onChange).toHaveBeenCalledWith(dayjs('2023-01-15T20:22:00.000Z'))

        // click on hour 0 (midnight, only possible in 24h mode)
        await clickOnTime({ unit: 'h', value: 0 })
        expect(onChange).toHaveBeenCalledWith(dayjs('2023-01-15T00:22:00.000Z'))

        // click on minute 45
        await clickOnTime({ unit: 'm', value: 45 })
        expect(onChange).toHaveBeenCalledWith(dayjs('2023-01-15T00:45:00.000Z'))
    })
})
