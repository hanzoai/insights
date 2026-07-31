import { Meta, StoryFn, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Modal } from '@hanzo/elements'

import { Label, LabelProps } from './Label'

type Story = StoryObj<typeof Label>
const meta: Meta<typeof Label> = {
    title: 'Elements/Label',
    component: Label,
    parameters: {
        docs: {
            description: {
                component: `

[Related Figma area](https://www.figma.com/file/Y9G24U4r04nEjIDGIEGuKI/Insights-Design-System-One?node-id=3139%3A1388)

Labels provide common styling and options for labeling form elements. They can be used directly but most commonly should be used via the \`Field\` component.

`,
            },
        },
    },
    tags: ['autodocs'],
}
export default meta

const Template: StoryFn<typeof Label> = (props: LabelProps) => {
    return <Label {...props} />
}

export const Basic: Story = Template.bind({})
Basic.args = {
    info: 'This field is optional',
    showOptional: true,
    children: 'Label',
}

function ExplanationModal({ setOpen, open }: { setOpen: (open: boolean) => void; open: boolean }): JSX.Element {
    return (
        <Modal title="Let me explain you the label" isOpen={open} onClose={() => setOpen(false)}>
            <div className="bg-surface-primary w-full max-w-248 h-full ml-auto relative z-10 overflow-auto">
                <h3 className="text-lg text-semibold opacity-50 m-0">Labels are awesome.</h3>
                <p>They truly are.</p>
            </div>
        </Modal>
    )
}

export const Overview = (): JSX.Element => {
    const [open, setOpen] = useState(false)
    return (
        <div className="flex flex-col gap-2">
            <Label>Basic</Label>
            <Label info="I am some extra info">Label with info</Label>

            <Label info="I am some extra info" showOptional>
                Pineapple on Pizza
            </Label>
            <Label info="I am some extra info">
                Label with info <span>custom subtext</span>
            </Label>
            <Label onExplanationClick={() => setOpen(true)}>Label with explanation modal</Label>
            <ExplanationModal open={open} setOpen={setOpen} />
        </div>
    )
}
