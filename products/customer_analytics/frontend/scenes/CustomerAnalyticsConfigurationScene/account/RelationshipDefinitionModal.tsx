import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Input, Modal, TextArea } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { relationshipDefinitionsLogic } from './relationshipDefinitionsLogic'

export function RelationshipDefinitionModal(): JSX.Element {
    const { modalVisible, editingDefinition, isRelationshipDefinitionFormSubmitting } =
        useValues(relationshipDefinitionsLogic)
    const { closeModal, submitRelationshipDefinitionForm } = useActions(relationshipDefinitionsLogic)

    return (
        <Modal
            isOpen={modalVisible}
            onClose={closeModal}
            title={editingDefinition ? 'Edit relationship' : 'New relationship'}
            footer={
                <>
                    <Button type="secondary" onClick={closeModal}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={submitRelationshipDefinitionForm}
                        loading={isRelationshipDefinitionFormSubmitting}
                    >
                        {editingDefinition ? 'Save' : 'Create'}
                    </Button>
                </>
            }
        >
            <Form
                logic={relationshipDefinitionsLogic}
                formKey="relationshipDefinitionForm"
                enableFormOnSubmit
                className="flex flex-col gap-4"
            >
                <Field name="name" label="Name">
                    <Input placeholder="e.g. Onboarding manager" autoFocus fullWidth />
                </Field>
                <Field name="description" label="Description" showOptional>
                    <TextArea
                        placeholder="What this relationship means, e.g. 'Runs onboarding for this account'"
                        minRows={2}
                    />
                </Field>
            </Form>
        </Modal>
    )
}
