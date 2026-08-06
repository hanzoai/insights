import { IconClock } from '@hanzo/icons'

import { EntityFilterInfo } from 'lib/components/EntityFilterInfo'
import { IconTrendingFlat, IconTrendingFlatDown } from 'lib/elements/icons'
import { Row } from 'lib/elements/Row'
import { Lettermark, LettermarkColor } from 'lib/elements/Lettermark'
import { Tooltip } from 'lib/elements/Tooltip'
import { humanFriendlyDuration } from 'lib/utils/durations'
import { percentage } from 'lib/utils/numbers'
import { capitalizeFirstLetter, pluralize } from 'lib/utils/strings'
import { getActionFilterFromFunnelStep } from 'scenes/insights/views/Funnels/funnelStepTableUtils'

import { isExperimentFunnelMetric } from '~/queries/schema/schema-general'
import { FunnelStepWithConversionMetrics, StepOrderValue } from '~/types'

import { useFunnelChartData } from './FunnelChart'

interface StepLegendProps {
    step: FunnelStepWithConversionMetrics
    stepIndex: number
    showTime: boolean
}

export function StepLegend({ step, stepIndex, showTime }: StepLegendProps): JSX.Element {
    const { metric } = useFunnelChartData()
    const aggregationTargetLabel = { singular: 'user', plural: 'users' }

    const isUnorderedFunnel =
        !!metric && isExperimentFunnelMetric(metric) && metric.funnel_order_type === StepOrderValue.UNORDERED
    const unorderedStepLabel = `Completed ${stepIndex + 1} ${stepIndex === 0 ? 'step' : 'steps'}`

    const convertedCountPresentation = pluralize(
        step.count ?? 0,
        aggregationTargetLabel.singular,
        aggregationTargetLabel.plural
    )
    const droppedOffCountPresentation = pluralize(
        step.droppedOffFromPrevious ?? 0,
        aggregationTargetLabel.singular,
        aggregationTargetLabel.plural
    )

    const convertedCountPresentationWithPercentage = (
        <>
            {convertedCountPresentation}{' '}
            <span className="text-secondary">({percentage(step.conversionRates.fromBasisStep, 2)})</span>
        </>
    )
    const droppedOffCountPresentationWithPercentage = (
        <>
            {droppedOffCountPresentation}{' '}
            <span className="text-secondary">({percentage(1 - step.conversionRates.fromPrevious, 2)})</span>
        </>
    )

    return (
        <div className="StepLegend">
            <Row icon={<Lettermark name={stepIndex + 1} color={LettermarkColor.Gray} />}>
                {isUnorderedFunnel ? (
                    <span title={unorderedStepLabel}>{unorderedStepLabel}</span>
                ) : (
                    <EntityFilterInfo filter={getActionFilterFromFunnelStep(step)} allowWrap />
                )}
            </Row>
            <Row icon={<IconTrendingFlat />} status="success" style={{ color: 'unset' }}>
                <Tooltip
                    title={
                        <>
                            {capitalizeFirstLetter(aggregationTargetLabel.plural)} who completed this step,
                            <br />
                            with conversion rate relative to the first step
                        </>
                    }
                    placement="right"
                >
                    <span>{convertedCountPresentationWithPercentage}</span>
                </Tooltip>
            </Row>
            {stepIndex > 0 && (
                <>
                    <Row icon={<IconTrendingFlatDown />} status="danger" style={{ color: 'unset' }}>
                        <Tooltip
                            title={
                                <>
                                    {capitalizeFirstLetter(aggregationTargetLabel.plural)} who didn't complete this
                                    step,
                                    <br />
                                    with drop-off rate relative to the previous step
                                </>
                            }
                            placement="right"
                        >
                            <span>{droppedOffCountPresentationWithPercentage}</span>
                        </Tooltip>
                    </Row>
                    {showTime && (
                        <Row icon={<IconClock />} title="Median time of conversion from previous step">
                            {humanFriendlyDuration(step.median_conversion_time, { maxUnits: 3 }) || '–'}
                        </Row>
                    )}
                </>
            )}
        </div>
    )
}
