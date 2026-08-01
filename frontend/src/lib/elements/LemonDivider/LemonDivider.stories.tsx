import type { Meta, StoryObj } from '@storybook/react'

import { Button } from 'lib/elements/Button'
import { Row } from 'lib/elements/Row'

import { Lettermark, LettermarkColor } from '../Lettermark/Lettermark'
import { ProfileBubbles } from '../ProfilePicture'
import { Divider, DividerProps } from './Divider'

type Story = StoryObj<DividerProps>
const meta: Meta<DividerProps> = {
    title: 'Lemon UI/Lemon Divider',
    component: Divider,
    tags: ['autodocs'],
}
export default meta

const HorizontalRender = (props: DividerProps): JSX.Element => {
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

const VerticalRender = (props: DividerProps): JSX.Element => {
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

export const Default: Story = {
    args: {},
    render: (props) => <HorizontalRender {...props} />,
}

export const Large: Story = {
    args: { className: 'my-6' },
    render: (props) => <HorizontalRender {...props} />,
}

export const ThickDashed: Story = {
    args: { thick: true, dashed: true },
    render: (props) => <HorizontalRender {...props} />,
}

export const Vertical: Story = {
    args: { vertical: true },
    render: (props) => <VerticalRender {...props} />,
}

export const VerticalDashed: Story = {
    args: { vertical: true, dashed: true },
    render: (props) => <VerticalRender {...props} />,
}
