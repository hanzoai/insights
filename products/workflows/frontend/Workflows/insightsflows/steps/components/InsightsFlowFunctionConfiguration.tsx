import { useValues } from 'kea'
import { useEffect } from 'react'

import { Spinner } from '@hanzo/lemon-ui'

import { CyclotronJobInputs } from 'lib/components/CyclotronJob/CyclotronJobInputs'
import { templateToConfiguration } from 'scenes/insights-functions/configuration/insightsFunctionConfigurationLogic'

import { CyclotronJobInputType, InsightsFunctionMappingType } from '~/types'

import { workflowLogic } from '../../../workflowLogic'
import { InsightsFlowFunctionMappings } from './InsightsFlowFunctionMappings'

export function InsightsFlowFunctionConfiguration({
    templateId,
    inputs,
    setInputs,
    mappings,
    setMappings,
    errors,
}: {
    templateId: string
    inputs: Record<string, CyclotronJobInputType>
    mappings?: InsightsFunctionMappingType[]
    setInputs: (inputs: Record<string, CyclotronJobInputType>) => void
    setMappings?: (mappings: InsightsFunctionMappingType[]) => void
    errors?: Record<string, string>
}): JSX.Element {
    const { workflow, insightsFunctionTemplatesById, insightsFunctionTemplatesByIdLoading } = useValues(workflowLogic)

    const template = insightsFunctionTemplatesById[templateId]
    useEffect(() => {
        // oxlint-disable-next-line exhaustive-deps
        if (template && Object.keys(inputs ?? {}).length === 0) {
            setInputs(templateToConfiguration(template).inputs ?? {})
        }
    }, [templateId])

    if (insightsFunctionTemplatesByIdLoading) {
        return (
            <div className="flex justify-center items-center">
                <Spinner />
            </div>
        )
    }

    if (!template) {
        return <div>Template not found!</div>
    }

    const triggerType = workflow?.trigger?.type

    // Build workflow variables object for autocomplete
    const workflowVariables: Record<string, any> = {}
    if (workflow?.variables) {
        workflow.variables.forEach((variable) => {
            // Use placeholder values based on variable type
            if (variable.type === 'string') {
                workflowVariables[variable.key] = 'example_value'
            } else if (variable.type === 'number') {
                workflowVariables[variable.key] = 123
            } else if (variable.type === 'boolean') {
                workflowVariables[variable.key] = true
            } else if (variable.type === 'dictionary' || variable.type === 'json') {
                workflowVariables[variable.key] = {}
            } else {
                workflowVariables[variable.key] = null
            }
        })
    }

    const sampleGlobals: Record<string, any> = {
        variables: workflowVariables,
    }

    if (triggerType === 'webhook') {
        sampleGlobals.request = {
            method: 'POST',
            headers: {},
            body: {},
            params: {},
        }
    } else if (triggerType === 'event') {
        // Event-based triggers
        sampleGlobals.event = {
            event: 'example_event',
            distinct_id: 'user123',
            properties: {
                $current_url: 'https://example.com',
            },
            timestamp: '2024-01-01T12:00:00Z',
        }
        sampleGlobals.person = {
            id: 'person123',
            properties: {
                email: 'user@example.com',
                name: 'John Doe',
            },
        }
        sampleGlobals.groups = {}
    }

    return (
        <>
            <CyclotronJobInputs
                errors={errors}
                configuration={{
                    inputs: inputs as Record<string, CyclotronJobInputType>,
                    inputs_schema: template?.inputs_schema ?? [],
                }}
                showSource={false}
                sampleGlobalsWithInputs={sampleGlobals}
                onInputChange={(key, value) => setInputs({ ...inputs, [key]: value })}
            />
            <InsightsFlowFunctionMappings
                useMapping={Array.isArray(mappings) ?? (template?.mapping_templates?.length ?? 0) > 0}
                inputs={inputs}
                inputs_schema={template?.inputs_schema ?? []}
                mappings={mappings ?? []}
                mappingTemplates={template?.mapping_templates ?? []}
                onChange={(mappings) => setMappings?.(mappings)}
            />
        </>
    )
}
