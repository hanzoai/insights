import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { InsightsQLEditor, InsightsQLEditorProps } from './InsightsQLEditor'

type Story = StoryObj<InsightsQLEditorProps>
const meta: Meta<InsightsQLEditorProps> = {
    title: 'Components/InsightsQLEditor',
    component: InsightsQLEditor,
    render: (props) => {
        const [value, onChange] = useState(props.value ?? "countIf(properties.$browser = 'Chrome')")
        return <InsightsQLEditor {...props} value={value} onChange={onChange} />
    },
}
export default meta

export const InsightsQLEditor_: Story = {
    args: {},
}

export const NoValue: Story = {
    args: {
        value: '',
        disableAutoFocus: true,
    },
}

export const NoValuePersonPropertiesDisabled: Story = {
    args: {
        disablePersonProperties: true,
        value: '',
        disableAutoFocus: true,
    },
}
