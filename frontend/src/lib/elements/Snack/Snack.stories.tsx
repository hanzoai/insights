import { Meta, StoryFn, StoryObj } from '@storybook/react'

import { ProfilePicture } from '../ProfilePicture'
import { Snack, SnackProps } from './Snack'

type Story = StoryObj<typeof Snack>
const meta: Meta<typeof Snack> = {
    title: 'Elements/Snack',
    component: Snack,
    args: {
        children: 'Tasty snacks',
    },
    tags: ['autodocs'],
}
export default meta

const BasicTemplate: StoryFn<typeof Snack> = (props: SnackProps) => {
    return <Snack {...props} />
}

export const Default: Story = BasicTemplate.bind({})
Default.args = {
    onClose: null as any,
}

export const Pill = (): JSX.Element => {
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
}

export const ComplexContent: Story = BasicTemplate.bind({})
ComplexContent.args = {
    children: (
        <span className="flex gap-2 items-center">
            <ProfilePicture name="ben" size="sm" />
            <span>
                Look at me I'm <b>bold!</b>
            </span>
        </span>
    ),
    onClose: () => alert('Close clicked!'),
}

export const OverflowOptions = (): JSX.Element => {
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
}
