// .StepLegend styles live in FunnelBarVertical.scss; import here so they load on the quill funnel
// charts that reuse this component (the old FunnelBarVertical that used to pull them in is gone).
import './FunnelBarVertical.scss'

import { useActions, useValues } from 'kea'

import { IconClock } from '@hanzo/icons'

import { EntityFilterInfo } from 'lib/components/EntityFilterInfo'
import { IconTrendingFlat, IconTrendingFlatDown } from 'lib/elements/icons'
import { Row } from 'lib/elements/Row'
import { Lettermark, LettermarkColor } from 'lib/elements/Lettermark'
import { Tooltip } from 'lib/elements/Tooltip'
import { funnelDataLogic } from 'scenes/funnels/funnelDataLogic'
import { insightLogic } from 'scenes/insights/insightLogic'
import { getActionFilterFromFunnelStep } from 'scenes/insights/views/Funnels/funnelStepTableUtils'
import { userLogic } from 'scenes/userLogic'

import { AvailableFeature, ChartParams, FunnelStepWithConversionMetrics } from '~/types'

import { funnelPersonsModalLogic } from '../funnelPersonsModalLogic'
import { FunnelStepMore } from '../FunnelStepMore'
import {
    formatConvertedCount,
    formatConvertedPercentage,
    formatDroppedOffCount,
    formatDroppedOffPercentage,
    formatMedianConversionTime,
    getTooltipTitleForConverted,
    getTooltipTitleForDroppedOff,
} from '../funnelUtils'
import { ValueInspectorButton } from '../ValueInspectorButton'

type StepLegendProps = {
    step: FunnelStepWithConversionMetrics
    stepIndex: number
    showTime: boolean
} & ChartParams

export function StepLegend({ step, stepIndex, showTime, showPersonsModal, inCardView }: StepLegendProps): JSX.Element {
    const { insightProps } = useValues(insightLogic)
    const { aggregationTargetLabel, funnelsFilter, isStepOptional } = useValues(funnelDataLogic(insightProps))
    const { canOpenPersonModal, isInExperimentContext } = useValues(funnelPersonsModalLogic(insightProps))
    const { openPersonsModalForStep } = useActions(funnelPersonsModalLogic(insightProps))
    const { hasAvailableFeature } = useValues(userLogic)

    const isOptionalStep = isStepOptional(stepIndex + 1)
    const isFirstStep = stepIndex === 0
    const isBreakdown =
        Array.isArray(step.nested_breakdown) &&
        step.nested_breakdown?.length !== undefined &&
        !(step.nested_breakdown.length === 1)

    const convertedCountPresentationWithPercentage = (
        <>
            {formatConvertedCount(step, aggregationTargetLabel)}
            {!isFirstStep && (
                <>
                    {' '}
                    <span className="text-secondary">({formatConvertedPercentage(step)})</span>
                </>
            )}
            {/* Spacer used in the card view because the first step has no conversion percentage. */}
            {isFirstStep && inCardView && <span className="inline-block w-[55px]" />}
        </>
    )
    const droppedOffCountPresentationWithPercentage = (
        <>
            {formatDroppedOffCount(step, aggregationTargetLabel)}{' '}
            <span className="text-secondary">({formatDroppedOffPercentage(step)})</span>
        </>
    )

    return (
        <div className="StepLegend" data-attr="funnel-step-legend" style={{ opacity: isOptionalStep ? 0.6 : 1 }}>
            {/* Step */}
            <Row
                icon={<Lettermark name={stepIndex + 1} color={LettermarkColor.Gray} />}
                sideIcon={
                    hasAvailableFeature(AvailableFeature.PATHS_ADVANCED) && <FunnelStepMore stepIndex={stepIndex} />
                }
            >
                <EntityFilterInfo filter={getActionFilterFromFunnelStep(step)} allowWrap />
                {isOptionalStep ? <div className="ml-1 text-xs font-normal">(optional)</div> : null}
            </Row>

            {/* Conversions */}
            <Row
                icon={<IconTrendingFlat />}
                status="success"
                style={{ color: 'unset' }} // Prevent status color from affecting text
            >
                <Tooltip
                    title={getTooltipTitleForConverted(funnelsFilter, aggregationTargetLabel, stepIndex)}
                    placement="right"
                >
                    {!!showPersonsModal && canOpenPersonModal && !isInExperimentContext ? (
                        <ValueInspectorButton
                            onClick={() => openPersonsModalForStep({ step, stepIndex, converted: true })}
                            data-attr="funnel-inspect-converted"
                        >
                            {convertedCountPresentationWithPercentage}
                        </ValueInspectorButton>
                    ) : (
                        <span>{convertedCountPresentationWithPercentage}</span>
                    )}
                </Tooltip>
            </Row>

            {/* Drop-offs */}
            {!isFirstStep && (
                <Row
                    icon={<IconTrendingFlatDown />}
                    status="danger"
                    style={{ color: 'unset' }} // Prevent status color from affecting text
                >
                    <Tooltip
                        title={getTooltipTitleForDroppedOff(funnelsFilter, aggregationTargetLabel)}
                        placement="right"
                    >
                        {showPersonsModal && stepIndex && !isInExperimentContext ? (
                            <ValueInspectorButton
                                onClick={() => openPersonsModalForStep({ step, stepIndex, converted: false })}
                                data-attr="funnel-inspect-dropped-off"
                            >
                                {droppedOffCountPresentationWithPercentage}
                            </ValueInspectorButton>
                        ) : (
                            <span>{droppedOffCountPresentationWithPercentage}</span>
                        )}
                    </Tooltip>
                </Row>
            )}

            {/* Median conversion time */}
            {!isFirstStep && !isBreakdown && showTime && (
                <Row icon={<IconClock />} title="Median time of conversion from previous step">
                    {formatMedianConversionTime(step)}
                </Row>
            )}
        </div>
    )
}
