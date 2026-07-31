import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Input, InputSelect, Modal, Select, TextArea } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { userLogic } from 'scenes/userLogic'

import { TemplateJsonModal } from './TemplateJsonModal'
import { WorkflowTemplateLogicProps, workflowTemplateLogic } from './workflowTemplateLogic'
import { workflowTemplatesLogic } from './workflowTemplatesLogic'

export function SaveAsTemplateModal(props: WorkflowTemplateLogicProps = {}): JSX.Element {
    const { user } = useValues(userLogic)
    const logic = workflowTemplateLogic(props)
    const { saveAsTemplateModalVisible, isTemplateFormSubmitting, templateForm, isEditMode } = useValues(logic)
    const { hideSaveAsTemplateModal, submitTemplateForm, showTemplateJsonModal } = useActions(logic)
    const templatesLogicValues = useValues(workflowTemplatesLogic)
    const availableTags = templatesLogicValues.availableTags || []

    const isGlobalTemplate = templateForm.scope === 'global'
    const showSeeJsonButton = user?.is_staff && isGlobalTemplate

    return (
        <>
            <TemplateJsonModal {...props} />
            <Modal
                onClose={hideSaveAsTemplateModal}
                isOpen={saveAsTemplateModalVisible}
                title={isEditMode ? 'Update template' : 'Save as template'}
                footer={
                    <>
                        <Button type="secondary" onClick={hideSaveAsTemplateModal}>
                            Cancel
                        </Button>
                        {showSeeJsonButton ? (
                            <Button type="primary" onClick={showTemplateJsonModal}>
                                See JSON
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                onClick={submitTemplateForm}
                                loading={isTemplateFormSubmitting}
                                disabledReason={!templateForm.name ? 'Name is required' : undefined}
                            >
                                {isEditMode ? 'Update template' : 'Save template'}
                            </Button>
                        )}
                    </>
                }
            >
                <Form logic={workflowTemplateLogic} props={props} formKey="templateForm">
                    <div className="space-y-4">
                        <Field name="name" label="Name">
                            <Input placeholder="Template name" autoFocus />
                        </Field>

                        <Field name="description" label="Description (optional)">
                            <TextArea placeholder="Template description" rows={3} />
                        </Field>

                        <Field name="image_url" label="Image URL (optional)">
                            <Input placeholder="https://example.com/image.png" />
                        </Field>

                        <Field name="tags" label="Tags (optional)">
                            <InputSelect
                                mode="multiple"
                                value={templateForm.tags}
                                onChange={(tags) => {
                                    workflowTemplateLogic(props).actions.setTemplateFormValue('tags', tags)
                                }}
                                options={availableTags.map((tag: string) => ({
                                    key: tag,
                                    value: tag,
                                    label: tag,
                                }))}
                                allowCustomValues={true}
                                placeholder="Select or type tags"
                            />
                        </Field>

                        {!(isEditMode && isGlobalTemplate) && (
                            <Field name="scope" label="Scope">
                                <Select
                                    value={templateForm.scope}
                                    options={[
                                        { value: 'team', label: 'This project only' },
                                        { value: 'organization', label: 'All projects in organization' },
                                        ...(user?.is_staff
                                            ? [
                                                  {
                                                      value: 'global' as const,
                                                      label: 'Official (visible to everyone)',
                                                  },
                                              ]
                                            : []),
                                    ]}
                                />
                            </Field>
                        )}
                    </div>
                </Form>
            </Modal>
        </>
    )
}
