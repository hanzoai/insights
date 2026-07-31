import { Meta, StoryFn, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Button } from 'lib/elements/Button'

import { Badge, BadgeNumberProps } from './Badge'

type Story = StoryObj<typeof Badge.Number>
const meta: Meta<typeof Badge.Number> = {
    title: 'Elements/Badge/Badge Number',
    component: Badge.Number,
    tags: ['autodocs'],
}
export default meta

const Template: StoryFn<typeof Badge.Number> = ({ count, ...props }: BadgeNumberProps) => {
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
}

export const Standard: Story = Template.bind({})
Standard.args = { count: 1 }

export const MultipleDigits: Story = Template.bind({})
MultipleDigits.args = { count: 975, maxDigits: 3 }

export const ShowZero: Story = Template.bind({})
ShowZero.args = { count: 0, showZero: true }
