import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { IconCopy, IconEllipsis, IconPencil, IconStack, IconTarget, IconTrash } from '@hanzo/icons'
import { Button, Dialog, Dropdown, Menu, Tag, Tooltip } from '@hanzo/elements'

import { TaxonomicFilter } from 'lib/components/TaxonomicFilter/TaxonomicFilter'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { useFeatureFlag } from 'lib/hooks/useFeatureFlag'
import { Spinner } from 'lib/elements/Spinner'
import { experimentMetricsLogic } from 'scenes/experiments/experimentMetricsLogic'
import { isMetricThresholdCueVisible } from 'scenes/experiments/ExperimentMetricThreshold'
import { EXPOSURE_DEFAULT_EVENT, getExposureEventAndProperty } from 'scenes/experiments/exposureContract'
import { METRIC_CONTEXTS, experimentMetricModalLogic } from 'scenes/experiments/Metrics/experimentMetricModalLogic'
import { sharedMetricDetailsModalLogic } from 'scenes/experiments/Metrics/sharedMetricDetailsModalLogic'
import { modalsLogic } from 'scenes/experiments/modalsLogic'
import { urls } from 'scenes/urls'

import type { Breakdown, EventsNode, ExperimentMetric } from '~/queries/schema/schema-general'
import { NodeKind } from '~/queries/schema/schema-general'
import type { Experiment } from '~/types'

import { MetricRetryDetails } from './MetricRetryState'
import { MetricTitle } from './MetricTitle'
import { getMetricTag } from './utils'

const MAX_BREAKDOWNS = 3

// Helper function to get the exposure event from experiment
const getExposureEvent = (experiment: Experiment): string =>
    getExposureEventAndProperty({
        featureFlagKey: experiment.feature_flag_key,
        exposureCriteria: experiment.exposure_criteria,
    }).event ?? EXPOSURE_DEFAULT_EVENT

const AddBreakdownMenuItem = ({
    experiment,
    onChange,
}: {
    experiment: Experiment
    onChange: (breakdown: Breakdown) => void
}): JSX.Element => {
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const exposureEvent = getExposureEvent(experiment)
    const metadataSource: EventsNode = {
        kind: NodeKind.EventsNode,
        event: exposureEvent,
    }
    const taxonomicGroupTypes = [TaxonomicFilterGroupType.EventProperties, TaxonomicFilterGroupType.PersonProperties]

    return (
        <Dropdown
            placement="left-start"
            overlay={
                <TaxonomicFilter
                    onChange={(group, value) => {
                        const breakdownType =
                            group.type === TaxonomicFilterGroupType.PersonProperties ? 'person' : 'event'
                        onChange({ type: breakdownType, property: value?.toString() || '' })
                        setDropdownOpen(false)
                    }}
                    taxonomicGroupTypes={taxonomicGroupTypes}
                    metadataSource={metadataSource}
                />
            }
            visible={dropdownOpen}
            onClickOutside={() => setDropdownOpen(false)}
        >
            <Button size="small" fullWidth icon={<IconStack />} onClick={() => setDropdownOpen(!dropdownOpen)}>
                Add breakdown
            </Button>
        </Dropdown>
    )
}

export const MetricHeader = ({
    displayOrder,
    metric,
    metricType,
    isPrimaryMetric,
    experiment,
    onDuplicateMetricClick,
    onDuplicateAsSingleUseMetricClick,
    onBreakdownChange,
    onDeleteMetricClick,
    readOnly,
}: {
    displayOrder?: number
    metric: ExperimentMetric
    metricType: any
    isPrimaryMetric: boolean
    experiment: Experiment
    onDuplicateMetricClick: (metric: ExperimentMetric) => void
    onDuplicateAsSingleUseMetricClick: (metric: ExperimentMetric) => void
    onBreakdownChange: (breakdown: Breakdown) => void
    onDeleteMetricClick?: (metric: ExperimentMetric) => void
    readOnly?: boolean
}): JSX.Element => {
    /**
     * This is necessary for legacy experiments support
     */
    const {
        openPrimaryMetricModal,
        openSecondaryMetricModal,
        openPrimarySharedMetricModal,
        openSecondarySharedMetricModal,
    } = useActions(modalsLogic)

    const { openExperimentMetricModal } = useActions(experimentMetricModalLogic)
    const { openSharedMetricDetailModal } = useActions(sharedMetricDetailsModalLogic)

    const [menuVisible, setMenuVisible] = useState(false)
    const closeMenu = (): void => setMenuVisible(false)

    const isSharedMetric = !!metric.isSharedMetric && !!metric.sharedMetricId

    const openEditModal = (): void => {
        if (isSharedMetric) {
            /**
             * this is for legacy experiments support
             */
            const openSharedModal = isPrimaryMetric ? openPrimarySharedMetricModal : openSecondarySharedMetricModal
            openSharedModal(metric.sharedMetricId!)

            openSharedMetricDetailModal(metric, METRIC_CONTEXTS[isPrimaryMetric ? 'primary' : 'secondary'])
            return
        }

        /**
         * this is for legacy experiments support
         */
        const openMetricModal = isPrimaryMetric ? openPrimaryMetricModal : openSecondaryMetricModal
        if (metric.uuid) {
            openMetricModal(metric.uuid)
        }
        openExperimentMetricModal(METRIC_CONTEXTS[isPrimaryMetric ? 'primary' : 'secondary'], metric)
    }

    const handleDuplicate = (): void => {
        /**
         * For shared metrics we open the duplicate form
         * after a confirmation.
         */
        if (isSharedMetric) {
            Dialog.open({
                title: 'Duplicate this shared metric?',
                content: (
                    <div className="text-sm text-secondary max-w-lg deprecated-space-y-2">
                        <p>
                            <b>As a single-use metric</b> adds an editable copy to this experiment only. Other
                            experiments using the shared metric are unaffected.
                        </p>
                        <p>
                            <b>As a shared metric</b> takes you to the form to customize and save a new shared metric,
                            ready to be added to any experiment.
                        </p>
                    </div>
                ),
                primaryButton: {
                    children: 'Duplicate as single-use metric',
                    size: 'small',
                    onClick: () => onDuplicateAsSingleUseMetricClick(metric),
                },
                secondaryButton: {
                    children: 'Duplicate as shared metric',
                    to: urls.experimentsSharedMetric(metric.sharedMetricId!, 'duplicate'),
                    type: 'secondary',
                    size: 'small',
                },
                tertiaryButton: {
                    children: 'Cancel',
                    type: 'tertiary',
                    size: 'small',
                },
            })
            return
        }

        // regular metrics just get duplicated
        onDuplicateMetricClick(metric)
    }

    const handleDelete = (): void => {
        if (!onDeleteMetricClick) {
            return
        }

        const deleteLabel = isSharedMetric ? 'Remove from experiment' : 'Delete metric'
        const description = isSharedMetric
            ? 'This will remove the shared metric from this experiment. The shared metric itself will not be deleted.'
            : 'This will permanently remove this metric from the experiment. This action cannot be undone.'

        Dialog.open({
            title: isSharedMetric ? 'Remove this metric from the experiment?' : 'Delete this metric?',
            content: <div className="text-sm text-secondary max-w-lg">{description}</div>,
            primaryButton: {
                children: deleteLabel,
                status: 'danger',
                type: 'primary',
                size: 'small',
                onClick: () => onDeleteMetricClick(metric),
            },
            secondaryButton: {
                children: 'Cancel',
                type: 'tertiary',
                size: 'small',
            },
        })
    }

    const canAddBreakdown = (metric.breakdownFilter?.breakdowns || []).length < MAX_BREAKDOWNS

    const recalculationEnabled = useFeatureFlag('EXPERIMENTS_METRICS_RECALCULATION')
    const { isMetricRecalculating, metricRetries } = useValues(experimentMetricsLogic({ experiment }))
    const showRecalculatingTag = recalculationEnabled && isMetricRecalculating(metric.uuid)
    const metricRetry = recalculationEnabled && metric.uuid ? metricRetries[metric.uuid] : undefined

    return (
        <div className="text-xs font-semibold flex flex-col justify-between h-full">
            <div className="deprecated-space-y-1">
                <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="text-xs font-semibold flex items-start min-w-0 flex-1">
                        {displayOrder !== undefined && <span className="mr-1 flex-shrink-0">{displayOrder + 1}.</span>}
                        <div className="min-w-0 flex-1">
                            <MetricTitle metric={metric} metricType={metricType} />
                        </div>
                    </div>
                    {!readOnly && (
                        <div className="flex flex-shrink-0 gap-1">
                            <Button
                                type="tertiary"
                                size="xsmall"
                                icon={<IconPencil />}
                                tooltip="Edit"
                                aria-label="Edit metric"
                                onClick={openEditModal}
                            />
                            <Menu
                                placement="bottom-end"
                                visible={menuVisible}
                                onVisibilityChange={setMenuVisible}
                                closeOnClickInside={false}
                                items={
                                    [
                                        {
                                            items: [
                                                canAddBreakdown && {
                                                    label: () => (
                                                        <AddBreakdownMenuItem
                                                            experiment={experiment}
                                                            onChange={(breakdown) => {
                                                                onBreakdownChange(breakdown)
                                                                closeMenu()
                                                            }}
                                                        />
                                                    ),
                                                    custom: true,
                                                },
                                                {
                                                    label: 'Duplicate',
                                                    icon: <IconCopy />,
                                                    onClick: () => {
                                                        closeMenu()
                                                        handleDuplicate()
                                                    },
                                                },
                                            ].filter(Boolean) as any,
                                        },
                                        onDeleteMetricClick && {
                                            items: [
                                                {
                                                    label: isSharedMetric ? 'Remove from experiment' : 'Delete',
                                                    icon: <IconTrash />,
                                                    status: 'danger',
                                                    onClick: () => {
                                                        closeMenu()
                                                        handleDelete()
                                                    },
                                                },
                                            ],
                                        },
                                    ].filter(Boolean) as any
                                }
                            >
                                <Button
                                    type="tertiary"
                                    size="xsmall"
                                    icon={<IconEllipsis />}
                                    tooltip="More actions"
                                    aria-label="More actions"
                                />
                            </Menu>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                    {(showRecalculatingTag || metricRetry) &&
                        (metricRetry ? (
                            <Dropdown
                                placement="bottom-start"
                                showArrow
                                trigger="hover"
                                closeOnClickInside={false}
                                overlay={<MetricRetryDetails retry={metricRetry} className="max-w-100 p-2" />}
                            >
                                <Tag type="warning" size="medium" icon={<Spinner textColored />}>
                                    Retry {metricRetry.attempt} of {metricRetry.max_attempts}
                                </Tag>
                            </Dropdown>
                        ) : (
                            <Tag type="highlight" size="medium" icon={<Spinner textColored />}>
                                Recalculating
                            </Tag>
                        ))}
                    <Tag type="muted" size="small">
                        {getMetricTag(metric)}
                    </Tag>
                    {isMetricThresholdCueVisible(metric) && (
                        <Tooltip
                            title={`Reports the percentage of users whose value reaches or exceeds ${metric.threshold}.`}
                        >
                            <Tag type="muted" size="small" icon={<IconTarget />}>
                                ≥ {metric.threshold}
                            </Tag>
                        </Tooltip>
                    )}
                    {experiment.parameters?.prompt_metadata && (
                        <Tag type="completion" size="small">
                            LLM
                        </Tag>
                    )}
                    {metric.goal === 'decrease' && (
                        <Tag type="highlight" size="small">
                            Goal: Decrease
                        </Tag>
                    )}
                    {metric.isSharedMetric && (
                        <Tag type="option" size="small">
                            Shared
                        </Tag>
                    )}
                </div>
            </div>
        </div>
    )
}
