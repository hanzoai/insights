import { Meta, StoryFn } from '@storybook/react'

import { Progress } from './Progress'

const meta: Meta<typeof Progress> = {
    title: 'Elements/Progress',
    component: Progress,
    args: {
        percent: 30,
    },
    tags: ['autodocs'],
}
export default meta

export const Variations: StoryFn<typeof Progress> = () => {
    return (
        <div className="min-w-120">
            <Progress percent={30} />
            <Progress percent={75} strokeColor="var(--warning)" />
            <Progress percent={50} size="large" strokeColor="purple" />
            <Progress percent={NaN} />
            <Progress percent={500} />
        </div>
    )
}
