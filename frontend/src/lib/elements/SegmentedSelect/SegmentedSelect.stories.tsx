import { Meta, StoryFn, StoryObj } from '@storybook/react'

import { IconBook, IconCalculator, IconCalendar, IconGear } from '@hanzo/icons'

import { SegmentedSelect, SegmentedSelectProps } from './SegmentedSelect'

type Story = StoryObj<typeof SegmentedSelect>
const meta: Meta<typeof SegmentedSelect> = {
    title: 'Elements/Segmented Select',
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
}
export default meta

const Template: StoryFn<typeof SegmentedSelect> = (props: Omit<SegmentedSelectProps<any>, 'value'>) => {
    return <SegmentedSelect {...props} value={props.options[1]?.value} />
}

export const Default: Story = Template.bind({})
Default.args = {}

export const FullWidth: Story = Template.bind({})
FullWidth.args = {
    fullWidth: true,
}

export const Small: Story = Template.bind({})
Small.args = {
    size: 'small',
}
