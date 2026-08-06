import type { Meta, StoryObj } from '@storybook/react'

import { Checkbox, CheckboxProps } from './Checkbox'

type Story = StoryObj<CheckboxProps>
const meta: Meta<CheckboxProps> = {
    title: 'Lemon UI/Lemon Checkbox',
    component: Checkbox,
    tags: ['autodocs'],
}
export default meta

export const Basic: Story = {
    args: {
        label: 'Check this out',
    },
}

export const Overview: Story = {
    render: () => {
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
    },
}

export const Disabled: Story = {
    args: {
        label: "You can't check this out",
        disabled: true,
    },
}

export const DisabledWithReason: Story = {
    args: {
        label: "You can't check this out",
        disabledReason: 'This is not the way to Amarillo',
    },
}

export const NoLabel: Story = {
    args: {},
}

export const Bordered: Story = {
    args: {
        label: 'A border makes for good visual separation if there is other content neighboring a checkbox. Probably not used as part of a form.',
        bordered: true,
    },
}
