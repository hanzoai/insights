import { actions, connect, kea, key, listeners, path, props, reducers, selectors } from 'kea'

import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { uuid } from 'lib/utils'
import { MathCategory, mathTypeToApiValues, mathsLogic } from 'scenes/trends/mathsLogic'

import { AnyPropertyFilter, EntityType, EntityTypes, FilterLogicalOperator } from '~/types'

import { LocalFilter, entityFilterLogic } from '../entityFilterLogic'
import type { actionFilterGroupLogicType } from './actionFilterGroupLogicType'

export interface ActionFilterGroupLogicProps {
    filterUuid: string
    typeKey: string
    groupIndex: number
}

/** Extract math properties from a filter for spreading */
function getMathProps(filter: LocalFilter): Record<string, any> {
    return {
        ...(filter.math && { math: filter.math }),
        ...(filter.math_property && { math_property: filter.math_property }),
        ...(filter.math_property_type && { math_property_type: filter.math_property_type }),
        ...(filter.math_insightsql && { math_insightsql: filter.math_insightsql }),
        ...(filter.math_group_type_index !== undefined && {
            math_group_type_index: filter.math_group_type_index,
        }),
    }
}

export const actionFilterGroupLogic = kea<actionFilterGroupLogicType>([
    path(['scenes', 'insights', 'filters', 'ActionFilter', 'ActionFilterGroup', 'actionFilterGroupLogic']),
    props({} as ActionFilterGroupLogicProps),
    key((props) => props.filterUuid),
    connect((props: ActionFilterGroupLogicProps) => ({
        actions: [entityFilterLogic({ typeKey: props.typeKey }), ['updateFilter as updateParentFilter']],
        values: [entityFilterLogic({ typeKey: props.typeKey }), ['localFilters'], mathsLogic, ['mathDefinitions']],
    })),

    actions({
        addNestedFilter: (id: string, name: string, type: EntityType) => ({ id, name, type }),
        updateNestedFilter: (nestedIndex: number, updates: Partial<LocalFilter>) => ({ nestedIndex, updates }),
        updateNestedFilterProperties: (nestedIndex: number, properties: AnyPropertyFilter[]) => ({
            nestedIndex,
            properties,
        }),
        removeNestedFilter: (nestedIndex: number) => ({ nestedIndex }),
        setMath: (selectedMath: string | undefined) => ({ selectedMath }),
        setMathProperty: (property: string, propertyType: TaxonomicFilterGroupType) => ({ property, propertyType }),
        setMathInsightsQL: (insightsql: string) => ({ insightsql }),
        setInsightsQLDropdownVisible: (visible: boolean) => ({ visible }),
    }),

    reducers({
        isInsightsQLDropdownVisible: [
            false,
            {
                setInsightsQLDropdownVisible: (_, { visible }) => visible,
            },
        ],
    }),

    selectors({
        groupFilter: [
            (s, p) => [s.localFilters, p.groupIndex],
            (localFilters, groupIndex): LocalFilter | undefined => localFilters[groupIndex],
        ],
        nestedFilters: [
            (s) => [s.groupFilter],
            (groupFilter): LocalFilter[] =>
                ((groupFilter?.nestedFilters as LocalFilter[] | undefined) || []).map((val, i) => ({
                    ...val,
                    order: i,
                })),
        ],
        operator: [
            (s) => [s.groupFilter],
            (groupFilter): FilterLogicalOperator => groupFilter?.operator || FilterLogicalOperator.Or,
        ],
    }),

    listeners(({ actions, values, props }) => {
        const updateGroup = (nestedFilters: LocalFilter[], extras: Record<string, any> = {}): void => {
            const groupFilter = values.groupFilter
            if (!groupFilter) {
                return
            }

            actions.updateParentFilter({
                type: EntityTypes.GROUPS,
                operator: values.operator,
                nestedFilters,
                name: nestedFilters.map((v) => v.name).join(', '),
                index: props.groupIndex,
                ...getMathProps(groupFilter),
                ...extras,
            } as any)
        }

        return {
            addNestedFilter: ({ id, name, type }) => {
                const groupFilter = values.groupFilter
                if (!groupFilter) {
                    return
                }

                const newFilter: LocalFilter = {
                    id,
                    name,
                    type,
                    order: values.nestedFilters.length,
                    uuid: uuid(),
                    ...getMathProps(groupFilter),
                }

                updateGroup([...values.nestedFilters, newFilter])
            },
            updateNestedFilter: ({ nestedIndex, updates }) => {
                const newFilters = [...values.nestedFilters]
                newFilters[nestedIndex] = { ...newFilters[nestedIndex], ...updates }
                updateGroup(newFilters)
            },
            updateNestedFilterProperties: ({ nestedIndex, properties }) => {
                const newFilters = [...values.nestedFilters]
                newFilters[nestedIndex] = { ...newFilters[nestedIndex], properties }
                updateGroup(newFilters)
            },
            removeNestedFilter: ({ nestedIndex }) => {
                const newFilters = values.nestedFilters.filter((_, i) => i !== nestedIndex)
                updateGroup(newFilters)
            },
            setMath: ({ selectedMath }) => {
                const groupFilter = values.groupFilter
                if (!groupFilter) {
                    return
                }

                let mathProps: Record<string, any>
                if (selectedMath) {
                    const mathDef = (values.mathDefinitions as Record<string, any>)[selectedMath]
                    const apiValues = mathTypeToApiValues(selectedMath)
                    mathProps = {
                        ...apiValues,
                        ...(apiValues.math_group_type_index === undefined && { math_group_type_index: undefined }),
                        math_property:
                            mathDef?.category === MathCategory.PropertyValue
                                ? (groupFilter.math_property ?? '$time')
                                : undefined,
                        math_insightsql:
                            mathDef?.category === MathCategory.InsightsQLExpression
                                ? (groupFilter.math_insightsql ?? 'count()')
                                : undefined,
                        math_property_type: groupFilter.math_property_type,
                    }
                } else {
                    mathProps = {
                        math: undefined,
                        math_property: undefined,
                        math_property_type: undefined,
                        math_insightsql: undefined,
                        math_group_type_index: undefined,
                    }
                }

                const newFilters = values.nestedFilters.map((f) => ({ ...f, ...mathProps }))
                updateGroup(newFilters, mathProps)
            },
            setMathProperty: ({ property, propertyType }) => {
                const groupFilter = values.groupFilter
                if (!groupFilter) {
                    return
                }

                const mathProps = {
                    math_property: property,
                    math_property_type: propertyType,
                    math_insightsql: undefined,
                }
                const newFilters = values.nestedFilters.map((f) => ({ ...f, ...mathProps }))
                updateGroup(newFilters, { math: groupFilter.math, ...mathProps })
            },
            setMathInsightsQL: ({ insightsql }) => {
                const groupFilter = values.groupFilter
                if (!groupFilter) {
                    return
                }

                const mathProps = {
                    math_property: undefined,
                    math_property_type: undefined,
                    math_insightsql: insightsql,
                }
                const newFilters = values.nestedFilters.map((f) => ({ ...f, ...mathProps }))
                updateGroup(newFilters, { math: groupFilter.math, ...mathProps })
            },
        }
    }),
])
