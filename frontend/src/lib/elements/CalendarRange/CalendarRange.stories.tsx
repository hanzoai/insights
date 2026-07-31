import { Meta, StoryFn, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { dayjs } from 'lib/dayjs'
import { Button } from 'lib/elements/Button'
import { CalendarRange, CalendarRangeProps } from 'lib/elements/CalendarRange/CalendarRange'
import { Popover } from 'lib/elements/Popover/Popover'
import { formatDateRange } from 'lib/utils'

type Story = StoryObj<typeof CalendarRange>
const meta: Meta<typeof CalendarRange> = {
    title: 'Elements/Calendar/Calendar Range',
    component: CalendarRange,
    parameters: {
        mockDate: '2023-01-26',
    },
    tags: ['autodocs'],
}
export default meta

const BasicTemplate: StoryFn<typeof CalendarRange> = (props: CalendarRangeProps) => {
    const [value, setValue] = useState([dayjs('2022-08-11'), dayjs('2022-08-26')] as CalendarRangeProps['value'])
    const [visible, setVisible] = useState(true)

    return (
        <div className="pb-[30rem]">
            <Popover
                actionable
                overlay={
                    <CalendarRange
                        {...props}
                        value={value}
                        onChange={(value) => {
                            setValue(value)
                            setVisible(false)
                        }}
                        onClose={() => setVisible(false)}
                    />
                }
                visible={visible}
                onClickOutside={() => setVisible(false)}
            >
                <Button type="secondary" onClick={() => setVisible(!visible)}>
                    {value ? formatDateRange(...value) : ''}
                </Button>
            </Popover>
        </div>
    )
}

export const CalendarRange_: Story = BasicTemplate.bind({})
CalendarRange_.args = {}
