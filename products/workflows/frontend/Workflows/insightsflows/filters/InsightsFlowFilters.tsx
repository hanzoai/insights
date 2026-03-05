import { useValues } from 'kea'

import { PropertyFilters } from 'lib/components/PropertyFilters/PropertyFilters'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { useFeatureFlag } from 'lib/hooks/useFeatureFlag'
import { ActionFilter } from 'scenes/insights/filters/ActionFilter/ActionFilter'
import { MathAvailability } from 'scenes/insights/filters/ActionFilter/ActionFilterRow/ActionFilterRow'

import { defaultDataTableColumns } from '~/queries/nodes/DataTable/utils'
import { NodeKind } from '~/queries/schema/schema-general'
import { FilterType } from '~/types'

import { workflowLogic } from '../../workflowLogic'
import { InsightsFlowAction } from '../types'

function useSampleGlobals(): Record<string, any> {
    const { workflow } = useValues(workflowLogic)
    const workflowVariables: Record<string, any> = {}
    if (workflow?.variables) {
        for (const variable of workflow.variables) {
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
        }
    }
    return { variables: workflowVariables }
}

export type InsightsFlowFiltersProps = {
    filtersKey: string
    filters: InsightsFlowAction['filters']
    setFilters: (filters: InsightsFlowAction['filters']) => void
    typeKey?: string
    buttonCopy?: string
}

/**
 * Standard components wherever we do conditional matching to support whatever we know the customflow engine supports
 */
export function InsightsFlowEventFilters({ filters, setFilters, typeKey, buttonCopy }: InsightsFlowFiltersProps): JSX.Element {
    const shouldShowInternalEvents = useFeatureFlag('WORKFLOWS_INTERNAL_EVENT_FILTERS')
    const sampleGlobals = useSampleGlobals()

    const actionsTaxonomicGroupTypes = [TaxonomicFilterGroupType.Events, TaxonomicFilterGroupType.Actions]
    if (shouldShowInternalEvents) {
        actionsTaxonomicGroupTypes.push(TaxonomicFilterGroupType.InternalEvents)
    }

    const propertyTaxonomicGroupTypes = [
        TaxonomicFilterGroupType.EventProperties,
        TaxonomicFilterGroupType.EventFeatureFlags,
        TaxonomicFilterGroupType.Elements,
        TaxonomicFilterGroupType.PersonProperties,
        TaxonomicFilterGroupType.InsightsQLExpression,
        TaxonomicFilterGroupType.WorkflowVariables,
    ]
    if (shouldShowInternalEvents) {
        propertyTaxonomicGroupTypes.push(TaxonomicFilterGroupType.InternalEventProperties)
    }

    return (
        <ActionFilter
            filters={filters ?? {}}
            setFilters={(filters: FilterType): void => {
                // TODO: Improve the types here...
                setFilters(filters as InsightsFlowAction['filters'])
            }}
            typeKey={typeKey ?? 'customflow-filters'}
            mathAvailability={MathAvailability.None}
            hideRename
            hideDuplicate
            showNestedArrow={false}
            actionsTaxonomicGroupTypes={actionsTaxonomicGroupTypes}
            propertiesTaxonomicGroupTypes={propertyTaxonomicGroupTypes}
            propertyFiltersPopover
            buttonProps={{
                type: 'secondary',
            }}
            buttonCopy={buttonCopy ?? 'Add filter'}
            allowNonCapturedEvents
            insightsQLGlobals={sampleGlobals}
        />
    )
}

export function InsightsFlowPropertyFilters({ filtersKey, filters, setFilters }: InsightsFlowFiltersProps): JSX.Element {
    const sampleGlobals = useSampleGlobals()
    return (
        <PropertyFilters
            propertyFilters={filters?.properties}
            onChange={(properties: FilterType['properties']): void => {
                setFilters({ ...filters, properties: properties ?? [] } as InsightsFlowAction['filters'])
            }}
            pageKey={`InsightsFlowPropertyFilters.${filtersKey}`}
            taxonomicGroupTypes={[
                TaxonomicFilterGroupType.WorkflowVariables,
                TaxonomicFilterGroupType.EventProperties,
                TaxonomicFilterGroupType.EventFeatureFlags,
                TaxonomicFilterGroupType.PersonProperties,
                TaxonomicFilterGroupType.InsightsQLExpression,
                TaxonomicFilterGroupType.EventMetadata,
            ]}
            metadataSource={{
                kind: NodeKind.EventsQuery,
                select: defaultDataTableColumns(NodeKind.EventsQuery),
                after: '-30d',
            }}
            insightsQLGlobals={sampleGlobals}
        />
    )
}
