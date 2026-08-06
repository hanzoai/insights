import { useActions, useValues } from 'kea'

import { Button, Modal, Link } from '@hanzo/elements'

import { IconOpenInNew } from 'lib/elements/icons'
import { Tag } from 'lib/elements/Tag'
import { urls } from 'scenes/urls'

import type { ExperimentMetric } from '~/queries/schema/schema-general'

import { MetricConversionWindow } from '../ExperimentForm/MetricsPanel/MetricConversionWindow'
import { MetricEventDetails } from '../ExperimentForm/MetricsPanel/MetricEventDetails'
import { MetricGoal } from '../ExperimentForm/MetricsPanel/MetricGoal'
import { MetricOutlierHandling } from '../ExperimentForm/MetricsPanel/MetricOutlierHandling'
import { MetricStepOrder } from '../ExperimentForm/MetricsPanel/MetricStepOrder'
import { getDefaultMetricTitle, getMetricTag } from '../MetricsView/shared/utils'
import { MetricContext } from './experimentMetricModalLogic'
import { sharedMetricDetailsModalLogic } from './sharedMetricDetailsModalLogic'

function MetricSummary({ metric }: { metric: ExperimentMetric }): JSX.Element | null {
    if (!metric.sharedMetricId) {
        return null
    }

    return (
        <div className="border rounded bg-surface-primary p-4">
            <div className="space-y-3">
                <div className="flex-1 min-w-0 gap-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm break-words">
                            {metric.name || getDefaultMetricTitle(metric)}
                        </span>
                        <Link
                            target="_blank"
                            className="font-semibold flex items-center"
                            to={urls.experimentsSharedMetric(metric.sharedMetricId)}
                        >
                            <IconOpenInNew fontSize="18" />
                        </Link>
                    </div>
                    <MetricEventDetails metric={metric} />
                    <div className="flex items-center mt-2 gap-1">
                        <Tag type="muted" size="small">
                            {getMetricTag(metric)}
                        </Tag>
                        <Tag type="option" size="small">
                            Shared metric
                        </Tag>
                    </div>
                </div>

                <div className="border-t border-border" />

                <div className="space-y-1">
                    <MetricGoal metric={metric} />
                    <MetricConversionWindow metric={metric} />
                    <MetricStepOrder metric={metric} />
                    <MetricOutlierHandling metric={metric} />
                </div>
            </div>
        </div>
    )
}

export function SharedMetricDetailsModal({
    onDelete,
}: {
    onDelete: (sharedMetricId: number, context: MetricContext) => void
}): JSX.Element | null {
    const { isModalOpen, sharedMetric, context } = useValues(sharedMetricDetailsModalLogic)
    const { closeSharedMetricDetailModal } = useActions(sharedMetricDetailsModalLogic)

    if (!sharedMetric || !sharedMetric.sharedMetricId) {
        return null
    }

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={closeSharedMetricDetailModal}
            maxWidth={800}
            title="Shared metric"
            footer={
                <div className="flex justify-between w-full">
                    <div>
                        {sharedMetric && (
                            <Button
                                status="danger"
                                onClick={() => {
                                    if (!sharedMetric.sharedMetricId) {
                                        return
                                    }
                                    onDelete(sharedMetric.sharedMetricId, context)
                                    closeSharedMetricDetailModal()
                                }}
                                type="secondary"
                            >
                                Remove from experiment
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={closeSharedMetricDetailModal} type="secondary">
                            Close
                        </Button>
                    </div>
                </div>
            }
        >
            {sharedMetric && <MetricSummary metric={sharedMetric} />}
        </Modal>
    )
}
