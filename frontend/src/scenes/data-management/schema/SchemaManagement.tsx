import { useActions, useValues } from 'kea'

import { IconApps, IconPencil, IconPlus, IconTrash } from '@hanzo/icons'
import { Button, Input, Tag, Link } from '@hanzo/elements'

import { NotFound } from 'lib/components/NotFound'
import { FEATURE_FLAGS } from 'lib/constants'
import { Table, TableColumns } from 'lib/elements/Table'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { urls } from '~/scenes/urls'

import { PropertyGroupModal } from './PropertyGroupModal'
import { PropertyTypeTag } from './PropertyTypeTag'
import {
    EventDefinitionBasic,
    SchemaPropertyGroup,
    SchemaPropertyGroupProperty,
    schemaManagementLogic,
} from './schemaManagementLogic'

function EventRow({ event }: { event: EventDefinitionBasic }): JSX.Element {
    return (
        <div className="py-3 px-4 border-b last:border-b-0">
            <Link to={urls.eventDefinition(event.id)} className="font-semibold text-default">
                {event.name}
            </Link>
        </div>
    )
}

function PropertyRow({ property }: { property: SchemaPropertyGroupProperty }): JSX.Element {
    return (
        <div className="flex items-center gap-4 py-3 px-4 border-b last:border-b-0">
            <div className="flex-1">
                <Link
                    to={`${urls.propertyDefinitions()}?property=${encodeURIComponent(property.name)}`}
                    className="font-semibold text-default"
                >
                    {property.name}
                </Link>
            </div>
            <div className="w-32">
                <PropertyTypeTag propertyName={property.name} schemaPropertyType={property.property_type} />
            </div>
            <div className="w-24 flex gap-1 flex-wrap">
                {property.is_required ? (
                    <Tag type="danger">Required</Tag>
                ) : (
                    <Tag type="muted">Optional</Tag>
                )}
                {property.is_required && property.is_optional_in_types && (
                    <Tag type="muted">Optional in types</Tag>
                )}
            </div>
            <div className="flex-1 text-muted">{property.description || '—'}</div>
        </div>
    )
}

export function SchemaManagement(): JSX.Element {
    const { featureFlags } = useValues(featureFlagLogic)
    const { filteredPropertyGroups, propertyGroupsLoading, searchTerm } = useValues(schemaManagementLogic)
    const { setSearchTerm, setPropertyGroupModalOpen, setEditingPropertyGroup, deletePropertyGroup } =
        useActions(schemaManagementLogic)

    if (!featureFlags[FEATURE_FLAGS.SCHEMA_MANAGEMENT]) {
        return <NotFound object="page" caption="Schema management is not available." />
    }

    const columns: TableColumns<SchemaPropertyGroup> = [
        {
            key: 'expander',
            width: 0,
        },
        {
            title: 'Name',
            key: 'name',
            dataIndex: 'name',
            render: (name) => <span className="font-semibold">{String(name ?? '')}</span>,
        },
        {
            title: 'Description',
            key: 'description',
            dataIndex: 'description',
            render: (description) => (
                <span className="text-muted">{typeof description === 'string' ? description : '—'}</span>
            ),
        },
        {
            title: 'Properties',
            key: 'property_count',
            width: 120,
            render: (_, propertyGroup) => (
                <Tag type="default">
                    {propertyGroup.properties?.length || 0}{' '}
                    {propertyGroup.properties?.length === 1 ? 'property' : 'properties'}
                </Tag>
            ),
        },
        {
            key: 'actions',
            width: 100,
            render: (_, propertyGroup) => (
                <div className="flex gap-1">
                    <Button
                        icon={<IconPencil />}
                        size="small"
                        onClick={() => {
                            setEditingPropertyGroup(propertyGroup)
                            setPropertyGroupModalOpen(true)
                        }}
                    />
                    <Button
                        icon={<IconTrash />}
                        size="small"
                        status="danger"
                        onClick={() => {
                            if (
                                confirm(
                                    `Are you sure you want to delete "${propertyGroup.name}"? This action cannot be undone.`
                                )
                            ) {
                                deletePropertyGroup(propertyGroup.id)
                            }
                        }}
                    />
                </div>
            ),
        },
    ]

    return (
        <SceneContent>
            <SceneTitleSection
                name="Property Groups"
                description="Define reusable property groups to establish schemas for your events."
                resourceType={{
                    type: 'schema',
                    forceIcon: <IconApps />,
                }}
            />
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <Input
                        type="search"
                        placeholder="Search property groups..."
                        className="max-w-60"
                        value={searchTerm}
                        onChange={setSearchTerm}
                    />
                    <Button
                        type="primary"
                        icon={<IconPlus />}
                        onClick={() => {
                            setEditingPropertyGroup(null)
                            setPropertyGroupModalOpen(true)
                        }}
                    >
                        New Property Group
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredPropertyGroups}
                    loading={propertyGroupsLoading}
                    rowKey="id"
                    expandable={{
                        expandedRowRender: (propertyGroup) => (
                            <div className="space-y-4 mx-4 mb-2 mt-2">
                                {/* Events Section */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Events</h3>
                                    <div className="border rounded overflow-hidden bg-bg-light">
                                        {propertyGroup.events && propertyGroup.events.length > 0 ? (
                                            <>
                                                <div className="flex gap-4 py-2 px-4 bg-accent-3000 border-b text-xs font-semibold uppercase tracking-wider">
                                                    <div className="flex-1">Event Name</div>
                                                </div>
                                                {propertyGroup.events.map((event) => (
                                                    <EventRow key={event.id} event={event} />
                                                ))}
                                            </>
                                        ) : (
                                            <div className="text-center text-muted py-4">
                                                No events using this property group
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Properties Section */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Properties</h3>
                                    <div className="border rounded overflow-hidden bg-bg-light">
                                        {propertyGroup.properties && propertyGroup.properties.length > 0 ? (
                                            <>
                                                <div className="flex gap-4 py-2 px-4 bg-accent-3000 border-b text-xs font-semibold uppercase tracking-wider">
                                                    <div className="flex-1">Property</div>
                                                    <div className="w-32">Type</div>
                                                    <div className="w-24">Required</div>
                                                    <div className="flex-1">Description</div>
                                                </div>
                                                {propertyGroup.properties.map((property) => (
                                                    <PropertyRow key={property.id} property={property} />
                                                ))}
                                            </>
                                        ) : (
                                            <div className="text-center text-muted py-4">No properties defined</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ),
                        rowExpandable: (propertyGroup) =>
                            (propertyGroup.events && propertyGroup.events.length > 0) ||
                            (propertyGroup.properties && propertyGroup.properties.length > 0),
                    }}
                    emptyState="No property groups yet. Create one to get started!"
                />
            </div>

            <PropertyGroupModal />
        </SceneContent>
    )
}
