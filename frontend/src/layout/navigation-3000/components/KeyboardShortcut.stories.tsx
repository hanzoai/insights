import { Meta, StoryFn } from '@storybook/react'

import { IconInfo } from '@hanzo/icons'
import { Tooltip } from '@hanzo/lemon-ui'

import { KeyboardShortcut } from './KeyboardShortcut'

const meta: Meta<typeof KeyboardShortcut> = {
    title: 'Insights 3000/Keyboard Shortcut',
    component: KeyboardShortcut,
    tags: ['autodocs'],
}
export default meta

export const Default = {
    args: {
        cmd: true,
        shift: true,
        k: true,
    },
}

export const WithinTooltip: StoryFn = () => {
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
}
