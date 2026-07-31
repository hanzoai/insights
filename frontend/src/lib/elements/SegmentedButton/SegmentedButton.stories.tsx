import { Meta, StoryFn, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { IconBook, IconCalculator, IconCalendar, IconGear } from '@hanzo/icons'

import { SegmentedButton, SegmentedButtonOption, SegmentedButtonProps } from './SegmentedButton'

type Story = StoryObj<typeof SegmentedButton>
const meta: Meta<typeof SegmentedButton> = {
    title: 'Elements/Segmented Button',
    component: SegmentedButton,
    argTypes: {
        options: {
            control: {
                type: 'object',
            },
        },
        // Show value and onChange, but disable editing as they're handled by the template
        value: { control: { disable: true } },
        onChange: { control: { disable: true } },
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
        ] as SegmentedButtonOption<string>[],
    },
    tags: ['autodocs'],
}
export default meta

const Template: StoryFn<typeof SegmentedButton> = (
    props: Omit<SegmentedButtonProps<any>, 'value' | 'onChange'>
) => {
    const [value, setValue] = useState(props.options[1]?.value)

    return <SegmentedButton {...props} value={value} onChange={(newValue) => setValue(newValue)} />
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

export const Disabled: Story = Template.bind({})
Disabled.args = {
    disabledReason: 'Choose a chart type first.',
}
