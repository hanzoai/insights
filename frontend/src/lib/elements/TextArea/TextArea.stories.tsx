import { Meta, StoryFn, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { IconTrash } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'

import { TextArea } from './TextArea'

type Story = StoryObj<typeof TextArea>
const meta: Meta<typeof TextArea> = {
    title: 'Elements/Text Area',
    component: TextArea,
    args: {
        value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    },
    tags: ['autodocs'],
}
export default meta

const Template: StoryFn<typeof TextArea> = (props) => {
    const [value, setValue] = useState(props.value)
    return <TextArea {...props} value={value} onChange={(newValue) => setValue(newValue)} />
}

export const Basic: Story = Template.bind({})
Basic.args = {}

export const Disabled: Story = Template.bind({})
Disabled.args = { disabled: true }

export const WithMaxLength: Story = Template.bind({})
WithMaxLength.args = { maxLength: 100, value: '1234567890' }

export const WithMaxLengthExceeded: Story = Template.bind({})
WithMaxLengthExceeded.args = { maxLength: 5, value: '1234567890' }

export const WithArbitraryAction: Story = Template.bind({})
WithArbitraryAction.args = {
    maxLength: 5,
    value: '1234567890',
    actions: [<Button key="1" icon={<IconTrash />} size="xsmall" />],
}
