import { Meta, StoryFn, StoryObj } from '@storybook/react'

import { IconInfo } from '@hanzo/icons'

import { Collapse as CollapseComponent } from './Collapse'

type Story = StoryObj<typeof CollapseComponent>
const meta: Meta<typeof CollapseComponent> = {
    title: 'Elements/Collapse',
    component: CollapseComponent,
    args: {
        panels: [
            {
                key: '1',
                header: 'Panel 1',
                content: <span>Panel 1 content</span>,
            },
            {
                key: '2',
                header: 'Panel 2',
                content: <span>Panel 2 content</span>,
            },
        ],
    },
    tags: ['autodocs'],
}
export default meta

const Template: StoryFn<typeof CollapseComponent> = (props) => {
    return <CollapseComponent {...props} />
}

export const Single: Story = Template.bind({})
Single.args = { defaultActiveKey: '1' }

export const Multiple: Story = Template.bind({})
Multiple.args = { defaultActiveKeys: ['1', '2'], multiple: true }

export const Small: Story = Template.bind({})
Small.args = { size: 'small', multiple: true }

export const Large: Story = Template.bind({})
Large.args = { size: 'large', multiple: true }

export const CustomizedHeaders: Story = Template.bind({})
CustomizedHeaders.args = {
    panels: [
        {
            key: '1',
            header: {
                sideAction: {
                    onClick: () => alert('You clicked me!'),
                    icon: <IconInfo />,
                },
                children: (
                    <span className="text-sm">
                        I am <span className="italic">customized...</span>
                    </span>
                ),
            },
            content: <span>Panel 1 content</span>,
        },
        {
            key: '2',
            header: 'I am not :(',
            content: <span>Panel 2 content</span>,
        },
    ],
}
