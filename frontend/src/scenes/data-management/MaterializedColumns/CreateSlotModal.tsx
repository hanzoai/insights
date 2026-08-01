import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { IconX } from '@hanzo/icons'

import api from 'lib/api'
import { Button } from 'lib/elements/Button'
import { Input } from 'lib/elements/Input'
import { Label } from 'lib/elements/Label'
import { Modal } from 'lib/elements/Modal'
import { Tag } from 'lib/elements/Tag/Tag'
import { toast } from 'lib/elements/Toast/Toast'
import { teamLogic } from 'scenes/teamLogic'

import { PropertyDefinition, materializedColumnsLogic } from './materializedColumnsLogic'

export function CreateSlotModal(): JSX.Element {
    const { currentTeam } = useValues(teamLogic)
    const { availableProperties, availablePropertiesLoading } = useValues(materializedColumnsLogic)
    const { setShowCreateModal, loadSlots } = useActions(materializedColumnsLogic)
    const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (): Promise<void> => {
        if (!currentTeam || !selectedPropertyId) {
            return
        }

        setIsSubmitting(true)
        try {
            await api.create(`api/environments/${currentTeam.id}/materialized_column_slots/assign_slot/`, {
                property_definition_id: selectedPropertyId,
            })
            toast.success('Property queued for materialization — it will be picked up by the next weekly cycle')
            setShowCreateModal(false)
            loadSlots()
        } catch (error: any) {
            toast.error(error.detail || 'Failed to queue property for materialization')
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Filter and sort properties based on search term
    const filteredProperties = availableProperties
        .filter((prop: PropertyDefinition) => prop.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a: PropertyDefinition, b: PropertyDefinition) => a.name.localeCompare(b.name))

    const selectedProperty = availableProperties.find((prop: PropertyDefinition) => prop.id === selectedPropertyId)

    return (
        <Modal
            isOpen
            onClose={() => setShowCreateModal(false)}
            title="Assign Materialized Column Slot"
            width="36rem"
            footer={
                <>
                    <Button type="secondary" onClick={() => setShowCreateModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        disabledReason={!selectedPropertyId ? 'Please select a property' : undefined}
                    >
                        Queue for materialization
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <p className="text-muted">
                    Select a property to queue for materialization. The slot starts in <strong>PENDING</strong> state;
                    the next weekly backfill cycle will assign it a column, run the historical backfill, and transition
                    it to <strong>READY</strong>. Until then InsightsQL falls back to JSON extraction for this property.
                </p>

                <div>
                    <Label>Property to materialize</Label>
                    {selectedProperty ? (
                        <Button
                            fullWidth
                            onClick={() => setSelectedPropertyId(null)}
                            sideAction={{
                                icon: <IconX />,
                                tooltip: 'Clear selection',
                                onClick: () => setSelectedPropertyId(null),
                            }}
                        >
                            <span className="flex items-center justify-between gap-2 flex-1">
                                <span>{selectedProperty.name}</span>
                                <Tag type="default" size="small">
                                    {selectedProperty.property_type}
                                </Tag>
                            </span>
                        </Button>
                    ) : (
                        <div className="deprecated-space-y-2">
                            <Input
                                type="search"
                                placeholder="Search properties..."
                                value={searchTerm}
                                onChange={setSearchTerm}
                                fullWidth
                                autoFocus
                            />
                            <div className="max-h-60 overflow-y-auto">
                                {availablePropertiesLoading ? (
                                    <div className="p-4 text-center text-muted">Loading properties...</div>
                                ) : filteredProperties.length === 0 ? (
                                    <div className="p-4 text-center text-muted">
                                        {searchTerm ? 'No properties match your search' : 'No properties available'}
                                    </div>
                                ) : (
                                    <ul className="deprecated-space-y-px">
                                        {filteredProperties.map((prop: PropertyDefinition) => (
                                            <li key={prop.id}>
                                                <Button
                                                    fullWidth
                                                    role="menuitem"
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedPropertyId(prop.id)
                                                        setSearchTerm('')
                                                    }}
                                                >
                                                    <span className="flex items-center justify-between gap-2 flex-1">
                                                        <span className="truncate">{prop.name}</span>
                                                        <Tag type="default" size="small">
                                                            {prop.property_type}
                                                        </Tag>
                                                    </span>
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {availableProperties.length === 0 && !availablePropertiesLoading && (
                    <div className="bg-warning-highlight text-warning rounded p-3 text-sm">
                        No properties available for materialization. All eligible properties have either been
                        materialized or don't have a property_type set.
                    </div>
                )}
            </div>
        </Modal>
    )
}
