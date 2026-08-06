import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Button } from '../Button'
import { Tab, Tabs as TabsComponent, TabsProps } from './Tabs'

type Story = StoryObj<TabsProps<string>>
const meta: Meta<TabsProps<string>> = {
    title: 'Lemon UI/Lemon Tabs',
    component: TabsComponent as any,
    argTypes: {
        tabs: {
            control: {
                type: 'object',
            },
        },
        onChange: { control: { disable: true } },
    },
    tags: ['autodocs'],
    args: {
        tabs: [
            {
                key: 'calendar',
                label: 'Calendar',
                content: <div>Imagine some calendar here. 🗓️</div>,
            },
            {
                key: 'calculator',
                label: 'Calculator',
                tooltip: 'Calculate 2+2, as well as 1/0.',
                content: <div>Imagine some calculator here. 🔢</div>,
            },
            {
                key: 'banana',
                label: 'Banana',
                content: <div>Imagine some banana here. 🍌</div>,
            },
            {
                key: 'settings',
                label: 'Settings',
                content: <div>Imagine some settings here. ⚙️</div>,
            },
        ] as Tab<'calendar' | 'calculator' | 'banana' | 'settings'>[],
    },
    render: (props) => {
        const [activeKey, setActiveKey] = useState((props.tabs[0] as Tab<string | number>).key)

        return <TabsComponent {...props} activeKey={activeKey} onChange={(newValue) => setActiveKey(newValue)} />
    },
}
export default meta

export const Default: Story = {
    args: {},
}

export const Small: Story = {
    args: { size: 'small' },
}

export const RightSlot: Story = {
    args: {
        rightSlot: (
            <Button type="secondary" size="small">
                Right slot
            </Button>
        ),
    },
}
