import { Meta, StoryFn, StoryObj } from '@storybook/react'
import React from 'react'

import { IconPlusSmall } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'

import { Badge, BadgeProps } from './Badge'

type Story = StoryObj<typeof Badge>
const meta: Meta<typeof Badge> = {
    title: 'Elements/Badge/Badge',
    component: Badge,
    tags: ['autodocs'],
}
export default meta

const Template: StoryFn<typeof Badge> = (props) => (
    <div className="flex">
        <Badge {...props} />
    </div>
)

export const Standard: Story = Template.bind({})
Standard.args = { content: '@' }

export const Positioning: StoryFn<typeof Badge> = () => {
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
}

export const Sizes: StoryFn<typeof Badge> = () => {
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
}

export const Status: StoryFn<typeof Badge> = () => {
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
}

export const Active: StoryFn<typeof Badge> = () => {
    return (
        <div className="flex deprecated-space-x-2 items-center my-1 mr-1">
            <span>inactive:</span>
            <Badge content={<IconPlusSmall />} />
            <span>active:</span>
            <Badge content={<IconPlusSmall />} active />
        </div>
    )
}
