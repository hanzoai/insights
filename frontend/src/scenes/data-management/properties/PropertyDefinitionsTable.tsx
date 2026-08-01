import './PropertyDefinitionsTable.scss'

import { useActions, useValues } from 'kea'

import { Input, Select, Tag, Link, Tooltip } from '@hanzo/elements'

import { ObjectTags } from 'lib/components/ObjectTags/ObjectTags'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { EVENT_PROPERTY_DEFINITIONS_PER_PAGE } from 'lib/constants'
import { Banner } from 'lib/elements/Banner'
import { Table, TableColumn, TableColumns } from 'lib/elements/Table'
import { cn } from 'lib/utils/css-classes'
import { DefinitionHeader, getPropertyDefinitionIcon } from 'scenes/data-management/events/DefinitionHeader'
import { propertyDefinitionsTableLogic } from 'scenes/data-management/properties/propertyDefinitionsTableLogic'
import { verifiedFilterFromOption, verifiedFilterValue, verifiedOptions } from 'scenes/data-management/utils'
import { sceneConfigurations } from 'scenes/scenes'
import { Scene } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { PropertyDefinition } from '~/types'

export function PropertyDefinitionsTable(): JSX.Element {
    const { propertyDefinitions, propertyDefinitionsLoading, filters, propertyTypeOptions, showVerifiedFilter } =
        useValues(propertyDefinitionsTableLogic)
    const { loadPropertyDefinitions, setFilters, setPropertyType } = useActions(propertyDefinitionsTableLogic)

    const columns: TableColumns<PropertyDefinition> = [
        {
            key: 'icon',
            width: 0,
            render: function Render(_, definition: PropertyDefinition) {
                return <span className="text-xl text-secondary">{getPropertyDefinitionIcon(definition)}</span>
            },
        },
        {
            title: 'Name',
            key: 'name',
            render: function Render(_, definition: PropertyDefinition) {
                return (
                    <div className="flex items-center gap-2">
                        <DefinitionHeader
                            definition={definition}
                            to={urls.propertyDefinition(definition.id)}
                            taxonomicGroupType={TaxonomicFilterGroupType.EventProperties}
                        />
                        {definition.warehouse_origin && (
                            <Tooltip
                                title={`Populated from data warehouse${
                                    definition.warehouse_origin.table_name
                                        ? ` table ${definition.warehouse_origin.table_name}`
                                        : ''
                                }${
                                    definition.warehouse_origin.last_synced_at
                                        ? ` (last synced ${definition.warehouse_origin.last_synced_at})`
                                        : ''
                                }`}
                            >
                                <Tag type="completion">Warehouse</Tag>
                            </Tooltip>
                        )}
                    </div>
                )
            },
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Type',
            key: 'type',
            render: function RenderType(_, definition: PropertyDefinition) {
                return definition.property_type ? (
                    <Tag type="success" className="uppercase">
                        {definition.property_type}
                    </Tag>
                ) : (
                    <span className="text-secondary">—</span>
                )
            },
        },
        {
            title: 'Tags',
            key: 'tags',
            render: function Render(_, definition: PropertyDefinition) {
                return <ObjectTags tags={definition.tags ?? []} staticOnly />
            },
        } as TableColumn<PropertyDefinition, keyof PropertyDefinition | undefined>,
    ]

    return (
        <SceneContent data-attr="manage-events-table">
            <SceneTitleSection
                name={sceneConfigurations[Scene.PropertyDefinition].name}
                description={sceneConfigurations[Scene.PropertyDefinition].description}
                resourceType={{
                    type: sceneConfigurations[Scene.PropertyDefinition].iconType || 'default_icon_type',
                }}
            />
            <Banner type="info">
                Looking for {filters.type === 'person' ? 'person ' : ''}property usage statistics?{' '}
                <Link
                    to={urls.insightNewInsightsQL({
                        query:
                            'SELECT arrayJoin(JSONExtractKeys(properties)) AS property_key, count()\n' +
                            (filters.type === 'person' ? 'FROM persons\n' : 'FROM events\n') +
                            (filters.type === 'person' ? '' : 'WHERE {filters}\n') +
                            'GROUP BY property_key\n' +
                            'ORDER BY count() DESC',
                        filters: { dateRange: { date_from: '-24h' } },
                    })}
                >
                    Query with SQL
                </Link>
            </Banner>
            <div className={cn('flex flex-wrap justify-between items-center gap-2')}>
                <Input
                    type="search"
                    placeholder="Search for properties"
                    onChange={(e) => setFilters({ property: e || '' })}
                    value={filters.property}
                    className="flex-1 min-w-60"
                />
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Select
                        options={propertyTypeOptions}
                        value={`${filters.type}::${filters.group_type_index ?? ''}`}
                        onSelect={setPropertyType}
                    />
                    {showVerifiedFilter && (
                        <>
                            <span>Status:</span>
                            <Select
                                value={verifiedFilterValue(filters.verified)}
                                options={verifiedOptions}
                                data-attr="property-verified-filter"
                                dropdownMatchSelectWidth={false}
                                onChange={(value) => {
                                    setFilters({
                                        verified: verifiedFilterFromOption(value),
                                    })
                                }}
                                size="small"
                            />
                        </>
                    )}
                </div>
            </div>
            <Table
                columns={columns}
                className="event-properties-definition-table"
                data-attr="event-properties-definition-table"
                loading={propertyDefinitionsLoading}
                rowKey="id"
                pagination={{
                    controlled: true,
                    currentPage: propertyDefinitions?.page ?? 1,
                    entryCount: propertyDefinitions?.count ?? 0,
                    pageSize: EVENT_PROPERTY_DEFINITIONS_PER_PAGE,
                    onForward: propertyDefinitions.next
                        ? () => {
                              loadPropertyDefinitions(propertyDefinitions.next)
                          }
                        : undefined,
                    onBackward: propertyDefinitions.previous
                        ? () => {
                              loadPropertyDefinitions(propertyDefinitions.previous)
                          }
                        : undefined,
                }}
                dataSource={propertyDefinitions.results}
                emptyState="No property definitions"
                nouns={['property', 'properties']}
            />
        </SceneContent>
    )
}
