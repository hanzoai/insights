import type { Meta, StoryObj } from '@storybook/react'

import { Input, Link } from '@hanzo/elements'

import { Button } from 'lib/elements/Button'

import { Field } from '../Field'
import { Dialog, DialogProps, FormDialog, FormDialogProps } from './Dialog'

type Story = StoryObj<DialogProps>
const meta: Meta<DialogProps> = {
    title: 'Lemon UI/Lemon Dialog',
    component: Dialog,
    args: {
        title: 'Do you want to do the thing?',
        description:
            'This is a simple paragraph that illustrates describing a decision the user is going to take. Dialogs typically ask a single question and provide 1-3 actions for responding. ',

        primaryButton: {
            children: 'Primary',
            onClick: () => alert('Primary Clicked!'),
        },

        secondaryButton: {
            children: 'Secondary',
            onClick: () => alert('Secondary Clicked!'),
        },

        tertiaryButton: {
            children: 'Tertiary',
            onClick: () => alert('Tertiary Clicked!'),
        },
    },
    parameters: {
        docs: {
            description: {
                component: `
[Related Figma area](https://www.figma.com/file/Y9G24U4r04nEjIDGIEGuKI/Insights-Design-System-One?node-id=3139%3A1388)

Dialogs are blocking prompts that force a user decision or action.
When a dialog presents a desctructive choice, the actions should align with that destructive / warning color palette options.

Dialogs are opened imperatively (i.e. calling \`Dialog.open()\`) whereas Modals are used declaratively.
            `,
            },
        },
    },
    tags: ['autodocs'],
    render: (props: DialogProps) => {
        const onClick = (): void => {
            Dialog.open(props)
        }
        return (
            <div>
                <div className="bg-border p-4">
                    <Dialog {...props} inline />
                </div>
                <Button type="primary" onClick={() => onClick()} className="mx-auto mt-2">
                    Open as modal
                </Button>
            </div>
        )
    },
}
export default meta

export const Minimal: Story = {
    args: {
        title: 'Notice',
        description: undefined,
        primaryButton: undefined,
        secondaryButton: undefined,
        tertiaryButton: undefined,
    },
}

export const Customised: Story = {
    args: {
        title: 'Are you sure you want to delete "FakeOrganization"?',
        description: (
            <>
                This action cannot be undone. If you opt to delete the organization and its corresponding events, the
                events will not be immediately removed. Instead these events will be deleted on a set schedule during
                non-peak usage times. <Link to="https://hanzo.ai">Learn more</Link>
            </>
        ),
        primaryButton: {
            children: 'Delete organization',
            status: 'danger',
            onClick: () => alert('Organization Deleted!'),
        },

        secondaryButton: {
            children: 'Cancel',
            onClick: () => alert('Cancelled!'),
        },

        tertiaryButton: {
            children: 'Delete organization and all corresponding events',
            status: 'danger',
            onClick: () => alert('Organization and all events deleted!'),
        },
    },
}

export const Form: StoryObj<FormDialogProps> = {
    render: (props) => {
        const onClick = (): void => {
            Dialog.openForm(props)
        }
        return (
            <div>
                <div className="bg-default p-4">
                    <FormDialog {...props} inline />
                </div>
                <Button type="primary" onClick={() => onClick()} className="mx-auto mt-2">
                    Open as modal
                </Button>
            </div>
        )
    },
    args: {
        title: 'This is a test',
        initialValues: { name: 'one' },
        description: undefined,
        tertiaryButton: undefined,
        content: (
            <Field name="name">
                <Input placeholder="Please enter the new name" autoFocus />
            </Field>
        ),
    },
    name: 'Category - Elements',
}
