import type { Meta, StoryObj } from '@storybook/react'

import { IconBook, IconCalculator, IconCalendar, IconGear } from '@hanzo/icons'

import { SegmentedSelect, SegmentedSelectProps } from './SegmentedSelect'

type Story = StoryObj<SegmentedSelectProps<string>>
const meta: Meta<SegmentedSelectProps<string>> = {
    title: 'Lemon UI/Lemon Segmented Select',
    component: SegmentedSelect,
    argTypes: {
        options: {
            control: {
                type: 'object',
            },
        },
        shrinkOn: { control: { type: 'number' } },
    },
    args: {
        options: [
            { value: 'calendar', label: 'Calendar', icon: <IconCalendar /> },
            { value: 'calculator', label: 'Calculator', icon: <IconCalculator /> },
            {
                value: 'banana',
                label: 'Banana',
                icon: <IconBook />,
                disabledReason: 'Bananas are not allowed on these premises.',
            },
            { value: 'settings', label: 'Settings', icon: <IconGear /> },
        ],
    },
    tags: ['autodocs'],
    render: (props) => {
        return <SegmentedSelect {...props} value={props.options[1]?.value} />
    },
}
export default meta

export const Default: Story = {
    args: {},
}

export const FullWidth: Story = {
    args: {
        fullWidth: true,
    },
}

export const Small: Story = {
    args: {
        size: 'small',
    },
}
