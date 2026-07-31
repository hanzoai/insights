import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Input, InputSelect, Modal, TextArea, Link } from '@hanzo/elements'

import { MemberSelect } from 'lib/components/MemberSelect'
import { Banner } from 'lib/elements/Banner'
import { Field } from 'lib/elements/Field'
import { urls } from 'scenes/urls'

import { tagsModel } from '~/models/tagsModel'
import { UserBasicType } from '~/types'

import { eventDefinitionModalLogic } from './eventDefinitionModalLogic'

export interface EventDefinitionModalProps {
    isOpen: boolean
    onClose: () => void
}

export function EventDefinitionModal({ isOpen, onClose }: EventDefinitionModalProps): JSX.Element {
    const logic = eventDefinitionModalLogic({ onClose })
    const { eventDefinitionForm, isEventDefinitionFormSubmitting, existingEvent } = useValues(logic)
    const { setEventDefinitionFormValue: setFormValue, submitEventDefinitionForm } = useActions(logic)
    const { tags } = useValues(tagsModel)

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create event"
            description="Create a new event definition before any events are captured. First seen and last seen will be set when the first event is ingested."
            footer={
                <>
                    <Button type="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={submitEventDefinitionForm}
                        loading={isEventDefinitionFormSubmitting}
                        disabled={!eventDefinitionForm.name || !!existingEvent}
                    >
                        Create event
                    </Button>
                </>
            }
        >
            <Form logic={eventDefinitionModalLogic} formKey="eventDefinitionForm" className="space-y-4">
                <Banner type="info">
                    <strong>Note:</strong> Event names cannot be changed after creation. Choose your name carefully.
                </Banner>

                {existingEvent && (
                    <Banner type="warning">
                        An event with the name "{existingEvent.name}" already exists.{' '}
                        <Link to={urls.eventDefinition(existingEvent.id)}>View existing event</Link>
                    </Banner>
                )}

                <Field name="name" label="Event name">
                    <Input
                        value={eventDefinitionForm.name}
                        onChange={(value) => setFormValue('name', value)}
                        placeholder="e.g., user_signed_up"
                        autoFocus
                        data-attr="event-definition-name-input"
                    />
                </Field>

                <Field name="description" label="Description" showOptional>
                    <TextArea
                        value={eventDefinitionForm.description}
                        onChange={(value) => setFormValue('description', value)}
                        placeholder="What does this event represent?"
                        data-attr="event-definition-description-input"
                    />
                </Field>

                <div className="flex items-center gap-4">
                    <Field name="owner" label="Owner" showOptional className="w-60">
                        <MemberSelect
                            value={eventDefinitionForm.owner ?? null}
                            onChange={(user: UserBasicType | null) => setFormValue('owner', user?.id ?? null)}
                            data-attr="event-definition-owner-select"
                        />
                    </Field>

                    <Field name="tags" label="Tags" showOptional className="flex-1">
                        <InputSelect
                            mode="multiple"
                            allowCustomValues
                            value={eventDefinitionForm.tags || []}
                            options={tags.map((tag) => ({ key: tag, label: tag }))}
                            onChange={(tags) => setFormValue('tags', tags)}
                            placeholder="Add tags..."
                            data-attr="event-definition-tags-input"
                        />
                    </Field>
                </div>
            </Form>
        </Modal>
    )
}
