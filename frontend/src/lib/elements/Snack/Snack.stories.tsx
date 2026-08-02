import type { Meta, StoryObj } from '@storybook/react'

import { ProfilePicture } from '../ProfilePicture'
import { Snack, SnackProps } from './Snack'

type Story = StoryObj<SnackProps>
const meta: Meta<SnackProps> = {
    title: 'Lemon UI/Lemon Snack',
    component: Snack as any,
    args: {
        children: 'Tasty snacks',
    },
    tags: ['autodocs'],
}
export default meta

export const Default: Story = {
    render: (props) => {
        return <Snack {...props} />
    },
    args: {
        onClose: null as any,
    },
}

export const Pill: Story = {
    render: () => {
        return (
            <div className="flex flex-row deprecated-space-x-2">
                <Snack type="pill">Pill</Snack>
                <Snack type="pill" onClick={() => alert('onClick')}>
                    Clickable
                </Snack>
                <Snack type="pill" onClose={() => alert('onClose')}>
                    Closeable
                </Snack>
                <Snack type="pill" onClick={() => alert('onClick')} onClose={() => alert('onClose')}>
                    Click- and Closeable
                </Snack>
            </div>
        )
    },
}

export const ComplexContent: Story = {
    render: (props) => {
        return <Snack {...props} />
    },
    args: {
        children: (
            <span className="flex gap-2 items-center">
                <ProfilePicture name="ben" size="sm" />
                <span>
                    Look at me I'm <b>bold!</b>
                </span>
            </span>
        ),
        onClose: () => alert('Close clicked!'),
    },
}

export const OverflowOptions: Story = {
    render: () => {
        return (
            <>
                <p>By default the Snack does not wrap content but this can be changed with the wrap property</p>
                <div className="bg-border p-2 deprecated-space-y-2 w-60">
                    <Snack onClose={() => {}}>qwertzuiopasdfghjklyxcvbnm1234567890</Snack>
                    <Snack onClose={() => {}} wrap>
                        Overflow-qwertzuiopasdfghjklyxcvbnm1234567890
                    </Snack>
                </div>
            </>
        )
    },
}
