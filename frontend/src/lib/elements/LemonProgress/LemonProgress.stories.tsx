import { Meta, StoryObj } from '@storybook/react'

import { Progress, ProgressProps } from './Progress'

const meta: Meta<ProgressProps> = {
    title: 'Lemon UI/Lemon Progress',
    component: Progress,
    args: {
        percent: 30,
    },
    tags: ['autodocs'],
}
type Story = StoryObj<ProgressProps>
export default meta

export const Variations: Story = {
    render: () => {
        return (
            <div className="min-w-120">
                <Progress percent={30} />
                <Progress percent={75} strokeColor="var(--warning)" />
                <Progress percent={50} size="large" strokeColor="purple" />
                <Progress percent={NaN} />
                <Progress percent={500} />
            </div>
        )
    },
}
