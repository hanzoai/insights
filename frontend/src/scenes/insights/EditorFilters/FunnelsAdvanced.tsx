import { useActions, useValues } from 'kea'

import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { funnelDataLogic } from 'scenes/funnels/funnelDataLogic'

import { Noun } from '~/models/groupsModel'
import { EditorFilterProps } from '~/types'

import { FunnelExclusionsFilter } from '../filters/FunnelExclusionsFilter/FunnelExclusionsFilter'
import { FunnelStepReferencePicker } from '../filters/FunnelStepReferencePicker'
import { FunnelStepOrderPicker } from '../views/Funnels/FunnelStepOrderPicker'

export function FunnelsAdvanced({ insightProps }: EditorFilterProps): JSX.Element {
    const { querySource, aggregationTargetLabel, advancedOptionsUsedCount } = useValues(funnelDataLogic(insightProps))
    const { updateInsightFilter } = useActions(funnelDataLogic(insightProps))

    return (
        <div className="deprecated-space-y-4">
            <Field.Pure label="Step order" info={<StepOrderInfo />}>
                <FunnelStepOrderPicker />
            </Field.Pure>
            <Field.Pure label="Conversion rate calculation">
                <FunnelStepReferencePicker />
            </Field.Pure>

            <Field.Pure
                label="Exclusion steps"
                info={
                    <ExclusionStepsInfo
                        aggregationTargetLabel={aggregationTargetLabel}
                        aggregation_group_type_index={querySource?.aggregation_group_type_index}
                    />
                }
            >
                <FunnelExclusionsFilter />
            </Field.Pure>

            {!!advancedOptionsUsedCount && (
                <div className="mt-4">
                    <Button
                        status="danger"
                        onClick={() => {
                            updateInsightFilter({
                                funnelOrderType: undefined,
                                funnelStepReference: undefined,
                                exclusions: undefined,
                            })
                        }}
                    >
                        Reset advanced options
                    </Button>
                </div>
            )}
        </div>
    )
}

function StepOrderInfo(): JSX.Element {
    return (
        <ul className="list-disc pl-4">
            <li>
                <b>Sequential</b> - Step B must happen after Step A, but any number events can happen between A and B.
            </li>
            <li>
                <b>Strict order</b> - Step B must happen directly after Step A without any events in between.
            </li>
            <li>
                <b>Any order</b> - Steps can be completed in any sequence.
            </li>
        </ul>
    )
}

type ExclusionStepsInfoProps = {
    aggregationTargetLabel: Noun
    aggregation_group_type_index?: number | null
}

function ExclusionStepsInfo({
    aggregationTargetLabel,
    aggregation_group_type_index,
}: ExclusionStepsInfoProps): JSX.Element {
    return (
        <>
            Exclude {aggregationTargetLabel.plural} {aggregation_group_type_index != null ? 'that' : 'who'} completed
            the specified event between two specific steps. Note that these {aggregationTargetLabel.plural} will be{' '}
            <b>completely excluded from the entire funnel</b>.
        </>
    )
}
