import { IconCopy, IconInfo } from '@hanzo/icons'
import { Button, Input, Select } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { Tooltip } from 'lib/elements/Tooltip'
import { copyToClipboard } from 'lib/utils/copyToClipboard'

import { Variable, VariableType } from '../../types'
import {
    BooleanField,
    DateField,
    DirectFieldProps,
    ListDefaultField,
    ListValuesField,
    NumberField,
    StringField,
    VARIABLE_TYPE_OPTIONS,
    formatVariableReference,
    getCodeName,
} from './VariableFields'

function renderField<T extends Variable>(
    Field: React.ComponentType<DirectFieldProps<T>>,
    variable: Variable,
    updateVariable: (variable: Variable) => void,
    onSave: () => void,
    label: string
): JSX.Element {
    return (
        <Field.Pure label={label} className="gap-1">
            <Field variable={variable as T} updateVariable={updateVariable as (variable: T) => void} onSave={onSave} />
        </Field.Pure>
    )
}

const renderVariableSpecificFields = (
    variable: Variable,
    updateVariable: (variable: Variable) => void,
    onSave: () => void
): JSX.Element => {
    switch (variable.type) {
        case 'String':
            return renderField(StringField, variable, updateVariable, onSave, 'Default value')
        case 'Number':
            return renderField(NumberField, variable, updateVariable, onSave, 'Default value')
        case 'Boolean':
            return renderField(BooleanField, variable, updateVariable, onSave, 'Default value')
        case 'List':
            return (
                <>
                    {renderField(ListValuesField, variable, updateVariable, onSave, 'Values')}
                    {renderField(ListDefaultField, variable, updateVariable, onSave, 'Default value')}
                </>
            )
        case 'Date':
            return renderField(DateField, variable, updateVariable, onSave, 'Default value')
    }
}

export interface VariableFormProps {
    variable: Variable
    updateVariable: (variable: Variable) => void
    onSave: () => void
    modalType: 'new' | 'existing'
    onTypeChange: (variableType: VariableType) => void
}

export const VariableForm = ({ variable, updateVariable, onSave, onTypeChange }: VariableFormProps): JSX.Element => {
    const codeNameFallback = getCodeName(variable.name)
    const referenceCodeName = variable.code_name || codeNameFallback
    const nameLabel = (
        <span className="inline-flex items-center gap-1">
            Name
            <Tooltip title="Variable name must be alphanumeric and can only contain spaces and underscores">
                <IconInfo className="text-xl text-secondary shrink-0" />
            </Tooltip>
        </span>
    )
    return (
        <div className="gap-4 flex flex-col">
            <Field.Pure label={nameLabel} className="gap-1">
                <Input
                    placeholder="Name"
                    value={variable.name}
                    onChange={(value) => {
                        const filteredValue = value.replace(/[^a-zA-Z0-9\s_]/g, '')
                        updateVariable({ ...variable, name: filteredValue })
                    }}
                />
                {referenceCodeName && (
                    <span className="text-xs">
                        Use this variable by referencing <code>{formatVariableReference(referenceCodeName)}</code>
                        <Button
                            className="inline-block align-middle"
                            icon={<IconCopy />}
                            type="tertiary"
                            size="xsmall"
                            onClick={() => {
                                copyToClipboard(formatVariableReference(referenceCodeName), 'code')
                            }}
                            tooltip="Copy to clipboard"
                        />
                    </span>
                )}
            </Field.Pure>
            <Field.Pure label="Type" className="gap-1">
                <Select
                    value={variable.type}
                    onChange={(value) => {
                        onTypeChange(value as VariableType)
                    }}
                    options={VARIABLE_TYPE_OPTIONS}
                />
            </Field.Pure>
            {renderVariableSpecificFields(variable, updateVariable, onSave)}
        </div>
    )
}
