import { Meta, StoryFn, StoryObj } from '@storybook/react'

import { Checkbox, CheckboxProps } from './Checkbox'

type Story = StoryObj<typeof Checkbox>
const meta: Meta<typeof Checkbox> = {
    title: 'Elements/Checkbox',
    component: Checkbox,
    tags: ['autodocs'],
}
export default meta

const Template: StoryFn<typeof Checkbox> = (props: CheckboxProps) => {
    return <Checkbox {...props} />
}

export const Basic: Story = Template.bind({})
Basic.args = {
    label: 'Check this out',
}

export const Overview = (): JSX.Element => {
    return (
        <div className="deprecated-space-y-2">
            <Checkbox label="Unchecked" />
            <Checkbox label="Checked" checked />
            <Checkbox label="Indeterminate" checked="indeterminate" />

            <Checkbox label="Bordered Unchecked" bordered />
            <Checkbox label="Bordered Checked" checked bordered />
            <Checkbox label="Bordered Indeterminate" checked="indeterminate" bordered />

            <Checkbox label="Bordered FullWidth" fullWidth bordered />
            <Checkbox label="Bordered small" bordered size="small" />

            <div className="w-20">
                <Checkbox label="Bordered with a really long label" bordered />
            </div>
        </div>
    )
}

export const Disabled: Story = Template.bind({})
Disabled.args = {
    label: "You can't check this out",
    disabled: true,
}

export const DisabledWithReason: Story = Template.bind({})
DisabledWithReason.args = {
    label: "You can't check this out",
    disabledReason: 'This is not the way to Amarillo',
}

export const NoLabel: Story = Template.bind({})
NoLabel.args = {}

export const Bordered: Story = Template.bind({})
Bordered.args = {
    label: 'A border makes for good visual separation if there is other content neighboring a checkbox. Probably not used as part of a form.',
    bordered: true,
}
