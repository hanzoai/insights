import { Meta, StoryObj } from '@storybook/react'

import { SDKSetupInstructions } from './SDKSetupInstructions'

const meta: Meta<typeof SDKSetupInstructions> = {
    component: SDKSetupInstructions,
    title: 'Components/SDK setup instructions',
}
export default meta
type Story = StoryObj<typeof SDKSetupInstructions>

/** Every SDK renders its steps through the shared docs components, so one is enough to cover them. */
export const Web: Story = {
    render: () => (
        <div className="p-4">
            <SDKSetupInstructions />
        </div>
    ),
}
