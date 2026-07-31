import { Meta, StoryFn, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Radio, RadioOption, RadioProps } from './Radio'

type Story = StoryObj<typeof Radio>
const meta: Meta<typeof Radio> = {
    title: 'Elements/Radio',
    component: Radio,
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
            { value: 'calendar', label: 'Calendar' },
            { value: 'calculator', label: 'Calculator' },
            { value: 'banana', label: 'Banana', disabledReason: 'Bananas are not allowed on pizza' },
            { value: 'settings', label: 'Settings' },
        ] as RadioOption<string>[],
    },
    tags: ['autodocs'],
}
export default meta

const Template: StoryFn<typeof Radio> = (props: Omit<RadioProps<any>, 'value' | 'onChange'>) => {
    const [value, setValue] = useState(props.options[1]?.value)

    return <Radio {...props} value={value} onChange={(newValue) => setValue(newValue)} />
}

export const Default: Story = Template.bind({})
Default.args = {}

export const WithDescriptions: Story = Template.bind({})
WithDescriptions.args = {
    options: [
        { value: 'calendar', label: 'Calendar' },
        { value: 'calculator', label: 'Calculator', description: '2.1 + 2.01 = 4.109999999999999' },
        {
            value: 'banana',
            label: 'Banana',
            disabledReason: 'Bananas are not allowed on pizza',
            description:
                'Note: The banana addon ships from Costa Rica, which will add 2 working days of a delay to your order.',
        },
    ],
}

export const WithTopPosition: Story = Template.bind({})
WithTopPosition.args = {
    radioPosition: 'top',
}
