import { useEffect, useState } from 'react'

import { IconEllipsis } from '@hanzo/icons'
import {
    Banner,
    Button,
    Collapse,
    CollapsePanel,
    Dialog,
    Input,
    Label,
    Select,
} from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { InsightsFunctionMapping, MappingSummary } from 'scenes/insights-functions/mapping/InsightsFunctionMappings'

import { InsightsFunctionConfigurationType, InsightsFunctionMappingType } from '~/types'

export function InsightsFlowFunctionMappings({
    useMapping,
    inputs,
    inputs_schema,
    mappings,
    mappingTemplates,
    onChange,
}: {
    useMapping: boolean
    inputs: InsightsFunctionConfigurationType['inputs']
    inputs_schema: InsightsFunctionConfigurationType['inputs_schema']
    mappings: InsightsFunctionMappingType[]
    mappingTemplates: InsightsFunctionMappingType[]
    onChange: (mappings: InsightsFunctionMappingType[]) => void
}): JSX.Element | null {
    const [activeKeys, setActiveKeys] = useState<number[]>([])

    // If there is only one mapping template, then we start it expanded
    useEffect(() => {
        if (mappings?.length === 1) {
            setActiveKeys([0])
        }
    }, [mappings?.length])

    if (!useMapping) {
        return null
    }

    // Default to empty array if mappings is undefined
    // This ensures the UI renders even when no mappings exist
    const mappingsValue = mappings ?? []

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

    const toggleDisabled = (mapping: InsightsFunctionMappingType): void => {
        const index = mappingsValue.findIndex((m) => m === mapping)
        if (index !== -1) {
            onChange(mappingsValue.map((m, i) => (i === index ? { ...m, disabled: !m.disabled } : m)))
        }
    }

    const renameMapping = (mapping: InsightsFunctionMappingType): void => {
        Dialog.openForm({
            title: 'Rename mapping',
            initialValues: { mappingName: mapping.name },
            content: (
                <Field name="mappingName">
                    <Input data-attr="mapping-name" placeholder="Please enter the new name" autoFocus />
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
                        Configure which events should act as triggers including filters and custom transformations
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
                                                        <Button onClick={() => toggleDisabled(mapping)}>
                                                            {mapping.disabled ? 'Enable' : 'Disable'}
                                                        </Button>
                                                        <Button onClick={() => renameMapping(mapping)}>
                                                            Rename
                                                        </Button>
                                                        <Button onClick={() => duplicateMapping(mapping)}>
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
                                            parentConfiguration={{
                                                inputs,
                                                inputs_schema,
                                            }}
                                            key={index}
                                            index={index}
                                            mapping={mapping}
                                            onChange={(mapping) => {
                                                if (!mapping) {
                                                    onChange(mappingsValue.filter((_, i) => i !== index))
                                                } else {
                                                    onChange(mappingsValue.map((m, i) => (i === index ? mapping : m)))
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
                        You have no mappings configured which effectively means the function is disabled as there is
                        nothing to trigger it.
                    </Banner>
                )}
            </div>
        </div>
    )
}
