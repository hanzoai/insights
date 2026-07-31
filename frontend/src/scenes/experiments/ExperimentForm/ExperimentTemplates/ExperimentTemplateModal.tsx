import { useActions, useValues } from 'kea'

import { Banner, Button, Modal } from '@hanzo/elements'

import { experimentTemplateModalLogic } from './experimentTemplateModalLogic'

interface ExperimentTemplateModalProps {
    onApply: () => void
}

export const ExperimentTemplateModal = ({ onApply }: ExperimentTemplateModalProps): JSX.Element | null => {
    const { isModalOpen, template } = useValues(experimentTemplateModalLogic)
    const { closeTemplateModal } = useActions(experimentTemplateModalLogic)

    if (!isModalOpen || !template) {
        return null
    }

    const canApplyTemplate = true

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={closeTemplateModal}
            title={`Configure: ${template.name}`}
            footer={
                <div className="flex items-center w-full justify-end gap-2">
                    <Button type="secondary" onClick={closeTemplateModal}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={onApply}
                        disabledReason={!canApplyTemplate ? 'Please fill in all required event fields' : undefined}
                        data-attr="apply-experiment-template"
                    >
                        Apply Template
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <Banner type="info">
                    <strong>Goal:</strong> {template.experimentGoal}
                </Banner>

                <div className="space-y-4">
                    {template.metrics.map((metric) => (
                        <div key={metric.name}>{metric.name}</div>
                    ))}
                </div>

                <Banner type="success">
                    This will add {template.metrics.length} metrics:{' '}
                    {template.metrics.map((metric) => metric.name).join(', ')}
                </Banner>
            </div>
        </Modal>
    )
}
