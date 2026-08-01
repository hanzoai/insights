import { Meta, StoryObj } from '@storybook/react'

import { IconInfo } from '@hanzo/icons'
import { Tooltip } from '@hanzo/elements'

import { KeyboardShortcut, KeyboardShortcutProps } from './KeyboardShortcut'

const meta: Meta<KeyboardShortcutProps> = {
    title: 'Insights 3000/Keyboard Shortcut',
    component: KeyboardShortcut,
    tags: ['autodocs'],
}
type Story = StoryObj<KeyboardShortcutProps>
export default meta

export const Default: Story = {
    args: {
        command: true,
        shift: true,
        k: true,
    },
}

export const WithinTooltip: Story = {
    render: () => {
        return (
            <Tooltip
                title={
                    <>
                        Press <KeyboardShortcut command shift k /> to create a new feature flag
                    </>
                }
                placement="right"
                visible
            >
                <IconInfo className="text-2xl" />
            </Tooltip>
        )
    },
}
