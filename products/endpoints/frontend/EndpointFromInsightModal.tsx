import { useActions, useValues } from 'kea'
import { useMemo } from 'react'

import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input'
import { Modal } from 'lib/elements/Modal'
import { Table } from 'lib/elements/Table'
import { TextArea } from 'lib/elements/TextArea'
import { Link } from 'lib/elements/Link'
import { slugify } from 'lib/utils/strings'
import { urls } from 'scenes/urls'

import { EndpointQueryNode, InsightsQLQuery } from '~/queries/schema/schema-general'

import { validateEndpointName } from './common'
import { endpointLogic } from './endpointLogic'
import { endpointsLogic } from './endpointsLogic'

export interface EndpointFromInsightModalProps {
    insightQuery: InsightsQLQuery | EndpointQueryNode
    insightShortId?: string
}

export function EndpointFromInsightModal({ insightQuery, insightShortId }: EndpointFromInsightModalProps): JSX.Element {
    const { createEndpoint, setEndpointName, setEndpointDescription, closeCreateFromInsightModal } =
        useActions(endpointLogic)
    const { endpointName, endpointDescription, createFromInsightModalOpen, duplicateEndpoint } =
        useValues(endpointLogic)
    const { endpoints } = useValues(endpointsLogic)

    const endpointsFromThisInsight = insightShortId
        ? endpoints.filter((endpoint) => endpoint.derived_from_insight === insightShortId)
        : []

    const slugifiedName = useMemo(() => (endpointName ? slugify(endpointName) : ''), [endpointName])
    const nameValidationError = useMemo(() => validateEndpointName(endpointName?.trim() || ''), [endpointName])

    const handleSubmit = (): void => {
        if (nameValidationError) {
            return
        }
        createEndpoint({
            name: endpointName!.trim(),
            description: endpointDescription?.trim() || undefined,
            query: insightQuery,
            derived_from_insight: insightShortId,
        })
    }

    const handleClose = (): void => {
        setEndpointName('')
        setEndpointDescription('')
        closeCreateFromInsightModal()
    }

    return (
        <Modal isOpen={createFromInsightModalOpen} onClose={handleClose} width={600}>
            <Modal.Header>
                <h3>{duplicateEndpoint ? 'Duplicate insight-based endpoint' : 'Create endpoint from insight'}</h3>
            </Modal.Header>

            <Modal.Content>
                <div className="space-y-4">
                    {duplicateEndpoint && (
                        <div className="text-sm text-secondary">
                            Duplicating <strong>{duplicateEndpoint.name}</strong>
                        </div>
                    )}
                    {endpointsFromThisInsight.length > 0 && (
                        <div>
                            <div className="text-muted mb-2">Endpoints already created from this insight:</div>
                            <Table
                                dataSource={endpointsFromThisInsight}
                                columns={[
                                    {
                                        title: 'Name',
                                        key: 'name',
                                        dataIndex: 'name',
                                        render: (_, record) => (
                                            <Link to={urls.endpoint(record.name)}>{record.name}</Link>
                                        ),
                                    },
                                    {
                                        title: 'Description',
                                        key: 'description',
                                        dataIndex: 'description',
                                        render: (_, record) =>
                                            record.description || <span className="text-muted">—</span>,
                                    },
                                ]}
                                size="small"
                                embedded
                            />
                        </div>
                    )}

                    <Field.Pure
                        label="Name"
                        error={endpointName?.trim() ? nameValidationError : undefined}
                        info={
                            endpointName && slugifiedName !== endpointName.trim()
                                ? `Will be saved as: ${slugifiedName}`
                                : undefined
                        }
                    >
                        <Input
                            value={endpointName || ''}
                            onChange={setEndpointName}
                            placeholder="Enter endpoint name"
                            autoFocus
                        />
                    </Field.Pure>

                    <Field.Pure label="Description">
                        <TextArea
                            value={endpointDescription || ''}
                            onChange={setEndpointDescription}
                            placeholder="Enter endpoint description (optional)"
                            rows={3}
                        />
                    </Field.Pure>
                </div>
            </Modal.Content>

            <Modal.Footer>
                <div className="flex-1" />
                <Button type="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button type="primary" onClick={handleSubmit} disabledReason={nameValidationError}>
                    Create endpoint
                </Button>
            </Modal.Footer>
        </Modal>
    )
}
