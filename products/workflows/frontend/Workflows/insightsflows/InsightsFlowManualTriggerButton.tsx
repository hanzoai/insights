import { useActions, useValues } from 'kea'

import { IconPlayFilled } from '@hanzo/icons'
import { IconChevronDown } from '@hanzo/icons'
import { Button, Input, Popover } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { humanFriendlyNumber } from 'lib/utils/numbers'

import { CyclotronJobInputSchemaType } from '~/types'

import { WorkflowLogicProps, workflowLogic } from '../workflowLogic'
import { hogFlowManualTriggerButtonLogic } from './InsightsFlowManualTriggerButtonLogic'
import { batchTriggerLogic, getAudienceDedupeKey } from './steps/batchTriggerLogic'

const TriggerPopover = ({
    setPopoverVisible,
    props,
}: {
    setPopoverVisible: (visible: boolean) => void
    props: WorkflowLogicProps
}): JSX.Element => {
    const logic = hogFlowManualTriggerButtonLogic(props)
    const { workflow, variableValues, inputs } = useValues(logic)
    const { setInput, clearInputs, triggerManualWorkflow, triggerBatchWorkflow } = useActions(logic)

    const { blastRadius, blastRadiusLoading } = useValues(
        batchTriggerLogic({
            id: props.id,
            filters: workflow?.trigger?.type === 'batch' ? workflow?.trigger?.filters : undefined,
            dedupeKey: getAudienceDedupeKey(workflow),
        })
    )

    const blastRadiusExceeded =
        workflow?.trigger?.type === 'batch' &&
        blastRadius != null &&
        blastRadius.limit != null &&
        blastRadius.affected > blastRadius.limit

    const blastRadiusSuffix = (): string => {
        if (workflow?.trigger?.type === 'batch') {
            return blastRadius ? ` for ${humanFriendlyNumber(blastRadius.affected)} users` : ' for ...'
        }
        return ''
    }

    const getButtonText = (): string => `Run workflow${blastRadiusSuffix()}`

    const variablesSection =
        !workflow?.variables || workflow.variables.length === 0 ? (
            <>
                <div className="pb-2 border-b">
                    <h3 className="text-sm font-semibold">Configure variables</h3>
                </div>
                <div className="text-muted text-sm">No variables to configure.</div>
            </>
        ) : (
            <>
                <div className="pb-2 border-b">
                    <h3 className="text-sm font-semibold">Configure variables</h3>
                    <p className="text-xs text-muted mt-0.5">Set variable values or leave empty to use defaults</p>
                </div>
                <div className="flex flex-col gap-3">
                    {workflow.variables.map((variable: CyclotronJobInputSchemaType) => {
                        const inputValue = inputs[variable.key]
                        const displayValue = inputValue ?? ''
                        const hasDefault = variable.default !== undefined && variable.default !== ''

                        return (
                            <Field.Pure key={variable.key} label={variable.label || variable.key}>
                                {variable.type === 'number' ? (
                                    <Input
                                        type="number"
                                        value={displayValue === '' ? undefined : Number(displayValue)}
                                        placeholder={
                                            hasDefault ? `Default: ${String(variable.default)}` : 'Enter value'
                                        }
                                        onChange={(value: number | undefined) => {
                                            setInput(variable.key, value !== undefined ? String(value) : '')
                                        }}
                                    />
                                ) : (
                                    <Input
                                        type="text"
                                        value={displayValue}
                                        placeholder={
                                            hasDefault ? `Default: ${String(variable.default)}` : 'Enter value'
                                        }
                                        onChange={(value: string) => {
                                            setInput(variable.key, value)
                                        }}
                                    />
                                )}
                            </Field.Pure>
                        )
                    })}
                </div>
            </>
        )

    return (
        <div className="flex flex-col gap-4 p-3 min-w-80 max-w-96">
            {variablesSection}
            <div className="flex justify-end border-t pt-3">
                <Button
                    type="primary"
                    status="alt"
                    loading={blastRadiusLoading}
                    disabledReason={
                        blastRadiusExceeded && blastRadius?.limit != null
                            ? `Batch size exceeds the limit of ${humanFriendlyNumber(blastRadius.limit)} users. Add filters to narrow your audience. This limit will be loosened in the future.`
                            : undefined
                    }
                    onClick={() => {
                        if (workflow?.trigger?.type === 'batch') {
                            triggerBatchWorkflow(variableValues, workflow?.trigger?.filters || { properties: [] })
                        } else {
                            triggerManualWorkflow(variableValues)
                        }

                        setPopoverVisible(false)
                        clearInputs()
                    }}
                    data-attr="run-workflow-btn"
                    sideIcon={<IconPlayFilled />}
                >
                    {getButtonText()}
                </Button>
            </div>
        </div>
    )
}

export const InsightsFlowManualTriggerButton = (props: WorkflowLogicProps = {}): JSX.Element => {
    const logic = hogFlowManualTriggerButtonLogic(props)
    const { workflow, hasUnsavedChanges } = useValues(workflowLogic(props))
    const { popoverVisible } = useValues(logic)
    const { setPopoverVisible } = useActions(logic)

    const triggerButton = (
        <Button
            type="primary"
            size="small"
            disabledReason={
                workflow?.status !== 'active'
                    ? 'Must enable workflow to use trigger'
                    : hasUnsavedChanges
                      ? 'Save changes first'
                      : undefined
            }
            sideIcon={<IconChevronDown className={`transition-transform ${popoverVisible ? 'rotate-180' : ''}`} />}
            tooltip="Triggers workflow immediately"
            onClick={() => setPopoverVisible(!popoverVisible)}
        >
            Trigger
        </Button>
    )

    return (
        <Popover
            visible={popoverVisible}
            placement="bottom-start"
            onClickOutside={() => setPopoverVisible(false)}
            overlay={<TriggerPopover setPopoverVisible={setPopoverVisible} props={props} />}
        >
            {triggerButton}
        </Popover>
    )
}
