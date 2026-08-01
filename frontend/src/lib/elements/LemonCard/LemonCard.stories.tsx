import type { Meta, StoryObj } from '@storybook/react'

import { Card, CardProps } from './Card'

type Story = StoryObj<CardProps>
const meta: Meta<CardProps> = {
    title: 'Lemon UI/Lemon Card',
    component: Card as any,
    tags: ['autodocs'],
    render: (props) => {
        return (
            <div>
                <Card {...props}>
                    <span>Tis a lemon card</span>
                </Card>
            </div>
        )
    },
}
export default meta

export const Default: Story = {
    args: {},
}

export const Focused: Story = {
    args: { focused: true },
}

export const HoverEffect: Story = {
    args: { hoverEffect: true },
}

export const Closeable: Story = {
    args: { closeable: true },
}
