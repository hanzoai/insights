import { useActions, useValues } from 'kea'

import { Button, Dialog, Input, Label, Modal } from '@hanzo/elements'

import type { ExperimentExposureCriteria, ExperimentMetric } from '~/queries/schema/schema-general'
import type { Experiment } from '~/types'

import { ExperimentMetricForm } from '../ExperimentMetricForm'
import { exposureCriteriaModalLogic } from '../ExperimentView/exposureCriteriaModalLogic'
import { type MetricContext, experimentMetricModalLogic } from './experimentMetricModalLogic'

export function ExperimentMetricModal({
    experiment,
    exposureCriteria,
    onSave,
    onDelete,
}: {
    experiment: Experiment
    exposureCriteria: ExperimentExposureCriteria | undefined
    onSave: (metric: ExperimentMetric, context: MetricContext) => void
    onDelete: (metric: ExperimentMetric, context: MetricContext) => void
}): JSX.Element | null {
    const { isModalOpen, metric, context, isCreateMode, isEditMode } = useValues(experimentMetricModalLogic)
    const { closeExperimentMetricModal, setMetric: setModalMetric } = useActions(experimentMetricModalLogic)
    const { openExposureCriteriaModal } = useActions(exposureCriteriaModalLogic)

    if (!isModalOpen || !metric) {
        return null
    }

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={closeExperimentMetricModal}
            title={isCreateMode ? 'Create experiment metric' : 'Edit experiment metric'}
            footer={
                <div className="flex items-center w-full">
                    {isEditMode && (
                        <Button
                            type="secondary"
                            status="danger"
                            onClick={() => {
                                Dialog.open({
                                    title: 'Delete this metric?',
                                    content: <div className="text-sm text-muted">This action cannot be undone.</div>,
                                    primaryButton: {
                                        children: 'Delete',
                                        type: 'primary',
                                        onClick: () => onDelete(metric, context),
                                        size: 'small',
                                    },
                                    secondaryButton: {
                                        children: 'Cancel',
                                        type: 'tertiary',
                                        size: 'small',
                                    },
                                })
                            }}
                        >
                            Delete
                        </Button>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                        <Button
                            form="edit-experiment-metric-form"
                            type="secondary"
                            onClick={closeExperimentMetricModal}
                        >
                            Cancel
                        </Button>
                        <Button
                            form="edit-experiment-metric-form"
                            onClick={() => onSave(metric, context)}
                            type="primary"
                            data-attr="save-experiment-metric"
                        >
                            {isCreateMode ? 'Create' : 'Save'}
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="mb-4">
                <Label className="mb-1">Name (optional)</Label>
                <Input
                    value={metric.name}
                    onChange={(newName) => {
                        setModalMetric({
                            ...metric,
                            name: newName,
                        })
                    }}
                />
            </div>
            <ExperimentMetricForm
                metric={metric}
                handleSetMetric={setModalMetric}
                filterTestAccounts={experiment.exposure_criteria?.filterTestAccounts || false}
                exposureCriteria={exposureCriteria}
                openExposureCriteriaModal={openExposureCriteriaModal}
            />
        </Modal>
    )
}
