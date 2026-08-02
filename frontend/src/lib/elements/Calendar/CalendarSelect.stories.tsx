import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { dayjs } from 'lib/dayjs'
import { Button } from 'lib/elements/Button'
import { CalendarSelect, CalendarSelectProps } from 'lib/elements/Calendar/CalendarSelect'
import { Popover } from 'lib/elements/Popover/Popover'
import { formatDate } from 'lib/utils/datetime'

type Story = StoryObj<CalendarSelectProps>
const meta: Meta<CalendarSelectProps> = {
    title: 'Lemon UI/Lemon Calendar/Lemon Calendar Select',
    component: CalendarSelect,
    parameters: {
        mockDate: '2023-01-26',
    },
    tags: ['autodocs'],
    render: (props) => {
        const [value, setValue] = useState(dayjs().subtract(10, 'day'))
        const [visible, setVisible] = useState(true)
        const [granularity, setGranularity] = useState<CalendarSelectProps['granularity']>(props.granularity)

        return (
            <div className="pb-[30rem]">
                <Popover
                    actionable
                    overlay={
                        <CalendarSelect
                            {...props}
                            value={value}
                            onChange={(value) => {
                                setValue(value)
                                setVisible(false)
                            }}
                            showTimeToggle={props.showTimeToggle}
                            onToggleTime={() => setGranularity(granularity === 'minute' ? 'day' : 'minute')}
                            granularity={granularity}
                            onClose={() => setVisible(false)}
                        />
                    }
                    visible={visible}
                    onClickOutside={() => setVisible(false)}
                >
                    <Button type="secondary" onClick={() => setVisible(!visible)}>
                        {formatDate(value)}
                    </Button>
                </Popover>
            </div>
        )
    },
}
export default meta

export const Default: Story = { args: { granularity: 'day' } }

export const Upcoming: Story = { args: { selectionPeriod: 'upcoming' } }

export const Past: Story = { args: { selectionPeriod: 'past' } }

export const Hour: Story = { args: { granularity: 'hour' } }

export const Minute: Story = { args: { granularity: 'minute' } }

export const WithTimeToggle: Story = { args: { showTimeToggle: true } }

export const WithTimeToggleAndMultipleMonths: Story = { args: { showTimeToggle: true, months: 3 } }

export const Minute24Hour: Story = { args: { granularity: 'minute', use24HourFormat: true } }
