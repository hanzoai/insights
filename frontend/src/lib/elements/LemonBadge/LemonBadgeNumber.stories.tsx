import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Button } from 'lib/elements/Button'

import { Badge, BadgeNumberProps } from './Badge'

type Story = StoryObj<BadgeNumberProps>
const meta: Meta<BadgeNumberProps> = {
    title: 'Lemon UI/Lemon Badge/Lemon Badge Number',
    component: Badge.Number as any,
    tags: ['autodocs'],
    render: ({ count, ...props }) => {
        const [countOverride, setCount] = useState(count)

        return (
            <>
                <div className="flex items-center min-h-6">
                    <div>Count: </div>
                    <Badge.Number count={countOverride} {...props} />
                </div>
                <br />
                <div className="flex deprecated-space-x-1">
                    <Button type="primary" onClick={() => setCount((countOverride || 0) + 1)}>
                        Increment
                    </Button>
                    <Button type="secondary" onClick={() => setCount((countOverride || 0) - 1)}>
                        Decrement
                    </Button>
                </div>
            </>
        )
    },
}
export default meta

export const Standard: Story = {
    args: { count: 1 },
}

export const MultipleDigits: Story = {
    args: { count: 975, maxDigits: 3 },
}

export const ShowZero: Story = {
    args: { count: 0, showZero: true },
}
