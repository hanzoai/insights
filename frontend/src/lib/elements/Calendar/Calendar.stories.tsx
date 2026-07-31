import { Meta, StoryFn, StoryObj } from '@storybook/react'

import { dayjs } from 'lib/dayjs'

import { Calendar, CalendarProps } from './Calendar'

type Story = StoryObj<typeof Calendar>
const meta: Meta<typeof Calendar> = {
    title: 'Elements/Calendar/Calendar',
    component: Calendar,
    args: {
        onDateClick: (date: dayjs.Dayjs) => {
            // eslint-disable-next-line no-console
            console.log(`Clicked: ${date}`)
        },
    },
    parameters: {
        mockDate: '2023-01-26',
    },
    tags: ['autodocs'],
}
export default meta

const BasicTemplate: StoryFn<typeof Calendar> = (props: CalendarProps) => {
    return <Calendar {...props} />
}

export const Default: Story = BasicTemplate.bind({})
Default.args = {}

export const MultipleMonths: Story = BasicTemplate.bind({})
MultipleMonths.args = {
    months: 3,
}

export const CustomStyles: Story = BasicTemplate.bind({})
CustomStyles.args = {
    getButtonProps: ({ date, props }) => {
        return {
            ...props,
            active: date.day() % 2 === 0,
            type: date.date() % 10 === 0 ? 'primary' : undefined,
        }
    },
}

export const MondayFirst: Story = BasicTemplate.bind({})
MondayFirst.args = {
    weekStartDay: 1,
}

export const TuesdayFirst: Story = BasicTemplate.bind({})
TuesdayFirst.args = {
    weekStartDay: 2,
}

export const WednesdayFirst: Story = BasicTemplate.bind({})
WednesdayFirst.args = {
    weekStartDay: 3,
}

export const ThursdayFirst: Story = BasicTemplate.bind({})
ThursdayFirst.args = {
    weekStartDay: 4,
}

export const FridayFirst: Story = BasicTemplate.bind({})
FridayFirst.args = {
    weekStartDay: 5,
}

export const SaturdayFirst: Story = BasicTemplate.bind({})
SaturdayFirst.args = {
    weekStartDay: 6,
}

export const SundayFirst: Story = BasicTemplate.bind({})
SundayFirst.args = {
    weekStartDay: 0,
}

export const Hour: Story = BasicTemplate.bind({})
Hour.args = {
    granularity: 'hour',
}

export const Minute: Story = BasicTemplate.bind({})
Minute.args = {
    granularity: 'minute',
}

export const Minute24Hour: Story = BasicTemplate.bind({})
Minute24Hour.args = {
    granularity: 'minute',
    use24HourFormat: true,
}
