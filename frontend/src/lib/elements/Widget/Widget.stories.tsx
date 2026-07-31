import { Meta, StoryFn, StoryObj } from '@storybook/react'

import { Button } from '../Button'
import { Widget, WidgetProps } from './Widget'

type Story = StoryObj<typeof Widget>
const meta: Meta<typeof Widget> = {
    title: 'Elements/Widget',
    component: Widget,
    tags: ['autodocs'],
}
export default meta

const Template: StoryFn<typeof Widget> = (props: WidgetProps) => {
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
}

export const Default: Story = Template.bind({})
Default.args = {}

export const Title: Story = Template.bind({})
Title.args = { title: 'A title' }

export const Closable: Story = Template.bind({})
Closable.args = { title: 'A closable widget', onClose: () => {} }

export const Actions: Story = Template.bind({})
Actions.args = { title: 'A title', actions: <Button size="small">Do this over here</Button> }
