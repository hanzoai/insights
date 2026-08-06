import { useValues } from 'kea'
import { Group } from 'kea-forms'
import { memo, useEffect, useState } from 'react'

import { IconArrowRight, IconEllipsis, IconFilter, IconPlus } from '@hanzo/icons'
import {
    Banner,
    Button,
    Collapse,
    CollapsePanel,
    Dialog,
    Input,
    Label,
    Select,
    Tooltip,
} from '@hanzo/elements'

import { CyclotronJobInputs } from 'lib/components/CyclotronJob/CyclotronJobInputs'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { Field } from 'lib/elements/Field'
import { ActionFilter } from 'scenes/insights/filters/ActionFilter/ActionFilter'
import { MathAvailability } from 'scenes/insights/filters/ActionFilter/ActionFilterRow/ActionFilterRow'

import { groupsModel } from '~/models/groupsModel'
import { EntityTypes, InsightsFunctionConfigurationType, InsightsFunctionMappingType } from '~/types'

import { insightsFunctionConfigurationLogic } from '../configuration/insightsFunctionConfigurationLogic'

export const humanize = (value: string): string => {
    const fallback = typeof value === 'string' ? (value ?? '') : ''

    // Simple replacement from something like MY_STRING-here to My string here
    return fallback
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

export const MappingSummary = memo(function MappingSummary({
    mapping,
}: {
    mapping: InsightsFunctionMappingType
}): JSX.Element | null {
    const events = mapping.filters?.events?.map((event) => event.name ?? event.id) ?? []
    const actions = mapping.filters?.actions?.map((action) => action.name ?? action.id) ?? []

    const propertyFiltersCount =
        (mapping.filters?.events?.filter((event) => event.properties?.length ?? 0) ?? []).length +
        (mapping.filters?.actions?.filter((action) => action.properties?.length ?? 0) ?? []).length

    const eventSummary = [...events, ...actions].join(', ')

    const firstInput = mapping.inputs_schema?.[0]
    const firstInputValue = (firstInput?.key ? mapping.inputs?.[firstInput.key]?.value : null) ?? '(custom value)'

    return (
        <span className="flex flex-1 gap-4 items-center">
            <span>
                {eventSummary ? humanize(eventSummary) : <span className="text-secondary">All events</span>}{' '}
                {propertyFiltersCount ? (
                    <span className="text-secondary">
                        <Tooltip title={`Events have ${propertyFiltersCount} additional filters`}>
                            <IconFilter />
                        </Tooltip>
                    </span>
                ) : null}
            </span>
            <IconArrowRight className="text-secondary" />
            <span>
                {mapping.name
                    ? humanize(mapping.name)
                    : typeof firstInputValue === 'object'
                      ? JSON.stringify(firstInputValue)
                      : humanize(firstInputValue)}
            </span>
            <span className="flex-1" />
        </span>
    )
})

export function InsightsFunctionMapping({
    index,
    mapping,
    onChange,
    parentConfiguration,
}: {
    index: number
    mapping: InsightsFunctionMappingType
    onChange: (mapping: InsightsFunctionMappingType | null) => void
    parentConfiguration: Pick<InsightsFunctionConfigurationType, 'inputs_schema' | 'inputs'>
}): JSX.Element | null {
    const { groupsTaxonomicTypes } = useValues(groupsModel)
    const { showSource, sampleGlobalsWithInputs } = useValues(insightsFunctionConfigurationLogic)
    const hideEventFilter = mapping.use_all_events_by_default === true

    return (
        <>
            <div className="p-3 pl-10 deprecated-space-y-2">
                {!hideEventFilter && (
                    <>
                        <Label>Match events and actions</Label>
                        <ActionFilter
                            filters={mapping.filters ?? ({} as any)}
                            setFilters={(f: any) => onChange({ ...mapping, filters: f })}
                            typeKey={`match-group-${index}`}
                            mathAvailability={MathAvailability.None}
                            hideRename
                            hideDuplicate
                            showNestedArrow={false}
                            actionsTaxonomicGroupTypes={[
                                TaxonomicFilterGroupType.Events,
                                TaxonomicFilterGroupType.Actions,
                            ]}
                            propertiesTaxonomicGroupTypes={[
                                TaxonomicFilterGroupType.EventProperties,
                                TaxonomicFilterGroupType.EventFeatureFlags,
                                TaxonomicFilterGroupType.Elements,
                                TaxonomicFilterGroupType.PersonProperties,
                                TaxonomicFilterGroupType.InsightsQLExpression,
                                ...groupsTaxonomicTypes,
                            ]}
                            propertyFiltersPopover
                            addFilterDefaultOptions={{
                                id: '$pageview',
                                name: '$pageview',
                                type: EntityTypes.EVENTS,
                            }}
                            buttonProps={{
                                type: 'secondary',
                            }}
                            buttonCopy="Add event matcher"
                        />
                    </>
                )}
                <Group name={['mappings', index]}>
                    <CyclotronJobInputs
                        configuration={{
                            inputs_schema: mapping.inputs_schema ?? [],
                            inputs: mapping.inputs ?? {},
                        }}
                        parentConfiguration={{
                            inputs_schema: parentConfiguration.inputs_schema ?? [],
                            inputs: parentConfiguration.inputs ?? {},
                        }}
                        onInputSchemaChange={(schema) => {
                            onChange({ ...mapping, inputs_schema: schema })
                        }}
                        onInputChange={(key, value) => {
                            onChange({ ...mapping, inputs: { ...mapping.inputs, [key]: value } })
                        }}
                        showSource={showSource}
                        sampleGlobalsWithInputs={sampleGlobalsWithInputs}
                    />
                </Group>
                {showSource ? (
                    <Button
                        icon={<IconPlus />}
                        size="small"
                        type="secondary"
                        className="my-4"
                        onClick={() => {
                            onChange({
                                ...mapping,
                                inputs_schema: [
                                    ...(mapping.inputs_schema ?? []),
                                    {
                                        type: 'string',
                                        key: `var_${(mapping.inputs_schema?.length ?? 0) + 1}`,
                                        label: '',
                                        required: false,
                                    },
                                ],
                            })
                        }}
                    >
                        Add input variable
                    </Button>
                ) : null}
            </div>
        </>
    )
}

export function InsightsFunctionMappings(): JSX.Element | null {
    const { useMapping, mappingTemplates, configuration } = useValues(insightsFunctionConfigurationLogic)
    const [activeKeys, setActiveKeys] = useState<number[]>([])

    // If there is only one mapping template, then we start it expanded
    useEffect(() => {
        if (configuration.mappings?.length === 1) {
            setActiveKeys([0])
        }
    }, [configuration.mappings?.length])

    if (!useMapping) {
        return null
    }

    return (
        <Field name="mappings">
            {({
                value,
                onChange,
            }: {
                value: InsightsFunctionMappingType[] | undefined
                onChange: (mappings: InsightsFunctionMappingType[]) => void
            }) => {
                // Default to empty array if mappings is undefined
                // This ensures the UI renders even when no mappings exist
                const mappingsValue = value ?? []

                const addMapping = (template: string): void => {
                    const mappingTemplate = mappingTemplates.find((t) => t.name === template)
                    if (mappingTemplate) {
                        const { name, ...mapping } = mappingTemplate

                        const inputs = mapping.inputs_schema
                            ? Object.fromEntries(
                                  mapping.inputs_schema
                                      .filter((m) => m.default !== undefined)
                                      .map((m) => [m.key, { value: structuredClone(m.default) }])
                              )
                            : {}
                        onChange([...mappingsValue, { ...mapping, name, inputs }])
                        setActiveKeys([...activeKeys, mappingsValue.length])
                    }
                    return
                }

                const duplicateMapping = (mapping: InsightsFunctionMappingType): void => {
                    const index = mappingsValue.findIndex((m) => m === mapping)
                    if (index !== -1) {
                        const newMappings = [...mappingsValue]
                        newMappings.splice(index + 1, 0, mapping)
                        onChange(newMappings)
                        setActiveKeys([index + 1])
                    }
                }

                const removeMapping = (mapping: InsightsFunctionMappingType): void => {
                    const index = mappingsValue.findIndex((m) => m === mapping)
                    if (index !== -1) {
                        onChange(mappingsValue.filter((_, i) => i !== index))
                        setActiveKeys(activeKeys.filter((i) => i !== index))
                    }
                }

                const renameMapping = (mapping: InsightsFunctionMappingType): void => {
                    Dialog.openForm({
                        title: 'Rename mapping',
                        initialValues: { mappingName: mapping.name },
                        content: (
                            <Field name="mappingName">
                                <Input
                                    data-attr="mapping-name"
                                    placeholder="Please enter the new name"
                                    autoFocus
                                />
                            </Field>
                        ),
                        errors: {
                            mappingName: (name) => (!name ? 'You must enter a name' : undefined),
                        },
                        onSubmit: async ({ mappingName }) => {
                            const index = mappingsValue.findIndex((m) => m === mapping)
                            if (index !== -1) {
                                onChange(mappingsValue.map((m, i) => (i === index ? { ...m, name: mappingName } : m)))
                            }
                        },
                    })
                }

                const addMappingButton = mappingTemplates.length ? (
                    <Select
                        placeholder="Add mapping"
                        onChange={(template) => {
                            addMapping(template)
                        }}
                        options={mappingTemplates.map((t) => ({
                            label: t.name,
                            value: t.name,
                        }))}
                    />
                ) : null

                return (
                    <div className="p-3 rounded border bg-surface-primary">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <Label>Mappings</Label>
                                <p className="text-sm text-secondary">
                                    Configure which events should act as triggers including filters and custom
                                    transformations
                                </p>
                            </div>
                            {addMappingButton}
                        </div>

                        <div className="deprecated-space-y-2">
                            {mappingsValue.length ? (
                                <div className="-mx-3 border-t border-b">
                                    <Collapse
                                        multiple
                                        embedded
                                        activeKeys={activeKeys}
                                        onChange={(activeKeys) => setActiveKeys(activeKeys)}
                                        panels={mappingsValue.map(
                                            (mapping, index): CollapsePanel<number> => ({
                                                key: index,
                                                header: {
                                                    children: <MappingSummary mapping={mapping} />,
                                                    sideAction: {
                                                        icon: <IconEllipsis />,
                                                        dropdown: {
                                                            overlay: (
                                                                <div className="deprecated-space-y-px">
                                                                    <Button onClick={() => renameMapping(mapping)}>
                                                                        Rename
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => duplicateMapping(mapping)}
                                                                    >
                                                                        Duplicate
                                                                    </Button>
                                                                    <Button
                                                                        status="danger"
                                                                        onClick={() => removeMapping(mapping)}
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                </div>
                                                            ),
                                                        },
                                                    },
                                                },
                                                className: 'p-0 bg-accent-light',
                                                content: (
                                                    <InsightsFunctionMapping
                                                        parentConfiguration={configuration}
                                                        key={index}
                                                        index={index}
                                                        mapping={mapping}
                                                        onChange={(mapping) => {
                                                            if (!mapping) {
                                                                onChange(mappingsValue.filter((_, i) => i !== index))
                                                            } else {
                                                                onChange(
                                                                    mappingsValue.map((m, i) =>
                                                                        i === index ? mapping : m
                                                                    )
                                                                )
                                                            }
                                                        }}
                                                    />
                                                ),
                                            })
                                        )}
                                    />
                                </div>
                            ) : (
                                <Banner type="warning" className="p-2">
                                    You have no mappings configured which effectively means the function is disabled as
                                    there is nothing to trigger it.
                                </Banner>
                            )}
                        </div>
                    </div>
                )
            }}
        </Field>
    )
}
