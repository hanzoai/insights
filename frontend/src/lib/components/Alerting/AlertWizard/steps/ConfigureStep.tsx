import { useActions, useValues } from 'kea'

import { Button, Input } from '@hanzo/elements'

import { CyclotronJobInputIntegration } from 'lib/components/CyclotronJob/integrations/CyclotronJobInputIntegration'
import { CyclotronJobInputIntegrationField } from 'lib/components/CyclotronJob/integrations/CyclotronJobInputIntegrationField'
import { Field } from 'lib/elements/Field/Field'
import { Skeleton } from 'lib/elements/Skeleton'

import { CyclotronJobInputSchemaType } from '~/types'

import { alertWizardLogic } from '../alertWizardLogic'

export function ConfigureStep(): JSX.Element {
    const { requiredInputsSchema, configuration, selectedTemplateLoading, submitting, testing } =
        useValues(alertWizardLogic)
    const { setInputValue, submitConfiguration, testConfiguration } = useActions(alertWizardLogic)

    if (selectedTemplateLoading) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-1">Configure your alert</h2>
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-semibold mb-1">Configure your alert</h2>
                <p className="text-secondary text-sm">Fill in the details to complete setup</p>
            </div>

            <div className="space-y-4">
                {requiredInputsSchema.map((schema: CyclotronJobInputSchemaType) => (
                    <Field.Pure key={schema.key} label={schema.label}>
                        <SchemaInput
                            schema={schema}
                            value={configuration.inputs?.[schema.key]?.value}
                            onChange={(val) => setInputValue(schema.key, { value: val })}
                            configuration={configuration}
                            onInputChange={setInputValue}
                        />
                    </Field.Pure>
                ))}
            </div>

            <div className="flex justify-end gap-2">
                <Button type="secondary" onClick={testConfiguration} loading={testing} disabled={submitting}>
                    Test
                </Button>
                <Button type="primary" onClick={submitConfiguration} loading={submitting} disabled={testing}>
                    Create alert
                </Button>
            </div>
        </div>
    )
}

function SchemaInput({
    schema,
    value,
    onChange,
    configuration,
    onInputChange,
}: {
    schema: CyclotronJobInputSchemaType
    value: any
    onChange: (value: any) => void
    configuration: { inputs_schema: CyclotronJobInputSchemaType[]; inputs: Record<string, any> | null }
    onInputChange: (key: string, value: any) => void
}): JSX.Element {
    if (schema.type === 'integration') {
        return (
            <CyclotronJobInputIntegration
                schema={schema}
                value={value}
                onChange={(newValue) => {
                    configuration.inputs_schema
                        .filter((s) => s.type === 'integration_field' && s.integration_key === schema.key)
                        .forEach((field) => {
                            onInputChange(field.key, { value: null })
                        })
                    onChange(newValue)
                }}
            />
        )
    }

    if (schema.type === 'integration_field') {
        return (
            <CyclotronJobInputIntegrationField
                schema={schema}
                value={value}
                onChange={onChange}
                configuration={configuration}
            />
        )
    }

    return <Input value={value ?? ''} onChange={onChange} placeholder={schema.description || schema.label || ''} />
}
