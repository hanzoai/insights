import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '../Button'
import { Widget, WidgetProps } from './Widget'

type Story = StoryObj<WidgetProps>
const meta: Meta<WidgetProps> = {
    title: 'Lemon UI/Lemon Widget',
    component: Widget,
    tags: ['autodocs'],
    render: (props) => {
        return (
            <div>
                <Widget {...props}>
                    <div className="p-2">
                        <p>Some serious content here</p>
                        <p className="mb-0">and here</p>
                    </div>
                </Widget>
            </div>
        )
    },
}
export default meta

export const Default: Story = {
    args: {},
}

export const Title: Story = {
    args: { title: 'A title' },
}

export const Closable: Story = {
    args: { title: 'A closable widget', onClose: () => {} },
}

export const Actions: Story = {
    args: { title: 'A title', actions: <Button size="small">Do this over here</Button> },
}
