import { useActions, useValues } from 'kea'

import { Banner } from 'lib/elements/Banner'
import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input'
import { InputSelect } from 'lib/elements/InputSelect/InputSelect'
import { Modal } from 'lib/elements/Modal'
import { SegmentedButton } from 'lib/elements/SegmentedButton'
import { TextArea } from 'lib/elements/TextArea'
import { TextAreaMarkdown } from 'lib/elements/TextArea/TextAreaMarkdown'

import { validateMetricName } from '../common'
import { metricsLogic, NewMetricDefinitionType } from '../metricsLogic'

// The Text (markdown) option is hidden until its editor UI is polished.
const DEFINITION_TYPE_OPTIONS: { value: NewMetricDefinitionType; label: string }[] = [
    { value: 'sql', label: 'SQL' },
    { value: 'insight', label: 'Insight' },
]

export function NewMetricModal(): JSX.Element {
    const { newMetricModalOpen, newMetricForm, isCreatingMetric, savedInsights, savedInsightsLoading } =
        useValues(metricsLogic)
    const { setNewMetricForm, createMetric, closeNewMetricModal, openSqlEditorForNewMetric, setInsightSearch } =
        useActions(metricsLogic)

    const nameError = validateMetricName(newMetricForm.name.trim())
    const submitDisabledReason = nameError
        ? nameError
        : !newMetricForm.description.trim()
          ? 'Add a description'
          : newMetricForm.definitionType === 'sql'
            ? 'Create SQL metrics from the SQL editor'
            : newMetricForm.definitionType === 'insight' && !newMetricForm.sourceInsightShortId
              ? 'Choose an insight'
              : newMetricForm.definitionType === 'markdown' && !newMetricForm.markdown.trim()
                ? 'Add the markdown definition'
                : undefined

    return (
        <Modal isOpen={newMetricModalOpen} onClose={closeNewMetricModal} width={640} title="New metric">
            <Modal.Content>
                <div className="flex flex-col gap-4">
                    <Field.Pure
                        label="Name"
                        error={newMetricForm.name.trim() ? nameError : undefined}
                        info="A unique identifier for the metric, like monthly_active_users."
                    >
                        <Input
                            value={newMetricForm.name}
                            onChange={(name) => setNewMetricForm({ name })}
                            placeholder="monthly_active_users"
                            autoFocus
                        />
                    </Field.Pure>

                    <Field.Pure label="Display name" info="A human-friendly name shown in the catalog.">
                        <Input
                            value={newMetricForm.display_name}
                            onChange={(display_name) => setNewMetricForm({ display_name })}
                            placeholder="Monthly active users"
                        />
                    </Field.Pure>

                    <Field.Pure label="Description">
                        <TextArea
                            value={newMetricForm.description}
                            onChange={(description) => setNewMetricForm({ description })}
                            placeholder="What this metric measures and how to read it"
                            minRows={2}
                        />
                    </Field.Pure>

                    <Field.Pure label="Unit" info="How the result is measured, like users, dollars, or percent.">
                        <Input
                            value={newMetricForm.unit}
                            onChange={(unit) => setNewMetricForm({ unit })}
                            placeholder="users"
                        />
                    </Field.Pure>

                    <Field.Pure label="Definition">
                        <SegmentedButton
                            value={newMetricForm.definitionType}
                            onChange={(definitionType) => setNewMetricForm({ definitionType })}
                            options={DEFINITION_TYPE_OPTIONS}
                        />
                    </Field.Pure>

                    {newMetricForm.definitionType === 'markdown' && (
                        <Field.Pure label="Text">
                            <TextAreaMarkdown
                                value={newMetricForm.markdown}
                                onChange={(markdown) => setNewMetricForm({ markdown })}
                                placeholder="Numbered steps describing how to calculate this metric"
                            />
                        </Field.Pure>
                    )}

                    {newMetricForm.definitionType === 'sql' && (
                        <Banner type="info">
                            <div className="flex flex-col items-start gap-2">
                                <span>Write the query in the SQL editor, then use Save as metric to define it.</span>
                                <Button
                                    type="secondary"
                                    onClick={openSqlEditorForNewMetric}
                                    data-attr="data-catalog-new-metric-open-sql-editor"
                                >
                                    Open SQL editor
                                </Button>
                            </div>
                        </Banner>
                    )}

                    {newMetricForm.definitionType === 'insight' && (
                        <Field.Pure
                            label="Insight"
                            info="The metric snapshots the insight's query and tracks drift against it."
                        >
                            <InputSelect
                                mode="single"
                                value={newMetricForm.sourceInsightShortId ? [newMetricForm.sourceInsightShortId] : []}
                                onChange={(values) => setNewMetricForm({ sourceInsightShortId: values[0] || '' })}
                                options={savedInsights.map((insight) => ({
                                    key: insight.short_id,
                                    label: insight.label,
                                }))}
                                loading={savedInsightsLoading}
                                onInputChange={setInsightSearch}
                                placeholder="Search insights"
                                data-attr="data-catalog-new-metric-insight"
                            />
                        </Field.Pure>
                    )}
                </div>
            </Modal.Content>

            <Modal.Footer>
                <Button type="secondary" onClick={closeNewMetricModal} disabled={isCreatingMetric}>
                    Cancel
                </Button>
                <Button
                    type="primary"
                    onClick={createMetric}
                    loading={isCreatingMetric}
                    disabledReason={submitDisabledReason}
                    data-attr="data-catalog-create-metric-submit"
                >
                    Create metric
                </Button>
            </Modal.Footer>
        </Modal>
    )
}
