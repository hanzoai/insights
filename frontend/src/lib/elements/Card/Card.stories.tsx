import { Meta, StoryFn, StoryObj } from '@storybook/react'

import { Card, CardProps } from './Card'

type Story = StoryObj<typeof Card>
const meta: Meta<typeof Card> = {
    title: 'Elements/Card',
    component: Card,
    tags: ['autodocs'],
}
export default meta

const Template: StoryFn<typeof Card> = (props: CardProps) => {
    return (
        <div>
            <Card {...props}>
                <span>Tis a card</span>
            </Card>
        </div>
    )
}

export const Default: Story = Template.bind({})
Default.args = {}

export const Focused: Story = Template.bind({})
Focused.args = { focused: true }

export const HoverEffect: Story = Template.bind({})
HoverEffect.args = { hoverEffect: true }

export const Closeable: Story = Template.bind({})
Closeable.args = { closeable: true }
