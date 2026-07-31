import { Meta, StoryFn, StoryObj } from '@storybook/react'

import { Button } from 'lib/elements/Button'
import { Row } from 'lib/elements/Row'

import { Lettermark, LettermarkColor } from '../Lettermark/Lettermark'
import { ProfileBubbles } from '../ProfilePicture'
import { Divider, DividerProps } from './Divider'

type Story = StoryObj<typeof Divider>
const meta: Meta<typeof Divider> = {
    title: 'Elements/Divider',
    component: Divider,
    tags: ['autodocs'],
}
export default meta

const HorizontalTemplate: StoryFn<typeof Divider> = (props: DividerProps) => {
    return (
        <>
            <Row icon={<Lettermark name={1} color={LettermarkColor.Gray} />}>
                I just wanna tell you how I'm feeling
            </Row>
            <Row icon={<Lettermark name={2} color={LettermarkColor.Gray} />}>Gotta make you understand</Row>
            <Divider {...props} />
            <Row icon={<Lettermark name={3} color={LettermarkColor.Gray} />}>Never gonna give you up</Row>
            <Row icon={<Lettermark name={4} color={LettermarkColor.Gray} />}>Never gonna let you down</Row>
        </>
    )
}

const VerticalTemplate: StoryFn<typeof Divider> = (props: DividerProps) => {
    return (
        <div className="flex items-center">
            <ProfileBubbles
                people={[
                    {
                        email: 'tim@hanzo.ai',
                    },
                    {
                        email: 'michael@hanzo.ai',
                    },
                ]}
            />
            <Divider {...props} />
            <Button type="secondary">Collaborate</Button>
        </div>
    )
}
VerticalTemplate.args = { vertical: true }

export const Default: Story = HorizontalTemplate.bind({})
Default.args = {}

export const Large: Story = HorizontalTemplate.bind({})
Large.args = { className: 'my-6' }

export const ThickDashed: Story = HorizontalTemplate.bind({})
ThickDashed.args = { thick: true, dashed: true }

export const Vertical: Story = VerticalTemplate.bind({})
Vertical.args = { ...VerticalTemplate.args }

export const VerticalDashed: Story = VerticalTemplate.bind({})
VerticalDashed.args = { ...VerticalTemplate.args, dashed: true }
