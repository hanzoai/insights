import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

import { IconPlusSmall } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'

import { Badge, BadgeProps } from './Badge'

type Story = StoryObj<BadgeProps>
const meta: Meta<BadgeProps> = {
    title: 'Lemon UI/Lemon Badge/Lemon Badge',
    component: Badge as any,
    tags: ['autodocs'],
}
export default meta

export const Standard: Story = {
    render: (props) => (
        <div className="flex">
            <Badge {...props} />
        </div>
    ),
    args: { content: '@' },
}

export const Positioning: StoryObj<BadgeProps> = {
    render: () => {
        return (
            <div className="deprecated-space-y-4 m-2">
                <Button type="secondary">
                    top-right
                    <Badge content={<IconPlusSmall />} position="top-right" />
                </Button>

                <Button type="secondary">
                    top-left
                    <Badge content={<IconPlusSmall />} position="top-left" />
                </Button>

                <Button type="secondary">
                    bottom-right
                    <Badge content={<IconPlusSmall />} position="bottom-right" />
                </Button>

                <Button type="secondary">
                    bottom-left
                    <Badge content={<IconPlusSmall />} position="bottom-left" />
                </Button>
            </div>
        )
    },
}

export const Sizes: StoryObj<BadgeProps> = {
    render: () => {
        return (
            <div className="flex deprecated-space-x-2 items-center">
                <span>xsmall:</span>
                <Badge content={<IconPlusSmall />} size="xsmall" />
                <span>small:</span>
                <Badge content={<IconPlusSmall />} size="small" />
                <span>medium:</span>
                <Badge content={<IconPlusSmall />} size="medium" />
                <span>large:</span>
                <Badge content={<IconPlusSmall />} size="large" />
            </div>
        )
    },
}

export const Status: StoryObj<BadgeProps> = {
    render: () => {
        const statuses = ['primary', 'success', 'warning', 'danger', 'muted', 'data']
        return (
            <div className="flex deprecated-space-x-2 items-center">
                {statuses.map((status) => (
                    <React.Fragment key={status}>
                        <span>{status}</span>
                        <Badge content={<IconPlusSmall />} status={status as BadgeProps['status']} />
                    </React.Fragment>
                ))}
            </div>
        )
    },
}

export const Active: StoryObj<BadgeProps> = {
    render: () => {
        return (
            <div className="flex deprecated-space-x-2 items-center my-1 mr-1">
                <span>inactive:</span>
                <Badge content={<IconPlusSmall />} />
                <span>active:</span>
                <Badge content={<IconPlusSmall />} active />
            </div>
        )
    },
}
