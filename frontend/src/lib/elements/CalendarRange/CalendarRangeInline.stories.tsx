import { Meta, StoryFn, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { dayjs } from 'lib/dayjs'
import { CalendarRangeProps } from 'lib/elements/CalendarRange/CalendarRange'
import { formatDateRange } from 'lib/utils'

import { CalendarRangeInline } from './CalendarRangeInline'

type Story = StoryObj<typeof CalendarRangeInline>
const meta: Meta<typeof CalendarRangeInline> = {
    title: 'Elements/Calendar/Calendar Range Inline',
    component: CalendarRangeInline,
    parameters: {
        mockDate: '2023-01-26',
    },
    tags: ['autodocs'],
}
export default meta

const BasicTemplate: StoryFn<typeof CalendarRangeInline> = (props: CalendarRangeProps) => {
    const [value, setValue] = useState([dayjs('2022-08-11'), dayjs('2022-08-26')] as [dayjs.Dayjs, dayjs.Dayjs] | null)

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
}

export const CalendarRangeInline_: Story = BasicTemplate.bind({})
CalendarRangeInline_.args = {}
