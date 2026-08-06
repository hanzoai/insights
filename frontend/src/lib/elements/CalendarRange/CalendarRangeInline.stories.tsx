import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { dayjs } from 'lib/dayjs'
import { CalendarRangeProps } from 'lib/elements/CalendarRange/CalendarRange'
import { formatDateRange } from 'lib/utils/datetime'

import { CalendarRangeInline } from './CalendarRangeInline'

type Story = StoryObj<CalendarRangeProps>
const meta: Meta<CalendarRangeProps> = {
    title: 'Lemon UI/Lemon Calendar/Lemon Calendar Range Inline',
    component: CalendarRangeInline as any,
    parameters: {
        mockDate: '2023-01-26',
    },
    tags: ['autodocs'],
    render: (props) => {
        const [value, setValue] = useState([dayjs('2022-08-11'), dayjs('2022-08-26')] as
            | [dayjs.Dayjs, dayjs.Dayjs]
            | null)

        return (
            <>
                <CalendarRangeInline
                    {...props}
                    value={value}
                    onChange={(value) => {
                        setValue(value)
                    }}
                />

                <p className="mt-2">Value is: {value ? formatDateRange(...value) : ''}</p>
            </>
        )
    },
}
export default meta

export const CalendarRangeInline_: Story = {
    args: {},
}
