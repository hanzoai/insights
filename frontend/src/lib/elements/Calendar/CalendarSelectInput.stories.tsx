import { Meta, StoryFn, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { dayjs } from 'lib/dayjs'
import { CalendarSelectInput, CalendarSelectInputProps } from 'lib/elements/Calendar/CalendarSelect'

type Story = StoryObj<typeof CalendarSelectInput>
const meta: Meta<typeof CalendarSelectInput> = {
    title: 'Elements/Calendar/Calendar Select Input',
    component: CalendarSelectInput,
    parameters: {
        mockDate: '2023-01-26 16:30:00',
    },
    tags: ['autodocs'],
}
export default meta

const BasicTemplate: StoryFn<typeof CalendarSelectInput> = (props: CalendarSelectInputProps) => {
    const [value, setValue] = useState<dayjs.Dayjs | null>(dayjs())

    return (
        <div className="w-64">
            <CalendarSelectInput
                {...props}
                value={value}
                onChange={(value) => {
                    setValue(value)
                }}
            />
        </div>
    )
}

export const Default: Story = BasicTemplate.bind({})
Default.args = {}

export const WithTime: Story = BasicTemplate.bind({})
WithTime.args = { granularity: 'minute' }

export const WithTime24Hour: Story = BasicTemplate.bind({})
WithTime24Hour.args = { granularity: 'minute', use24HourFormat: true }
