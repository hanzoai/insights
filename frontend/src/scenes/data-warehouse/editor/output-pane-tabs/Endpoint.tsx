import { useActions, useValues } from 'kea'

import { IconEndpoints } from '@hanzo/icons'
import {
    Button,
    Input,
    Select,
    Switch,
    Tag,
    TextArea,
    Link,
    toast,
} from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { Field } from 'lib/elements/Field'

import { variablesLogic } from '~/queries/nodes/DataVisualization/Components/Variables/variablesLogic'
import { NodeKind } from '~/queries/schema/schema-general'
import { AccessControlLevel, AccessControlResourceType } from '~/types'

import { endpointLogic } from 'products/endpoints/frontend/endpointLogic'
import { endpointsLogic } from 'products/endpoints/frontend/endpointsLogic'

import { sqlEditorLogic } from '../sqlEditorLogic'

interface EndpointProps {
    tabId: string
}

export function Endpoint({ tabId }: EndpointProps): JSX.Element {
    const {
        setEndpointName,
        setEndpointDescription,
        setIsUpdateMode,
        setSelectedEndpointName,
        createEndpoint,
        updateEndpoint,
    } = useActions(endpointLogic)
    const { endpointName, endpointDescription, isUpdateMode, selectedEndpointName } = useValues(endpointLogic)
    const { endpoints } = useValues(endpointsLogic)

    const { variablesForInsight } = useValues(variablesLogic)
    const { queryInput } = useValues(sqlEditorLogic)

    const handleSubmit = (): void => {
        const sqlQuery = queryInput || ''
        if (!sqlQuery.trim()) {
            toast.error('You are missing a InsightsQL query.')
            return
        }

        if (isUpdateMode && !selectedEndpointName) {
            toast.error('You need to select an endpoint to update.')
            return
        }

        if (!isUpdateMode && !endpointName) {
            toast.error('You need to name your endpoint.')
            return
        }

        const transformedVariables = Object.fromEntries(
            variablesForInsight.map((variable) => [
                variable.id,
                {
                    variableId: variable.id,
                    code_name: variable.code_name,
                    value: variable.value || variable.default_value,
                    isNull: variable.isNull || false,
                },
            ])
        )

        const queryPayload = {
            kind: NodeKind.InsightsQLQuery as const,
            query: sqlQuery,
            variables: transformedVariables,
        }

        if (isUpdateMode && selectedEndpointName) {
            updateEndpoint(
                selectedEndpointName,
                {
                    description: endpointDescription || undefined,
                    query: queryPayload,
                },
                { showViewButton: true }
            )
        } else {
            createEndpoint({
                name: endpointName || undefined,
                description: endpointDescription || undefined,
                query: queryPayload,
            })
        }
    }

    return (
        <div className="overflow-auto" data-attr="sql-editor-endpoint-pane">
            <div className="flex flex-row items-center gap-2">
                <h3 className="mb-0">Endpoint</h3>
                <Tag type="warning">BETA</Tag>
            </div>
            <div className="space-y-2">
                <p className="text-xs">
                    Endpoints allows you to pre-define a query that you'd like to expose as an API endpoint to use in
                    your customer-facing dashboard, on your landing page or in your internal tool.
                    <br />
                    <Link data-attr="endpoints-help" to="https://hanzo.ai/docs/endpoints" target="_blank">
                        Learn more about endpoints.
                    </Link>
                </p>

                <div className="flex items-center gap-2">
                    <Switch
                        checked={isUpdateMode}
                        onChange={(checked) => {
                            setIsUpdateMode(checked)
                            if (checked) {
                                setEndpointName('')
                            } else {
                                setSelectedEndpointName(null)
                            }
                        }}
                        label="Update existing endpoint"
                    />
                </div>

                {isUpdateMode ? (
                    <Field.Pure label="Select endpoint">
                        <Select
                            value={selectedEndpointName}
                            onChange={(value) => setSelectedEndpointName(value)}
                            options={endpoints.map((endpoint) => ({
                                value: endpoint.name,
                                label: endpoint.name,
                            }))}
                            placeholder="Select an endpoint to update"
                            className="max-w-prose"
                        />
                    </Field.Pure>
                ) : (
                    <Field.Pure label="Endpoint name">
                        <Input
                            id={`endpoint-name-${tabId}`}
                            type="text"
                            onChange={setEndpointName}
                            value={endpointName || ''}
                            className="max-w-prose"
                        />
                    </Field.Pure>
                )}

                <Field.Pure label="Endpoint description">
                    <TextArea
                        minRows={1}
                        maxRows={3}
                        onChange={setEndpointDescription}
                        value={endpointDescription || ''}
                        className="max-w-prose"
                    />
                </Field.Pure>

                <AccessControlAction
                    resourceType={AccessControlResourceType.Endpoint}
                    minAccessLevel={AccessControlLevel.Editor}
                >
                    <Button type="primary" onClick={handleSubmit} icon={<IconEndpoints />} size="medium">
                        {isUpdateMode ? 'Update endpoint' : 'Create endpoint'}
                    </Button>
                </AccessControlAction>
            </div>
        </div>
    )
}
