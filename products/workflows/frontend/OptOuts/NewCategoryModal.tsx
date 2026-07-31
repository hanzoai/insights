import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Input, Modal, Select, TextArea, Link } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { newCategoryLogic } from './newCategoryLogic'

interface MessageCategory {
    id: string
    key: string
    name: string
    description: string
    public_description: string
    category_type: string
}

interface NewCategoryModalProps {
    isOpen: boolean
    onClose: () => void
    category?: MessageCategory | null
}

export function NewCategoryModal({ isOpen, onClose, category }: NewCategoryModalProps): JSX.Element {
    const logic = newCategoryLogic({ category, onSuccess: onClose })
    const { isCategoryFormSubmitting } = useValues(logic)
    const { submitCategoryForm, resetCategoryForm } = useActions(logic)

    const handleClose = (): void => {
        resetCategoryForm()
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={category ? 'Edit message category' : 'New message category'}
            footer={
                <div className="flex gap-2 justify-end">
                    <Button type="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button type="primary" loading={isCategoryFormSubmitting} onClick={submitCategoryForm}>
                        {category ? 'Update' : 'Create'}
                    </Button>
                </div>
            }
        >
            <Form
                logic={newCategoryLogic}
                formKey="categoryForm"
                props={{ category, onSuccess: onClose }}
                className="space-y-4"
            >
                <Field name="name" label="Name">
                    <Input placeholder="e.g., Product updates" />
                </Field>

                <Field name="key" label="Key" info="This is the unique identifier for the category">
                    <Input
                        placeholder="e.g., product_updates"
                        disabledReason={category ? 'Key cannot be changed after creation' : undefined}
                    />
                </Field>

                <Field
                    name="category_type"
                    label="Message type"
                    info="Marketing messages can be opted out of by users. Transactional messages are not affected by recipient preferences"
                    help={
                        <p>
                            Be sure to comply with local regulations regarding marketing communications (
                            <Link
                                to="https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business"
                                target="_blank"
                            >
                                CAN-SPAM
                            </Link>
                            ,{' '}
                            <Link to="https://gdpr.eu/email-encryption/" target="_blank">
                                GDPR
                            </Link>
                            )
                        </p>
                    }
                >
                    <Select
                        options={[
                            { label: 'Marketing', value: 'marketing' },
                            { label: 'Transactional', value: 'transactional' },
                        ]}
                        placeholder="Select message type"
                    />
                </Field>

                <Field name="description" label="Description">
                    <TextArea placeholder="Internal description for your team" rows={3} />
                </Field>

                <Field
                    name="public_description"
                    label="Public description"
                    help="This description will be shown to users in the email preferences page."
                >
                    <TextArea
                        placeholder="e.g., Latest updates on feature launches, product improvements, and more."
                        rows={3}
                    />
                </Field>
            </Form>
        </Modal>
    )
}
