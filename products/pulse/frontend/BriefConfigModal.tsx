import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input'
import { InputSelect } from 'lib/elements/InputSelect'
import { Modal } from 'lib/elements/Modal'
import { TextArea } from 'lib/elements/TextArea'

import { dashboardsModel } from '~/models/dashboardsModel'

import { pulseLogic } from './pulseLogic'

export function BriefConfigModal(): JSX.Element {
    const { configModalOpen, editingConfig, isConfigFormSubmitting } = useValues(pulseLogic)
    const { closeConfigModal, submitConfigForm } = useActions(pulseLogic)
    const { nameSortedDashboards } = useValues(dashboardsModel)

    return (
        <Modal
            isOpen={configModalOpen}
            onClose={closeConfigModal}
            title={editingConfig ? `Edit "${editingConfig.name}"` : 'New brief config'}
            footer={
                <>
                    <Button
                        onClick={closeConfigModal}
                        disabledReason={isConfigFormSubmitting ? 'Saving…' : undefined}
                    >
                        Cancel
                    </Button>
                    <Button type="primary" loading={isConfigFormSubmitting} onClick={submitConfigForm}>
                        {editingConfig ? 'Save' : 'Create'}
                    </Button>
                </>
            }
        >
            <Form logic={pulseLogic} formKey="configForm" enableFormOnSubmit className="flex flex-col gap-2">
                <Field name="name" label="Name">
                    <Input placeholder="e.g. Feature flags team" />
                </Field>
                <Field
                    name="focus_prompt"
                    label="Focus prompt"
                    info="Free text steering what the brief pays attention to and its tone."
                >
                    <TextArea placeholder="e.g. Increase adoption of our new onboarding flow and cut week-one drop-off" />
                </Field>
                <Field
                    name="dashboards"
                    label="Anchor dashboards"
                    info="The brief scouts the insights on these dashboards. Leave empty to fall back to the team's most recently accessed dashboards."
                >
                    {({ value, onChange }) => (
                        <InputSelect
                            mode="multiple"
                            value={((value as number[]) ?? []).map(String)}
                            onChange={(ids) => onChange(ids.map(Number))}
                            options={nameSortedDashboards.map((dashboard) => ({
                                key: String(dashboard.id),
                                label: dashboard.name || 'Untitled',
                            }))}
                            placeholder="Select dashboards"
                        />
                    )}
                </Field>
            </Form>
        </Modal>
    )
}
