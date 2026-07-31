import { useActions, useValues } from 'kea'

import { Button, Dialog, Modal, Select } from '@hanzo/elements'

import { ExperimentFunnelsQuery, ExperimentTrendsQuery } from '~/queries/schema/schema-general'
import { InsightType } from '~/types'

import { experimentLogic } from '../experimentLogic'
import { modalsLogic } from '../modalsLogic'
import { getDefaultFunnelsMetric, getDefaultTrendsMetric } from '../utils'
import { FunnelsMetricForm } from './FunnelsMetricForm'
import { TrendsMetricForm } from './TrendsMetricForm'

/**
 * @deprecated
 * This component is deprecated and only supports the legacy query runner.
 * Use the MetricModal component instead.
 */
export function LegacyMetricModal({ isSecondary }: { isSecondary?: boolean }): JSX.Element {
    const { experiment, experimentLoading, getInsightType, editingPrimaryMetricUuid, editingSecondaryMetricUuid } =
        useValues(experimentLogic)
    const { updateExperimentMetrics, setExperiment, restoreUnmodifiedExperiment } = useActions(experimentLogic)
    const { closePrimaryMetricModal, closeSecondaryMetricModal } = useActions(modalsLogic)
    const { isPrimaryMetricModalOpen, isSecondaryMetricModalOpen } = useValues(modalsLogic)

    const metricUuid = isSecondary ? editingSecondaryMetricUuid : editingPrimaryMetricUuid
    const metricsField = isSecondary ? 'metrics_secondary' : 'metrics'

    if (!metricUuid) {
        return <></>
    }

    const metrics = experiment[metricsField]
    const metric = metrics.find((m) => m.uuid === metricUuid) as ExperimentTrendsQuery | ExperimentFunnelsQuery

    if (!metric) {
        return <></>
    }
    const insightType = getInsightType(metric)
    const funnelStepsLength = (metric as ExperimentFunnelsQuery)?.funnels_query?.series?.length || 0

    const onClose = (): void => {
        restoreUnmodifiedExperiment()
        isSecondary ? closeSecondaryMetricModal() : closePrimaryMetricModal()
    }

    return (
        <Modal
            isOpen={isSecondary ? isSecondaryMetricModalOpen : isPrimaryMetricModalOpen}
            onClose={onClose}
            width={1000}
            title="Edit experiment metric"
            footer={
                <div className="flex items-center w-full">
                    <Button
                        type="secondary"
                        status="danger"
                        onClick={() => {
                            Dialog.open({
                                title: 'Delete this metric?',
                                content: <div className="text-sm text-secondary">This action cannot be undone.</div>,
                                primaryButton: {
                                    children: 'Delete',
                                    type: 'primary',
                                    onClick: () => {
                                        const newMetrics = metrics.filter((m) => m.uuid !== metricUuid)
                                        setExperiment({
                                            [metricsField]: newMetrics,
                                        })
                                        updateExperimentMetrics()
                                        isSecondary ? closeSecondaryMetricModal() : closePrimaryMetricModal()
                                    },
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
                    <div className="flex items-center gap-2 ml-auto">
                        <Button form="edit-experiment-goal-form" type="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            disabledReason={
                                insightType === InsightType.FUNNELS &&
                                funnelStepsLength < 2 &&
                                'The experiment needs at least two funnel steps.'
                            }
                            form="edit-experiment-goal-form"
                            onClick={() => {
                                updateExperimentMetrics()
                                isSecondary ? closeSecondaryMetricModal() : closePrimaryMetricModal()
                            }}
                            type="primary"
                            loading={experimentLoading}
                            data-attr="create-annotation-submit"
                        >
                            Save
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="flex items-center w-full gap-2 mb-4">
                <span>Metric type</span>
                <Select
                    data-attr="metrics-selector"
                    value={insightType}
                    onChange={(newInsightType) => {
                        const newMetric =
                            newInsightType === InsightType.TRENDS ? getDefaultTrendsMetric() : getDefaultFunnelsMetric()
                        setExperiment({
                            ...experiment,
                            [metricsField]: metrics.map((m) =>
                                m.uuid === metricUuid ? { ...newMetric, uuid: metricUuid, name: m.name } : m
                            ),
                        })
                    }}
                    options={[
                        { value: InsightType.TRENDS, label: <b>Trends</b> },
                        { value: InsightType.FUNNELS, label: <b>Funnels</b> },
                    ]}
                />
            </div>
            {insightType === InsightType.TRENDS ? (
                <TrendsMetricForm isSecondary={isSecondary} />
            ) : (
                <FunnelsMetricForm isSecondary={isSecondary} />
            )}
        </Modal>
    )
}
