import { useActions, useValues } from 'kea'

import { Tag } from '@hanzo/elements'

import { ObjectTags } from 'lib/components/ObjectTags/ObjectTags'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { PROPERTY_DEFINITIONS_PER_EVENT } from 'lib/constants'
import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { Table, TableColumn, TableColumns } from 'lib/elements/Table'
import { eventDefinitionsTableLogic } from 'scenes/data-management/events/eventDefinitionsTableLogic'
import { urls } from 'scenes/urls'

import { SceneSection } from '~/layout/scenes/components/SceneSection'
import { EventDefinition, PropertyDefinition } from '~/types'

import { DefinitionHeader } from './DefinitionHeader'

export function EventDefinitionProperties({ definition }: { definition: EventDefinition }): JSX.Element {
    const { loadPropertiesForEvent } = useActions(eventDefinitionsTableLogic)
    const { eventPropertiesCacheMap, eventDefinitionPropertiesLoading } = useValues(eventDefinitionsTableLogic)

    useOnMountEffect(() => loadPropertiesForEvent(definition))

    const columns: TableColumns<PropertyDefinition> = [
        {
            title: 'Property',
            key: 'property',
            render: function Render(_, _definition: PropertyDefinition) {
                return (
                    <DefinitionHeader
                        definition={_definition}
                        to={urls.propertyDefinition(_definition.id)}
                        taxonomicGroupType={TaxonomicFilterGroupType.EventProperties}
                    />
                )
            },
        },
        {
            title: 'Type',
            key: 'type',
            render: function Render(_, _definition: PropertyDefinition) {
                return <Tag type="muted">{_definition.property_type ?? '—'}</Tag>
            },
        },
        {
            title: 'Tags',
            key: 'tags',
            render: function Render(_, _definition: PropertyDefinition) {
                return <ObjectTags tags={_definition.tags ?? []} staticOnly />
            },
        } as TableColumn<PropertyDefinition, keyof PropertyDefinition | undefined>,
        {
            title: 'Example',
            key: 'example',
            align: 'right',
            render: function Render(_, _definition: PropertyDefinition) {
                return (
                    <Tag className="font-mono" type="muted">
                        {_definition.example !== undefined ? JSON.stringify(_definition.example) : '—'}
                    </Tag>
                )
            },
        },
    ]

    return (
        <SceneSection
            title="Top properties"
            description="Please note that description and tags are shared across events. Insights properties are excluded from this list."
        >
            <Table
                id={`event-properties-definition-table-${definition.id}`}
                data-attr="event-properties-definition-nested-table"
                columns={columns}
                dataSource={eventPropertiesCacheMap?.[definition.id]?.results ?? []}
                emptyState="This event has no properties"
                nouns={['property definition', 'property definitions']}
                pagination={{
                    controlled: true,
                    pageSize: PROPERTY_DEFINITIONS_PER_EVENT,
                    currentPage: eventPropertiesCacheMap?.[definition.id]?.page ?? 1,
                    entryCount: eventPropertiesCacheMap?.[definition.id]?.count ?? 0,
                    onForward: eventPropertiesCacheMap?.[definition.id]?.next
                        ? () => {
                              loadPropertiesForEvent(definition, eventPropertiesCacheMap[definition.id].next)
                          }
                        : undefined,
                    onBackward: eventPropertiesCacheMap?.[definition.id]?.previous
                        ? () => {
                              loadPropertiesForEvent(definition, eventPropertiesCacheMap[definition.id].previous)
                          }
                        : undefined,
                }}
                loading={eventDefinitionPropertiesLoading.includes(definition.id)}
            />
        </SceneSection>
    )
}
