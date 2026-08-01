import { Meta, StoryObj } from '@storybook/react'

import { Dialog } from '@hanzo/elements'

import { aiConsentLegalDialogProps } from './aiConsentCopy'

const noop = (): void => {}

const meta: Meta<typeof Dialog> = {
    title: 'Scenes-Other/Settings/Organization/AI Consent Legal Dialog',
    component: Dialog,
    parameters: {
        layout: 'centered',
    },
}
export default meta

type Story = StoryObj<typeof Dialog>

export const Default: Story = {
    render: () => (
        <div className="bg-default p-4">
            <Dialog {...aiConsentLegalDialogProps({ onConfirm: noop })} inline />
        </div>
    ),
}
