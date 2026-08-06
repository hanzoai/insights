import { useActions, useValues } from 'kea'

import { IconCode, IconCopy, IconPlus, IconX } from '@hanzo/icons'
import { Button, Dialog, Input, Label, toast } from '@hanzo/elements'

import { ScrollableShadows } from 'lib/components/ScrollableShadows/ScrollableShadows'
import { Field } from 'lib/elements/Field/Field'

import { hogFlowEditorLogic } from '../hogFlowEditorLogic'

export function InsightsFlowEditorPanelVariables(): JSX.Element | null {
    const { workflow } = useValues(hogFlowEditorLogic)
    const { setWorkflowInfo } = useActions(hogFlowEditorLogic)

    const addNewVariable = (): void => {
        const newVariableName = `VARIABLE_${(workflow?.variables?.length || 0) + 1}`
        const updatedVariables = [
            ...(workflow?.variables || []),
            { key: newVariableName, label: newVariableName, type: 'string' as const, default: '' },
        ]
        setWorkflowInfo({
            variables: updatedVariables,
        })
    }

    const editVariableKey = (idx: number, key: string): void => {
        const updatedVariables = [...(workflow?.variables || [])]
        const sanitizedKey = key.replace(/\s+/g, '_')
        updatedVariables[idx].key = sanitizedKey
        updatedVariables[idx].label = sanitizedKey
        setWorkflowInfo({
            variables: updatedVariables,
        })
    }

    const editVariableDefaultValue = (idx: number, defaultValue: string): void => {
        const updatedVariables = [...(workflow?.variables || [])]
        updatedVariables[idx].default = defaultValue
        setWorkflowInfo({
            variables: updatedVariables,
        })
    }

    const deleteVariable = (idx: number): void => {
        Dialog.open({
            title: 'Delete variable',
            description: `Are you sure you want to delete the variable "${workflow.variables?.[idx]?.key}"?`,
            primaryButton: {
                children: 'Delete',
                status: 'danger',
                onClick: () => {
                    const newVariables = [...(workflow?.variables || [])]
                    newVariables.splice(idx, 1)
                    setWorkflowInfo({ variables: newVariables })
                },
            },
            secondaryButton: { children: 'Cancel' },
        })
    }

    return (
        <div className="flex flex-col h-full overflow-hidden m-2">
            <Label
                info={
                    <span>
                        These variables can be used by actions and conditions in this workflow. Use{' '}
                        <code>{`{ variable_name }`}</code> to reference a variable in an action or condition. You can
                        also set variables using the result of an action by selecting a node and configuring the "Output
                        variable" section.
                    </span>
                }
            >
                <IconCode className="text-lg" /> Workflow variables
            </Label>

            <ScrollableShadows
                direction="vertical"
                className="flex-1 min-h-0"
                innerClassName="flex flex-col gap-1.5 py-2"
                styledScrollbars
            >
                {workflow.variables && workflow.variables.length > 0 && (
                    <div className="w-full flex gap-2 px-0.5 text-xs font-medium text-secondary">
                        <span className="w-1/4 shrink-0">Key</span>
                        <span className="w-1/4 shrink-0">Default</span>
                        <span className="flex-1 min-w-0">Usage</span>
                        <span className="w-5 shrink-0" />
                    </div>
                )}

                {workflow.variables?.map((variable, idx) => (
                    <div key={`${workflow.id}_${idx}`} className="w-full flex items-center gap-2">
                        <Field.Pure className="w-1/4 shrink-0">
                            <Input
                                size="small"
                                type="text"
                                value={variable.key}
                                placeholder="Unique name"
                                onChange={(key) => {
                                    editVariableKey(idx, key)
                                }}
                            />
                        </Field.Pure>
                        <Field.Pure className="w-1/4 shrink-0">
                            <Input
                                size="small"
                                type="text"
                                value={workflow?.variables?.[idx]?.default || ''}
                                placeholder="Default value"
                                onChange={(defaultValue) => {
                                    editVariableDefaultValue(idx, defaultValue)
                                }}
                            />
                        </Field.Pure>
                        <span className="group relative flex-1 min-w-0">
                            <code className="w-full py-1 bg-primary-alt-highlight-secondary rounded-sm text-center text-xs truncate block">
                                {`{ variables.${variable.key} }`}
                            </code>
                            <span className="absolute top-0 right-0 z-10 p-px opacity-0 transition-opacity group-hover:opacity-100">
                                <Button
                                    size="small"
                                    icon={<IconCopy />}
                                    className="bg-white/80"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        void navigator.clipboard.writeText(`{{ variables.${variable.key} }}`)
                                        toast.success('Copied to clipboard')
                                    }}
                                />
                            </span>
                        </span>
                        <Button
                            size="small"
                            icon={<IconX />}
                            onClick={() => {
                                deleteVariable(idx)
                            }}
                        />
                    </div>
                ))}
                <Button
                    icon={<IconPlus />}
                    type="secondary"
                    size="small"
                    className="self-start"
                    onClick={addNewVariable}
                >
                    New variable
                </Button>
            </ScrollableShadows>
        </div>
    )
}
