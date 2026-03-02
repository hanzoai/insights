import { Meta, StoryFn, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { InsightsQLEditor } from './InsightsQLEditor'

type Story = StoryObj<typeof InsightsQLEditor>
const meta: Meta<typeof InsightsQLEditor> = {
    title: 'Components/InsightsQLEditor',
    component: InsightsQLEditor,
}
export default meta

const Template: StoryFn<typeof InsightsQLEditor> = (props): JSX.Element => {
    const [value, onChange] = useState(props.value ?? "countIf(properties.$browser = 'Chrome')")
    return <InsightsQLEditor {...props} value={value} onChange={onChange} />
}

export const InsightsQLEditor_: Story = Template.bind({})
InsightsQLEditor_.args = {}

export const NoValue: Story = Template.bind({})
NoValue.args = {
    value: '',
    disableAutoFocus: true,
}

export const NoValuePersonPropertiesDisabled: Story = Template.bind({})
NoValuePersonPropertiesDisabled.args = {
    disablePersonProperties: true,
    value: '',
    disableAutoFocus: true,
}
