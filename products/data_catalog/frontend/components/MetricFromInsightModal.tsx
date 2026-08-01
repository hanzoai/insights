import { useActions, useValues } from 'kea'
import { useMemo, useState } from 'react'

import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input'
import { Modal } from 'lib/elements/Modal'
import { Table } from 'lib/elements/Table'
import { Link } from 'lib/elements/Link'
import { slugify } from 'lib/utils/strings'
import { urls } from 'scenes/urls'

import { validateMetricName } from '../common'
import { metricsLogic } from '../metricsLogic'

export interface MetricFromInsightModalProps {
    insightShortId?: string
    insightName?: string
}

export function MetricFromInsightModal({ insightShortId, insightName }: MetricFromInsightModalProps): JSX.Element {
    const { metricFromInsightModalOpen, isCreatingMetric, allMetrics } = useValues(metricsLogic)
    const { createMetricFromInsight, closeMetricFromInsightModal } = useActions(metricsLogic)

    const [name, setName] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [description, setDescription] = useState('')

    const prefilledName = useMemo(() => slugify(insightName || '').replace(/-/g, '_'), [insightName])
    const effectiveName = name || prefilledName
    const nameError = validateMetricName(effectiveName)

    const metricsFromThisInsight = insightShortId
        ? allMetrics.filter((metric) => metric.source_insight_short_id === insightShortId)
        : []

    const submitDisabledReason = !insightShortId
        ? 'Save the insight first'
        : nameError
          ? nameError
          : !description.trim()
            ? 'Add a description'
            : undefined

    const handleClose = (): void => {
        setName('')
        setDisplayName('')
        setDescription('')
        closeMetricFromInsightModal()
    }

    const handleSubmit = (): void => {
        if (submitDisabledReason || !insightShortId) {
            return
        }
        createMetricFromInsight({
            name: effectiveName,
            display_name: displayName.trim(),
            description: description.trim(),
            source_insight_short_id: insightShortId,
        })
    }

    return (
        <Modal
            isOpen={metricFromInsightModalOpen}
            onClose={handleClose}
            width={560}
            title="Create metric from insight"
        >
            <Modal.Content>
                <div className="flex flex-col gap-4">
                    {metricsFromThisInsight.length > 0 && (
                        <div className="flex flex-col gap-1">
                            <span className="text-secondary">Metrics already created from this insight</span>
                            <Table
                                dataSource={metricsFromThisInsight}
                                columns={[
                                    {
                                        title: 'Name',
                                        key: 'name',
                                        render: (_, metric) => (
                                            <Link to={urls.dataCatalogMetric(metric.name)}>
                                                {metric.display_name || metric.name}
                                            </Link>
                                        ),
                                    },
                                ]}
                                size="small"
                                embedded
                            />
                        </div>
                    )}

                    <Field.Pure
                        label="Name"
                        error={effectiveName ? nameError : undefined}
                        info="A unique identifier for the metric, like monthly_active_users."
                    >
                        <Input
                            value={effectiveName}
                            onChange={setName}
                            placeholder="monthly_active_users"
                            autoFocus
                        />
                    </Field.Pure>

                    <Field.Pure label="Display name">
                        <Input value={displayName} onChange={setDisplayName} placeholder="Monthly active users" />
                    </Field.Pure>

                    <Field.Pure label="Description">
                        <Input
                            value={description}
                            onChange={setDescription}
                            placeholder="What this metric measures and how to read it"
                        />
                    </Field.Pure>
                </div>
            </Modal.Content>

            <Modal.Footer>
                <Button type="secondary" onClick={handleClose} disabled={isCreatingMetric}>
                    Cancel
                </Button>
                <Button
                    type="primary"
                    onClick={handleSubmit}
                    loading={isCreatingMetric}
                    disabledReason={submitDisabledReason}
                    data-attr="data-catalog-create-metric-from-insight-submit"
                >
                    Create metric
                </Button>
            </Modal.Footer>
        </Modal>
    )
}
